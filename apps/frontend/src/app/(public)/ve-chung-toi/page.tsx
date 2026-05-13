import type { Metadata } from "next";
import { About } from "@/features/pages/about-page";

export const metadata: Metadata = {
  title: "Về chúng tôi",
  description: "Giới thiệu hệ thống HUB.",
};

export default function AboutPage() {
  return <About />;
}
