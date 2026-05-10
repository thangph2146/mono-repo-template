import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Chi tiết đơn hàng",
  description: "Tiến trình giao hàng và chi tiết sản phẩm trong đơn.",
};

export default function OrderDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
