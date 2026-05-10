import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Danh mục sỉ",
  description: "Tìm kiếm, lọc và đặt hàng sỉ/lẻ theo đơn vị.",
};

export default function CatalogLayout({ children }: { children: ReactNode }) {
  return children;
}
