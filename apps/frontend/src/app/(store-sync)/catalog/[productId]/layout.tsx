import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Chi tiết sản phẩm",
  description: "Thông tin sản phẩm, đơn vị và giá sỉ/lẻ.",
};

export default function ProductDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
