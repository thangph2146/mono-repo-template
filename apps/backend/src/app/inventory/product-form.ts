import { z } from "zod";
import type { CreateProductInput, Product, ProductUnitType } from "@/lib/api";

const nonNegInt = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return 0;
  const n = Number(val);
  return Number.isFinite(n) ? Math.floor(n) : 0;
}, z.number().int().min(0));

const minOneInt = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return 1;
  const n = Number(val);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.floor(n));
}, z.number().int().min(1, "Quy đổi ≥ 1"));

/** Dung lượng nhị phân tối đa mỗi ảnh (file upload hoặc payload base64 sau giải mã). */
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

const DATA_IMAGE_URL_PREFIX = /^data:image\/[a-z0-9.+-]+;base64,/i;

function approxBase64DecodedByteLength(b64Part: string): number {
  const clean = b64Part.replace(/\s/g, "");
  if (!clean.length) return 0;
  let padding = 0;
  if (clean.endsWith("==")) padding = 2;
  else if (clean.endsWith("=")) padding = 1;
  return Math.max(0, Math.floor((clean.length * 3) / 4) - padding);
}

/** Kiểm tra một ô ảnh (trống = hợp lệ khi form còn slot). */
export function validateProductImageField(raw: string): true | string {
  const s = raw.trim();
  if (s.length === 0) return true;
  if (/^https?:\/\//i.test(s)) {
    if (s.length > 16_384) return "URL ảnh quá dài";
    try {
      new URL(s);
    } catch {
      return "URL không hợp lệ";
    }
    return true;
  }
  if (!DATA_IMAGE_URL_PREFIX.test(s)) {
    return "Chỉ chấp nhận URL http(s) hoặc ảnh base64 (data:image/...;base64,...)";
  }
  const lower = s.toLowerCase();
  const marker = "base64,";
  const j = lower.indexOf(marker);
  if (j === -1) return "Chuỗi base64 không hợp lệ";
  const b64 = s.slice(j + marker.length);
  const decodedLen = approxBase64DecodedByteLength(b64);
  if (decodedLen > MAX_PRODUCT_IMAGE_BYTES) {
    return "Ảnh base64 vượt quá 5MB (kích thước sau giải mã)";
  }
  return true;
}

const unitRowSchema = z.object({
  type: z.string().min(1, "Nhập loại đơn vị (vd: thùng)"),
  label: z.string(),
  qtyPerUnit: minOneInt,
  retailPrice: nonNegInt,
  wholesalePrice: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((v) => {
      if (v === "" || v === null || v === undefined) return null;
      const n = typeof v === "string" ? Number(v) : v;
      if (!Number.isFinite(n) || n <= 0) return null;
      return Math.floor(n);
    }),
  minWholesaleQty: nonNegInt,
});

export const productFormSchema = z.object({
  sku: z.string().min(1, "Mã SKU bắt buộc"),
  name: z.string().min(1, "Tên sản phẩm bắt buộc"),
  brand: z.string(),
  category: z.string().min(1, "Chọn danh mục"),
  unit: z.string().min(1, "Đơn vị quy chuẩn bắt buộc"),
  description: z.string(),
  /** URL hoặc data URL base64 (ảnh từ máy), tối đa ~5MB mỗi ảnh. */
  images: z
    .array(z.string())
    .superRefine((arr, ctx) => {
      arr.forEach((raw, i) => {
        const v = validateProductImageField(raw);
        if (v !== true) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: v,
            path: [i],
          });
        }
      });
    }),
  stock: nonNegInt,
  isActive: z.boolean(),
  unitTypes: z
    .array(unitRowSchema)
    .min(1, "Cần ít nhất một đơn vị tính"),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const defaultUnitRow = (): ProductFormValues["unitTypes"][number] => ({
  type: "thùng",
  label: "",
  qtyPerUnit: 1,
  retailPrice: 0,
  wholesalePrice: null,
  minWholesaleQty: 0,
});

export const defaultProductForm = (
  categorySlug: string,
): ProductFormValues => ({
  sku: "",
  name: "",
  brand: "",
  category: categorySlug,
  unit: "thùng",
  description: "",
  images: [""],
  stock: 0,
  isActive: true,
  unitTypes: [defaultUnitRow()],
});

export const productToFormValues = (p: Product): ProductFormValues => ({
  sku: p.sku,
  name: p.name,
  brand: p.brand ?? "",
  category: p.category,
  unit: p.unit ?? "thùng",
  description: p.description ?? "",
  images:
    p.images && p.images.length > 0
      ? p.images.map((u) => (typeof u === "string" ? u : String(u)))
      : [""],
  stock: p.stock,
  isActive: p.isActive ?? true,
  unitTypes:
    p.unitTypes && p.unitTypes.length > 0
      ? p.unitTypes.map((u) => ({
          type: u.type,
          label: u.label,
          qtyPerUnit: u.qtyPerUnit,
          retailPrice: u.retailPrice,
          wholesalePrice: u.wholesalePrice ?? null,
          minWholesaleQty: u.minWholesaleQty ?? 0,
        }))
      : [defaultUnitRow()],
});

export const formValuesToCreatePayload = (
  values: ProductFormValues,
): CreateProductInput => {
  const unitTypes: ProductUnitType[] = values.unitTypes.map((u) => ({
    type: u.type.trim(),
    label: (u.label || u.type).trim(),
    qtyPerUnit: Math.max(1, Math.floor(u.qtyPerUnit)),
    retailPrice: Math.max(0, Math.floor(u.retailPrice)),
    wholesalePrice: u.wholesalePrice,
    minWholesaleQty: Math.max(0, Math.floor(u.minWholesaleQty)),
  }));
  const baseUnit = unitTypes[0];
  const retailPrice = baseUnit?.retailPrice ?? 0;
  const wholesalePrice = baseUnit?.wholesalePrice ?? retailPrice;
  return {
    sku: values.sku.trim(),
    name: values.name.trim(),
    brand: values.brand.trim() || null,
    category: values.category,
    unit: values.unit.trim(),
    description: values.description.trim() || null,
    images: values.images
      .map((u) => u.trim())
      .filter((u) => u.length > 0),
    stock: Math.max(0, Math.floor(values.stock)),
    basePrice: retailPrice,
    retailPrice,
    wholesalePrice,
    unitTypes,
    isActive: values.isActive,
  };
};
