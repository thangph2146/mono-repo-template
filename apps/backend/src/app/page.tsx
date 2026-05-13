"use client";

import { LayoutDashboard } from "lucide-react";
import { ApiScopeNotice } from "@/components/api-scope-notice";

export default function AdminDashboardPage() {
  return (
    <ApiScopeNotice
      title="Tong quan he thong"
      subtitle="Bang dieu khien da duoc rut gon theo pham vi entity cua API HUB."
      icon={LayoutDashboard}
    />
  );
}
