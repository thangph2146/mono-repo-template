import type { Metadata } from "next"
import { HomeClient } from "@/features/pages/home-page"
import { buildSeoMetadata, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/seo"

export const metadata: Metadata = buildSeoMetadata({
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  path: "/",
})

export default function PublicHomePage() {
  return <HomeClient />
}
