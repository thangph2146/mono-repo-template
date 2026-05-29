"use client";
import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import { ScreenFormShell, useScreenForm, buildScreenPayload } from "../_component";
import type { ScreenFormValues } from "../_component";
function NewScreenPageInner() {
  const router = useRouter(), qc = useQueryClient(), { form } = useScreenForm();
  const { data: camerasData } = useQuery({ queryKey: ["cameras", "options"], queryFn: () => api.cameras.list<{ id: string; name: string }>({ status: "active", limit: 999 }) });
  const { data: templatesData } = useQuery({ queryKey: ["templates", "options"], queryFn: () => api.templates.list<{ id: string; name: string }>({ status: "active", limit: 999 }) });
  const cameraOptions = useMemo(() => (camerasData?.items ?? []).map(c => ({ value: c.id, label: c.name })), [camerasData]);
  const templateOptions = useMemo(() => (templatesData?.items ?? []).map(t => ({ value: t.id, label: t.name })), [templatesData]);
  const inv = async () => { await qc.invalidateQueries({ queryKey: ["screens"] }); };
  const mut = useMutation({ mutationFn: (i: Record<string, unknown>) => api.screens.create(i), onSuccess: async (_d, v) => { await inv(); toast.success(`Đã tạo màn hình "${v.name}"`); router.push("/screens"); }, onError: (e: Error) => toast.error(e.message || "Lỗi") });
  const h = useCallback(async (v: ScreenFormValues) => { await mut.mutateAsync(buildScreenPayload(v)); }, [mut]);
  return (<PageSection max="full" className="min-w-0 space-y-6"><ScreenFormShell form={form} onSubmit={h} submitting={mut.isPending} editingId={null} cameraOptions={cameraOptions} templateOptions={templateOptions} onBack={() => router.push("/screens")} onReset={() => form.reset()} /></PageSection>);
}
export default function NewScreenPage() { return <AdminPageGuard roles={["super_admin", "admin", "manager"]}><NewScreenPageInner /></AdminPageGuard>; }
