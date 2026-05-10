import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Trang cá nhân",
  description: "Thông tin đại lý và địa chỉ liên hệ.",
};

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
