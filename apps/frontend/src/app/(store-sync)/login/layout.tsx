import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập tài khoản đại lý Hub B2B.",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
