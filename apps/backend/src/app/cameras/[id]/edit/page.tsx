"use client";
import { useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import { CameraFormShell, useCameraForm, useCameraDetailQuery, buildCameraPayload } from "../../_component";
import type { CameraFormValues } from "../../_component";
function EditCameraPageInner() {
  const router = useRouter(), params = useParams(), id = params.id as string, qc = useQueryClient(), { form } = useCameraForm();
  const { data: e, isLoading, isError, refetch } = useCameraDetailQuery(api, id);
  useEffect(() => { if (isError) { toast.error("Không tải được camera"); router.push("/cameras"); } }, [isError, router]);
  useEffect(() => { if (!e) return; form.reset({ name: e.name ?? "", code: e.code ?? "", ipAddress: e.ipAddress ?? "", port: e.port ?? undefined, username: e.username ?? "", password: "", status: e.status ?? 1 }); }, [e, form]);
  const inv = async () => { await qc.invalidateQueries({ queryKey: ["cameras"] }); };
  const mut = useMutation({ mutationFn: (i: Record<string, unknown>) => api.cameras.update(id, i), onSuccess: async (_d, v) => { await inv(); toast.success(`Đã cập nhật "${v.name}"`); router.push(`/cameras/${id}`); }, onError: (e: Error) => toast.error(e.message || "Lỗi") });
  const h = useCallback(async (v: CameraFormValues) => { await mut.mutateAsync(buildCameraPayload(v)); }, [mut]);
  if (isLoading) return <PageSection max="full" className="min-w-0 flex items-center justify-center py-24"><Loader2 className="size-8 animate-spin text-muted-foreground" /></PageSection>;
  if (!e) return null;
  return (<PageSection max="full" className="min-w-0 space-y-6"><CameraFormShell form={form} onSubmit={h} submitting={mut.isPending} editingId={id} onBack={() => router.push(`/cameras/${id}`)} onReset={async () => { await refetch(); }} /></PageSection>);
}
export default function EditCameraPage() { return <AdminPageGuard roles={["super_admin", "admin", "manager"]}><EditCameraPageInner /></AdminPageGuard>; }
