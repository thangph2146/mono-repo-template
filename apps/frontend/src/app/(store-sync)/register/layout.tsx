import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Đăng ký đại lý",
  description: "Tạo tài khoản để nhận báo giá khuyến mãi và đặt hàng.",
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
