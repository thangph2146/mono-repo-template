import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng",
  description: "Điều kiện tài khoản, đặt hàng và giao nhận trên StoreSync B2B.",
};

export default function TermsLayout({ children }: { children: ReactNode }) {
  return children;
}
