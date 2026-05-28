"use client";
import { useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import { TemplateFormShell, useTemplateForm, useTemplateDetailQuery, buildTemplatePayload } from "../../_component";
import type { TemplateFormValues } from "../../_component";
function EditTemplatePageInner() {
  const router = useRouter(), params = useParams(), id = params.id as string, qc = useQueryClient(), { form } = useTemplateForm();
  const { data: e, isLoading, isError, refetch } = useTemplateDetailQuery(api, id);
  useEffect(() => { if (isError) { toast.error("Không tải được mẫu"); router.push("/templates"); } }, [isError, router]);
  useEffect(() => { if (!e) return; form.reset({ name: e.name ?? "", code: e.code ?? "", status: e.status ?? 1 }); }, [e, form]);
  const inv = async () => { await qc.invalidateQueries({ queryKey: ["templates"] }); };
  const mut = useMutation({ mutationFn: (i: Record<string, unknown>) => api.templates.update(id, i), onSuccess: async (_d, v) => { await inv(); toast.success(`Đã cập nhật "${v.name}"`); router.push(`/templates/${id}`); }, onError: (e: Error) => toast.error(e.message || "Lỗi") });
  const h = useCallback(async (v: TemplateFormValues) => { await mut.mutateAsync(buildTemplatePayload(v)); }, [mut]);
  if (isLoading) return <PageSection max="full" className="min-w-0 flex items-center justify-center py-24"><Loader2 className="size-8 animate-spin text-muted-foreground" /></PageSection>;
  if (!e) return null;
  return (<PageSection max="full" className="min-w-0 space-y-6"><TemplateFormShell form={form} onSubmit={h} submitting={mut.isPending} editingId={id} onBack={() => router.push(`/templates/${id}`)} onReset={async () => { await refetch(); }} /></PageSection>);
}
export default function EditTemplatePage() { return <AdminPageGuard roles={["super_admin", "admin", "manager"]}><EditTemplatePageInner /></AdminPageGuard>; }
