import type { Metadata } from "next"

export const SITE_NAME = "HUB Parent"
export const SITE_TITLE = "HUB Parent - Kết nối phụ huynh và nhà trường"
export const SITE_DESCRIPTION =
  "HUB Parent là hệ thống kết nối phụ huynh với Trường Đại học Ngân hàng TP.HCM, hỗ trợ theo dõi thông tin học tập, gửi liên hệ và cập nhật thông báo từ nhà trường."

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_FRONTEND_URL ||
  "https://hub.edu.vn"
).replace(/\/$/, "")

export const OG_IMAGE_URL =
  "https://fileserver2.hub.edu.vn/IMAGES/2025/12/16/20251216103027-101020.png"

export function absoluteUrl(path = "/"): string {
  return new URL(path, `${SITE_URL}/`).toString()
}

export function buildSeoMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  image = OG_IMAGE_URL,
  type = "website",
  noIndex = false,
}: {
  title?: string
  description?: string
  path?: string
  image?: string | null
  type?: "website" | "article"
  noIndex?: boolean
} = {}): Metadata {
  const resolvedTitle = title || SITE_TITLE
  const url = absoluteUrl(path)

  return {
    title: title ? resolvedTitle : { absolute: SITE_TITLE },
    description,
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      title: resolvedTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: "vi_VN",
      type,
      images: image
        ? [
            {
              url: image,
              alt: resolvedTitle,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images: image ? [image] : undefined,
    },
  }
}
