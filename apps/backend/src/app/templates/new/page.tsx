"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import { TemplateFormShell, useTemplateForm, buildTemplatePayload } from "../_component";
import type { TemplateFormValues } from "../_component";
function NewTemplatePageInner() {
  const router = useRouter(), qc = useQueryClient(), { form } = useTemplateForm();
  const inv = async () => { await qc.invalidateQueries({ queryKey: ["templates"] }); };
  const mut = useMutation({ mutationFn: (i: Record<string, unknown>) => api.templates.create(i), onSuccess: async (_d, v) => { await inv(); toast.success(`Đã tạo mẫu "${v.name}"`); router.push("/templates"); }, onError: (e: Error) => toast.error(e.message || "Lỗi") });
  const h = useCallback(async (v: TemplateFormValues) => { await mut.mutateAsync(buildTemplatePayload(v)); }, [mut]);
  return (<PageSection max="full" className="min-w-0 space-y-6"><TemplateFormShell form={form} onSubmit={h} submitting={mut.isPending} editingId={null} onBack={() => router.push("/templates")} onReset={() => form.reset()} /></PageSection>);
}
export default function NewTemplatePage() { return <AdminPageGuard roles={["super_admin", "admin", "manager"]}><NewTemplatePageInner /></AdminPageGuard>; }
