import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Quyền riêng tư",
  description: "Cách StoreSync thu thập và bảo vệ dữ liệu đại lý.",
};

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children;
}
