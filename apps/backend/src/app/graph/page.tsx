"use client";

import { GraphifyPage } from "@ui/components/graphify/graphify-page";

export default function GraphPage() {
  return <GraphifyPage apiPath="/admin/api/graphify" classes={{
    sidebar: "w-72 xl:w-80 shrink-0 border-r border-border/50 bg-card flex flex-col",
    scrollArea: "max-h-[calc(100vh-188px)]",
  }} />;
}
