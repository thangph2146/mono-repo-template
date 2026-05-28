"use client";

import { useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import {
  MajorsFormShell,
  useMajorForm,
  useMajorDetailQuery,
  buildMajorPayload,
} from "../../_component";
import type { MajorFormValues } from "../../_component";

function EditMajorPageInner() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { form } = useMajorForm();

  const { data: entity, isLoading, isError, refetch } = useMajorDetailQuery(api, id);

  useEffect(() => {
    if (isError) {
      toast.error("Không tải được ngành học");
      router.push("/majors");
    }
  }, [isError, router]);

  useEffect(() => {
    if (!entity) return;
    form.reset({
      name: entity.name ?? "",
      code: entity.code ?? "",
      status: entity.status ?? 1,
    });
  }, [entity, form]);

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["majors"] });
  };

  const updateMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) =>
      api.majors.update(id, input),
    onSuccess: async (_data, variables) => {
      await invalidateAll();
      toast.success(`Đã cập nhật ngành học "${(variables.name as string)?.trim()}"`);
      router.push(`/majors/${id}`);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể cập nhật ngành học";
      toast.error(message);
    },
  });

  const handleSubmit = useCallback(
    async (values: MajorFormValues) => {
      await updateMutation.mutateAsync(buildMajorPayload(values));
    },
    [updateMutation],
  );

  if (isLoading) {
    return (
      <PageSection max="full" className="min-w-0 flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </PageSection>
    );
  }

  if (!entity) return null;

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <MajorsFormShell
        form={form}
        onSubmit={handleSubmit}
        submitting={updateMutation.isPending}
        editingId={id}
        onBack={() => router.push(`/majors/${id}`)}
        onReset={async () => { await refetch(); }}
      />
    </PageSection>
  );
}

export default function EditMajorPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <EditMajorPageInner />
    </AdminPageGuard>
  );
}
