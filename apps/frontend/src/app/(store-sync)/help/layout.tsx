import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Trợ giúp",
  description: "Hướng dẫn đặt hàng sỉ, theo dõi đơn và cập nhật thông tin.",
};

export default function HelpLayout({ children }: { children: ReactNode }) {
  return children;
}
