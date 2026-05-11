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
  promoMode: z.enum(["none", "price", "gift"]).default("none"),
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
  giftProductId: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((v) => {
      if (v === "" || v === null || v === undefined) return null;
      const n = typeof v === "string" ? Number(v) : v;
      return Number.isFinite(n) ? Number(n) : null;
    }),
  giftProductName: z.string(),
  giftProductSku: z.string(),
  giftProductUnitType: z.string(),
  giftQty: minOneInt,
}).superRefine((row, ctx) => {
  if (row.promoMode === "price") {
    const wholesale = row.wholesalePrice;
    if (wholesale == null || wholesale <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wholesalePrice"],
        message: "Chọn giá khuyến mãi thì phải nhập giá KM > 0",
      });
      return;
    }
    if (wholesale >= row.retailPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wholesalePrice"],
        message: "Giá khuyến mãi phải thấp hơn giá ban đầu",
      });
    }
  }

  if (row.promoMode === "gift") {
    if (!row.giftProductName.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["giftProductName"],
        message: "Nhập tên sản phẩm quà tặng",
      });
    }
    if (!row.giftProductUnitType.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["giftProductUnitType"],
        message: "Chọn đơn vị quà tặng",
      });
    }
  }
});

export const productFormSchema = z.object({
  sku: z.string().min(1, "Mã SKU bắt buộc"),
  name: z.string().min(1, "Tên sản phẩm bắt buộc"),
  brand: z.string(),
  origin: z.string(),
  category: z.string().min(1, "Chọn danh mục"),
  unit: z.string().min(1, "Đơn vị quy chuẩn bắt buộc"),
  description: z.string(),
  /** Tag hiển thị trên cửa hàng (cùng trường `coupons` trong API). */
  coupons: z.array(z.string().max(64, "Mỗi tag tối đa 64 ký tự")),
  /** Hướng dẫn quà kèm / KM cho shipper & kho (trường `fulfillmentNote`). */
  fulfillmentNote: z.string().max(2000, "Tối đa 2000 ký tự"),
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
  promoMode: "none",
  retailPrice: 0,
  wholesalePrice: null,
  minWholesaleQty: 0,
  giftProductName: "",
  giftProductSku: "",
  giftProductUnitType: "",
  giftProductId: null,
  giftQty: 1,
});

export const defaultProductForm = (
  categorySlug: string,
): ProductFormValues => ({
  sku: "",
  name: "",
  brand: "",
  origin: "",
  category: categorySlug,
  unit: "thùng",
  description: "",
  images: [""],
  stock: 0,
  isActive: true,
  coupons: [""],
  fulfillmentNote: "",
  unitTypes: [defaultUnitRow()],
});

type GiftRule = {
  minWholesaleQty: number;
  giftQty: number;
  giftProductName: string;
  giftProductSku: string;
  giftProductUnitType: string;
};

const GIFT_NOTE_HEADER = "KM quà tặng theo đơn vị:";
const PRICE_NOTE_HEADER = "KM giá theo đơn vị:";
const AUTO_GIFT_TAG_PREFIX = "tặng ";
const LEGACY_AUTO_GIFT_TAG_NAME_PREFIX = "qua-tang-";
const AUTO_PRICE_TAG_PREFIX = "giảm ";
const LEGACY_AUTO_PRICE_TAG_PREFIX = "giam-";
const LEGACY_AUTO_GIFT_TAG_PREFIX = "km-qua:";

function normalizeUnitType(raw: string): string {
  return raw.trim().toLocaleLowerCase("vi");
}

function parseGiftRulesFromFulfillmentNote(note: string): Map<string, GiftRule> {
  const rules = new Map<string, GiftRule>();
  if (!note.trim()) return rules;

  for (const rawLine of note.split("\n")) {
    const line = rawLine.trim();
    if (!line.startsWith("- Từ ")) continue;
    const m = line.match(/^- Từ\s+(\d+)\s+(.+?):\s+tặng\s+(\d+)\s+(.+)\.$/);
    if (!m) continue;

    const minWholesaleQty = Math.max(1, Number(m[1]) || 1);
    const unitType = m[2].trim();
    const giftQty = Math.max(1, Number(m[3]) || 1);
    let giftPayload = m[4].trim();
    let giftProductUnitType = "";
    let giftProductSku = "";

    const unitMarker = " - đơn vị quà: ";
    const unitAt = giftPayload.lastIndexOf(unitMarker);
    if (unitAt >= 0) {
      giftProductUnitType = giftPayload.slice(unitAt + unitMarker.length).trim();
      giftPayload = giftPayload.slice(0, unitAt).trim();
    }

    const skuMatch = giftPayload.match(/\(SKU:\s*([^)]+)\)\s*$/);
    if (skuMatch) {
      giftProductSku = skuMatch[1].trim();
      giftPayload = giftPayload.slice(0, skuMatch.index).trim();
    }

    const giftProductName = giftPayload.trim();
    if (!giftProductName) continue;

    rules.set(normalizeUnitType(unitType), {
      minWholesaleQty,
      giftQty,
      giftProductName,
      giftProductSku,
      giftProductUnitType,
    });
  }

  return rules;
}

