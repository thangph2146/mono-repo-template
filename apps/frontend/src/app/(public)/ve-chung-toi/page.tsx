import type { Metadata } from "next"
import { About } from "@/features/pages/about-page"
import { buildSeoMetadata } from "@/lib/seo"

export const metadata: Metadata = buildSeoMetadata({
  title: "Về HUB Parent",
  description:
    "Giới thiệu HUB Parent - cổng thông tin kết nối phụ huynh với Trường Đại học Ngân hàng TP.HCM, hỗ trợ đồng hành cùng sinh viên trong quá trình học tập.",
  path: "/ve-chung-toi",
})

export default function AboutPage() {
  return <About />
}
