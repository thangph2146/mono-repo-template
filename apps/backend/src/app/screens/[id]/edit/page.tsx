"use client";
import { useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import { ScreenFormShell, useScreenForm, useScreenDetailQuery, buildScreenPayload } from "../../_component";
import type { ScreenFormValues } from "../../_component";
function EditScreenPageInner() {
  const router = useRouter(), params = useParams(), id = params.id as string, qc = useQueryClient(), { form } = useScreenForm();
  const { data: e, isLoading, isError, refetch } = useScreenDetailQuery(api, id);
  useEffect(() => { if (isError) { toast.error("Không tải được màn hình"); router.push("/screens"); } }, [isError, router]);
  useEffect(() => { if (!e) return; form.reset({ name: e.name ?? "", code: e.code ?? "", cameraId: e.cameraId ?? "", cameraName: e.cameraName ?? "", templateId: e.templateId ?? "", templateName: e.templateName ?? "", status: e.status ?? 1 }); }, [e, form]);
  const inv = async () => { await qc.invalidateQueries({ queryKey: ["screens"] }); };
  const mut = useMutation({ mutationFn: (i: Record<string, unknown>) => api.screens.update(id, i), onSuccess: async (_d, v) => { await inv(); toast.success(`Đã cập nhật "${v.name}"`); router.push(`/screens/${id}`); }, onError: (e: Error) => toast.error(e.message || "Lỗi") });
  const h = useCallback(async (v: ScreenFormValues) => { await mut.mutateAsync(buildScreenPayload(v)); }, [mut]);
  if (isLoading) return <PageSection max="full" className="min-w-0 flex items-center justify-center py-24"><Loader2 className="size-8 animate-spin text-muted-foreground" /></PageSection>;
  if (!e) return null;
  return (<PageSection max="full" className="min-w-0 space-y-6"><ScreenFormShell form={form} onSubmit={h} submitting={mut.isPending} editingId={id} onBack={() => router.push(`/screens/${id}`)} onReset={async () => { await refetch(); }} /></PageSection>);
}
export default function EditScreenPage() { return <AdminPageGuard roles={["super_admin", "admin", "manager"]}><EditScreenPageInner /></AdminPageGuard>; }
