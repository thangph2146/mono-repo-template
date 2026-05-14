import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/seo"

const publicRoutes = [
  { path: "/", priority: 1 },
  { path: "/bai-viet", priority: 0.8 },
  { path: "/ve-chung-toi", priority: 0.7 },
  { path: "/huong-dan-su-dung", priority: 0.7 },
  { path: "/lien-he", priority: 0.6 },
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return publicRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.path === "/bai-viet" ? "daily" : "weekly",
    priority: route.priority,
  }))
}
