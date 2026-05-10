import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Thanh toán COD",
  description: "Xác nhận thông tin giao hàng và đặt đơn thu tiền khi nhận.",
};

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return children;
}
