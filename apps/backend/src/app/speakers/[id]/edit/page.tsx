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
  SpeakerFormShell,
  useSpeakerForm,
  useSpeakerDetailQuery,
  buildSpeakerPayload,
} from "../../_component";
import type { SpeakerFormValues } from "../../_component";

function EditSpeakerPageInner() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { form } = useSpeakerForm();

  const { data: entity, isLoading, isError, refetch } = useSpeakerDetailQuery(api, id);

  useEffect(() => {
    if (isError) {
      toast.error("Không tải được diễn giả");
      router.push("/speakers");
    }
  }, [isError, router]);

  useEffect(() => {
    if (!entity) return;
    form.reset({
      name: entity.name ?? "",
      title: entity.title ?? "",
      organization: entity.organization ?? "",
      bio: entity.bio ?? "",
      avatar: entity.avatar ?? "",
      email: entity.email ?? "",
      phone: entity.phone ?? "",
      status: entity.status ?? 1,
    });
  }, [entity, form]);

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["speakers"] });
  };

  const updateMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) =>
      api.speakers.update(id, input),
    onSuccess: async (_data, variables) => {
      await invalidateAll();
      toast.success(`Đã cập nhật diễn giả "${(variables.name as string)?.trim()}"`);
      router.push(`/speakers/${id}`);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể cập nhật diễn giả";
      toast.error(message);
    },
  });

  const handleSubmit = useCallback(
    async (values: SpeakerFormValues) => {
      await updateMutation.mutateAsync(buildSpeakerPayload(values));
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
      <SpeakerFormShell
        form={form}
        onSubmit={handleSubmit}
        submitting={updateMutation.isPending}
        editingId={id}
        onBack={() => router.push(`/speakers/${id}`)}
        onReset={async () => { await refetch(); }}
      />
    </PageSection>
  );
}

export default function EditSpeakerPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <EditSpeakerPageInner />
    </AdminPageGuard>
  );
}
