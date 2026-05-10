import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Hỗ trợ",
  description: "Tổng đài và kênh liên hệ StoreSync cho đại lý.",
};

export default function SupportLayout({ children }: { children: ReactNode }) {
  return children;
}
