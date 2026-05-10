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
  image: z.string(),
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
  image: "",
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
  image: p.images?.[0] ?? "",
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
    images: values.image.trim() ? [values.image.trim()] : [],
    stock: Math.max(0, Math.floor(values.stock)),
    basePrice: retailPrice,
    retailPrice,
    wholesalePrice,
    unitTypes,
    isActive: values.isActive,
  };
};
