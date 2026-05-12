import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sơ đồ mã nguồn",
  description: "Khám phá cấu trúc mã nguồn Hub B2B (Graphify).",
};

export default function GraphLayout({ children }: { children: ReactNode }) {
  return children;
}
