/**
 * Nội dung công khai « Trung tâm hỗ trợ đại lý » — dùng chung storefront, API và cổng admin.
 * (Số điện thoại / kênh Zalo mang tính minh họa; thay bằng số thật khi triển khai.)
 */

export const DEALER_SUPPORT_TITLE = "Trung tâm hỗ trợ đại lý";

export const DEALER_SUPPORT_SUBTITLE =
  "StoreSync hỗ trợ đại lý trong suốt vòng đời đơn hàng: đăng ký, đặt hàng, giao nhận, thanh toán và sau bán.";

/** Mô tả ngắn cho SEO / thẻ meta. */
export const DEALER_SUPPORT_META_DESCRIPTION =
  "Tổng đài, Zalo OA và kênh liên hệ StoreSync dành cho đại lý B2B.";

/** Gợi ý dòng phụ trên form đăng ký đại lý (cửa hàng). */
export const DEALER_SUPPORT_REGISTER_HINT =
  "Sau khi gửi yêu cầu, bạn có thể liên hệ Trung tâm hỗ trợ đại lý để được kích hoạt tài khoản nhanh hơn.";

export const DEALER_SUPPORT_HOTLINE = {
  /** Hiển thị có khoảng trắng (UX). */
  display: "1900 1500",
  /** `tel:` không chứa khoảng trắng. */
  telHref: "tel:19001500",
  cardTitle: "Tổng đài đại lý",
  cardDescription: "Tiếp nhận hỗ trợ đặt hàng, vận đơn, khiếu nại và cập nhật hồ sơ.",
  hoursLine: "Mọi ngày trong tuần · 7:00 – 22:00 (GMT+7)",
  ctaLabel: "Gọi tổng đài",
} as const;

export const DEALER_SUPPORT_ZALO = {
  cardTitle: "Zalo Official Account",
  cardDescription: "Gửi hình ảnh đơn hàng, biên nhận hoặc mô tả sự cố để CSKH xử lý nhanh.",
  handleLine: "OA: StoreSync Đại lý",
  responseNote: "Ưu tiên phản hồi trong giờ làm việc tổng đài",
  ctaLabel: "Mở Zalo OA",
  /** Thay bằng link OA thật khi có (vd. https://zalo.me/...). */
  oaUrl: "https://zalo.me",
} as const;

export const DEALER_SUPPORT_ACCOUNT_MANAGER = {
  sectionTitle: "Kinh doanh khu vực",
  leadLine:
    "Sau khi tài khoản được duyệt, hệ thống gán nhân viên kinh doanh phụ trách theo tỉnh/thành trên hồ sơ.",
  namePlaceholder: "Liên hệ tổng đài để biết NV phụ trách",
  regionLine:
    "Tên và SĐT NVKD cụ thể được cấp sau khi xác minh hồ sơ — vui lòng gọi tổng đài.",
  directPhoneLabel: "Đường dây nóng đại lý",
  directPhoneDisplay: "1900 1500",
  directTelHref: "tel:19001500",
  helpCtaLabel: "Câu hỏi thường gặp",
  helpHrefPath: "/help",
} as const;

/**
 * Kiểu payload công khai (đồng bộ API / storefront / admin).
 * Giữ khớp với {@link getDealerSupportPublicPayload}.
 */
export interface DealerSupportPublicPayload {
  title: string;
  subtitle: string;
  hotline: {
    display: string;
    telHref: string;
    cardTitle: string;
    cardDescription: string;
    hoursLine: string;
    ctaLabel: string;
  };
  zalo: {
    cardTitle: string;
    cardDescription: string;
    handleLine: string;
    responseNote: string;
    ctaLabel: string;
    oaUrl: string;
  };
  accountManager: {
    sectionTitle: string;
    leadLine: string;
    namePlaceholder: string;
    regionLine: string;
    directPhoneLabel: string;
    directPhoneDisplay: string;
    directTelHref: string;
    helpCtaLabel: string;
    helpHrefPath: string;
  };
}

function mergeStringRecord<T extends Record<string, string>>(
  defaults: T,
  patch: unknown,
): T {
  const out = { ...defaults };
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return out;
  }
  const p = patch as Record<string, unknown>;
  for (const key of Object.keys(defaults)) {
    const v = p[key];
    if (typeof v === "string") {
      (out as Record<string, string>)[key] = v;
    }
  }
  return out;
}

/** Gộp ghi đè (JSON DB) lên giá trị mặc định từ code. */
export function mergeDealerSupportOverrides(
  defaults: DealerSupportPublicPayload,
  stored: unknown,
): DealerSupportPublicPayload {
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
    return {
      title: defaults.title,
      subtitle: defaults.subtitle,
      hotline: { ...defaults.hotline },
      zalo: { ...defaults.zalo },
      accountManager: { ...defaults.accountManager },
    };
  }
  const s = stored as Record<string, unknown>;
  return {
    title: typeof s.title === "string" ? s.title : defaults.title,
    subtitle: typeof s.subtitle === "string" ? s.subtitle : defaults.subtitle,
    hotline: mergeStringRecord(defaults.hotline, s.hotline),
    zalo: mergeStringRecord(defaults.zalo, s.zalo),
    accountManager: mergeStringRecord(defaults.accountManager, s.accountManager),
  };
}

function recordDiff<T extends Record<string, string>>(
  defaults: T,
  merged: T,
): Partial<T> | undefined {
  const out: Partial<T> = {};
  let any = false;
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    if (merged[key] !== defaults[key]) {
      out[key] = merged[key];
      any = true;
    }
  }
  return any ? out : undefined;
}

/**
 * Tính phần ghi đè tối thiểu để lưu DB (chỉ khác mặc định).
 */
export function computeDealerSupportDiff(
  defaults: DealerSupportPublicPayload,
  merged: DealerSupportPublicPayload,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (merged.title !== defaults.title) out.title = merged.title;
  if (merged.subtitle !== defaults.subtitle) out.subtitle = merged.subtitle;
  const h = recordDiff(defaults.hotline, merged.hotline);
  if (h) out.hotline = h;
  const z = recordDiff(defaults.zalo, merged.zalo);
  if (z) out.zalo = z;
  const a = recordDiff(defaults.accountManager, merged.accountManager);
  if (a) out.accountManager = a;
  return out;
}

/** Payload JSON cho API / ứng dụng khác (không phụ thuộc UI). */
export function getDealerSupportPublicPayload(): DealerSupportPublicPayload {
  return {
    title: DEALER_SUPPORT_TITLE,
    subtitle: DEALER_SUPPORT_SUBTITLE,
    hotline: { ...DEALER_SUPPORT_HOTLINE },
    zalo: { ...DEALER_SUPPORT_ZALO },
    accountManager: { ...DEALER_SUPPORT_ACCOUNT_MANAGER },
  };
}