function stripGeneratedNoteBlocks(note: string): string {
  const raw = note.trim();
  if (!raw) return "";
  const lines = raw.split("\n");
  const headers = new Set([GIFT_NOTE_HEADER, PRICE_NOTE_HEADER]);
  const kept: string[] = [];

  for (let i = 0; i < lines.length; ) {
    const current = lines[i]!.trim();
    if (!headers.has(current)) {
      kept.push(lines[i]!);
      i += 1;
      continue;
    }
    i += 1;
    while (i < lines.length && lines[i]!.trim().startsWith("- Từ ")) i += 1;
  }
  return kept
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function clampTag(tag: string): string {
  const normalized = tag.trim().replace(/\s+/g, " ");
  return normalized.length > 64 ? normalized.slice(0, 64) : normalized;
}

function buildAutoGiftTags(
  rows: Pick<
    ProductFormValues["unitTypes"][number],
    "promoMode" | "giftProductName" | "giftQty" | "minWholesaleQty" | "type"
  >[],
): string[] {
  const tags = new Set<string>();
  rows.forEach((row) => {
    if (row.promoMode !== "gift") return;
    const giftName = row.giftProductName.trim();
    const giftQty = Math.max(1, Math.floor(Number(row.giftQty ?? 1) || 1));
    const minQty = Math.max(1, Math.floor(Number(row.minWholesaleQty ?? 0) || 0));
    const unitLabel = row.type.trim() || "đơn vị";
    if (!giftName) return;
    tags.add(
      `${AUTO_GIFT_TAG_PREFIX}${giftQty} ${giftName} khi mua từ ${minQty} ${unitLabel}`,
    );
  });
  return Array.from(tags)
    .map(clampTag)
    .filter((tag) => tag.length > 0);
}

function discountPercentTag(
  retailPrice: number,
  wholesalePrice: number,
  minWholesaleQty: number,
  unitType: string,
): string | null {
  const retail = Math.max(0, Math.floor(Number(retailPrice) || 0));
  const wholesale = Math.max(0, Math.floor(Number(wholesalePrice) || 0));
  if (retail <= 0 || wholesale <= 0 || wholesale >= retail) return null;
  const pct = Math.round(((retail - wholesale) / retail) * 100);
  if (pct <= 0) return null;
  const minQty = Math.max(1, Math.floor(Number(minWholesaleQty ?? 0) || 0));
  const unitLabel = unitType.trim() || "đơn vị";
  return `${AUTO_PRICE_TAG_PREFIX}${pct}% khi mua từ ${minQty} ${unitLabel}`;
}

function buildAutoPriceTags(
  rows: Pick<
    ProductFormValues["unitTypes"][number],
    "promoMode" | "retailPrice" | "wholesalePrice" | "minWholesaleQty" | "type"
  >[],
): string[] {
  const tags = new Set<string>();
  rows.forEach((row) => {
    if (row.promoMode !== "price" || row.wholesalePrice == null) return;
    const tag = discountPercentTag(
      row.retailPrice,
      row.wholesalePrice,
      row.minWholesaleQty,
      row.type,
    );
    if (tag) tags.add(tag);
  });
  return Array.from(tags).map(clampTag).filter(Boolean);
}

function stripAutoGiftTags(tags: string[]): string[] {
  return tags.filter((raw) => {
    const normalized = raw.trim().toLocaleLowerCase("vi");
    if (normalized.startsWith(LEGACY_AUTO_GIFT_TAG_PREFIX)) return false;
    if (normalized.startsWith(AUTO_GIFT_TAG_PREFIX)) return false;
    if (normalized.startsWith(LEGACY_AUTO_GIFT_TAG_NAME_PREFIX)) return false;
    if (normalized.startsWith(AUTO_PRICE_TAG_PREFIX)) return false;
    if (normalized.startsWith(LEGACY_AUTO_PRICE_TAG_PREFIX)) return false;
    return true;
  });
}

export const productToFormValues = (p: Product): ProductFormValues => ({
  // Khôi phục lại dòng quà tặng từ fulfillmentNote để mở form không bị lệch trạng thái.
  ...(() => {
    const giftRulesByUnit = parseGiftRulesFromFulfillmentNote(
      p.fulfillmentNote ?? "",
    );
    return {
      sku: p.sku,
      name: p.name,
      brand: p.brand ?? "",
      origin: p.origin ?? "",
      category: p.category,
      unit: p.unit ?? "thùng",
      description: p.description ?? "",
      images:
        p.images && p.images.length > 0
          ? p.images.map((u) => (typeof u === "string" ? u : String(u)))
          : [""],
      stock: p.stock,
      isActive: p.isActive ?? true,
      coupons:
        p.coupons && p.coupons.length > 0
          ? stripAutoGiftTags(
              p.coupons.map((c) => (typeof c === "string" ? c : String(c))),
            )
          : [""],
      fulfillmentNote: stripGeneratedNoteBlocks(p.fulfillmentNote ?? ""),
      unitTypes:
        p.unitTypes && p.unitTypes.length > 0
          ? p.unitTypes.map((u) => {
              const giftRule = giftRulesByUnit.get(normalizeUnitType(u.type));
              const isPricePromo = u.wholesalePrice != null && u.wholesalePrice > 0;
              const promoMode = giftRule ? "gift" : isPricePromo ? "price" : "none";
              return {
                type: u.type,
                label: u.label,
                qtyPerUnit: u.qtyPerUnit,
                promoMode,
                retailPrice: u.retailPrice,
                wholesalePrice: isPricePromo ? u.wholesalePrice : null,
                minWholesaleQty:
                  giftRule?.minWholesaleQty ?? (u.minWholesaleQty ?? 0),
                giftProductName: giftRule?.giftProductName ?? "",
                giftProductSku: giftRule?.giftProductSku ?? "",
                giftProductUnitType: giftRule?.giftProductUnitType ?? "",
                giftProductId: null,
                giftQty: giftRule?.giftQty ?? 1,
              };
            })
          : [defaultUnitRow()],
    };
  })(),
});

export const formValuesToCreatePayload = (
  values: ProductFormValues,
): CreateProductInput => {
  const giftRules: string[] = [];
  const priceRules: string[] = [];
  const unitTypes: ProductUnitType[] = values.unitTypes.map((u) => {
    if (u.promoMode === "gift") {
      giftRules.push(
        `- Từ ${Math.max(1, Math.floor(u.minWholesaleQty || 0))} ${u.type.trim() || "đơn vị"}: tặng ${Math.max(1, Math.floor(u.giftQty || 1))} ${u.giftProductName.trim()}${u.giftProductSku.trim() ? ` (SKU: ${u.giftProductSku.trim()})` : ""}${u.giftProductUnitType.trim() ? ` - đơn vị quà: ${u.giftProductUnitType.trim()}` : ""}.`,
      );
    }
    if (u.promoMode === "price" && u.wholesalePrice != null) {
      const retail = Math.max(0, Math.floor(u.retailPrice));
      const wholesale = Math.max(0, Math.floor(u.wholesalePrice));
      if (retail > 0 && wholesale > 0 && wholesale < retail) {
        const pct = Math.round(((retail - wholesale) / retail) * 100);
        priceRules.push(
          `- Từ ${Math.max(1, Math.floor(u.minWholesaleQty || 0))} ${u.type.trim() || "đơn vị"}: giảm ${pct}% (${retail}đ -> ${wholesale}đ).`,
        );
      }
    }

    return {
      type: u.type.trim(),
      label: (u.label || u.type).trim(),
      qtyPerUnit: Math.max(1, Math.floor(u.qtyPerUnit)),
      retailPrice: Math.max(0, Math.floor(u.retailPrice)),
      wholesalePrice: u.promoMode === "price" ? u.wholesalePrice : null,
      minWholesaleQty:
        u.promoMode === "none"
          ? 0
          : Math.max(1, Math.floor(u.minWholesaleQty || 0)),
    };
  });
  const baseUnit = unitTypes[0];
  const retailPrice = baseUnit?.retailPrice ?? 0;
  const wholesalePrice = baseUnit?.wholesalePrice ?? retailPrice;
  const couponList = values.coupons
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  const autoGiftTags = buildAutoGiftTags(values.unitTypes);
  const autoPriceTags = buildAutoPriceTags(values.unitTypes);
  const mergedCouponList = Array.from(
    new Set([...couponList, ...autoGiftTags, ...autoPriceTags]),
  );
  const generatedGiftNote =
    giftRules.length > 0
      ? `${GIFT_NOTE_HEADER}\n${giftRules.join("\n")}`
      : "";
  const generatedPriceNote =
    priceRules.length > 0
      ? `${PRICE_NOTE_HEADER}\n${priceRules.join("\n")}`
      : "";
  const manualFulfillmentNote = stripGeneratedNoteBlocks(values.fulfillmentNote);
  const mergedFulfillmentNote = [
    manualFulfillmentNote,
    generatedGiftNote,
    generatedPriceNote,
  ]
    .filter((x) => x.length > 0)
    .join("\n\n");

  return {
    sku: values.sku.trim(),
    name: values.name.trim(),
    brand: values.brand.trim() || null,
    origin: values.origin.trim() || null,
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
    coupons: mergedCouponList.length > 0 ? mergedCouponList : null,
    fulfillmentNote: mergedFulfillmentNote || null,
    isActive: values.isActive,
  };
};
