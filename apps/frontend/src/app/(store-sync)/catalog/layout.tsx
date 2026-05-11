import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Danh mục sỉ",
  description: "Tìm kiếm, lọc và đặt hàng theo đơn vị (giá ban đầu / khuyến mãi).",
};

export default function CatalogLayout({ children }: { children: ReactNode }) {
  return children;
}
