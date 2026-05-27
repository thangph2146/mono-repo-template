"use client";

import { GraphifyPage } from "@ui/components/graphify/graphify-page";

export default function GraphPage() {
  return <GraphifyPage classes={{
    scrollArea: "max-h-[calc(100vh-115px)]",
    graphArea: "h-[calc(100vh-58px)]",
  }} />;
}
