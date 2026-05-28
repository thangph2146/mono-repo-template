"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import { CameraFormShell, useCameraForm, buildCameraPayload } from "../_component";
import type { CameraFormValues } from "../_component";
function NewCameraPageInner() {
  const router = useRouter(), qc = useQueryClient(), { form } = useCameraForm();
  const inv = async () => { await qc.invalidateQueries({ queryKey: ["cameras"] }); };
  const mut = useMutation({ mutationFn: (i: Record<string, unknown>) => api.cameras.create(i), onSuccess: async (_d, v) => { await inv(); toast.success(`Đã tạo camera "${v.name}"`); router.push("/cameras"); }, onError: (e: Error) => toast.error(e.message || "Lỗi") });
  const h = useCallback(async (v: CameraFormValues) => { await mut.mutateAsync(buildCameraPayload(v)); }, [mut]);
  return (<PageSection max="full" className="min-w-0 space-y-6"><CameraFormShell form={form} onSubmit={h} submitting={mut.isPending} editingId={null} onBack={() => router.push("/cameras")} onReset={() => form.reset()} /></PageSection>);
}
export default function NewCameraPage() { return <AdminPageGuard roles={["super_admin", "admin", "manager"]}><NewCameraPageInner /></AdminPageGuard>; }
