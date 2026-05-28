"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import {
  SpeakerFormShell,
  useSpeakerForm,
  buildSpeakerPayload,
} from "../_component";
import type { SpeakerFormValues } from "../_component";

function NewSpeakerPageInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { form } = useSpeakerForm();

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["speakers"] });
  };

  const createMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) =>
      api.speakers.create(input),
    onSuccess: async (_data, variables) => {
      await invalidateAll();
      toast.success(`Đã tạo diễn giả "${(variables.name as string)?.trim()}"`);
      router.push("/speakers");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể tạo diễn giả";
      toast.error(message);
    },
  });

  const handleSubmit = useCallback(
    async (values: SpeakerFormValues) => {
      await createMutation.mutateAsync(buildSpeakerPayload(values));
    },
    [createMutation],
  );

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <SpeakerFormShell
        form={form}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending}
        editingId={null}
        onBack={() => router.push("/speakers")}
        onReset={() => { form.reset(); }}
      />
    </PageSection>
  );
}

export default function NewSpeakerPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <NewSpeakerPageInner />
    </AdminPageGuard>
  );
}
