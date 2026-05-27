"use client";

import { GraphifyPage } from "@ui/components/graphify/graphify-page";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";

function GraphPageInner() {
  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <GraphifyPage apiPath="/admin/api/graphify" classes={{
        sidebar: "w-72 xl:w-80 shrink-0 border-r border-border/50 bg-card flex flex-col",
        scrollArea: "max-h-[calc(100vh-188px)]",
      }} />
    </PageSection>
  );
}

export default function GraphPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin"]}>
      <GraphPageInner />
    </AdminPageGuard>
  );
}
