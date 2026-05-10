import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Giỏ hàng",
  description: "Xem lại sản phẩm và số lượng trước khi đặt đơn.",
};

export default function CartLayout({ children }: { children: ReactNode }) {
  return children;
}
