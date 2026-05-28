"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import {
  TrainingSystemFormShell,
  useTrainingSystemForm,
  buildTrainingSystemPayload,
} from "../_component";
import type { TrainingSystemFormValues } from "../_component";

function NewTrainingSystemPageInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { form } = useTrainingSystemForm();

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["training-systems"] });
  };

  const createMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) =>
      api.trainingSystems.create(input),
    onSuccess: async (_data, variables) => {
      await invalidateAll();
      toast.success(`Đã tạo hệ đào tạo "${(variables.name as string)?.trim()}"`);
      router.push("/training-systems");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể tạo hệ đào tạo";
      toast.error(message);
    },
  });

  const handleSubmit = useCallback(
    async (values: TrainingSystemFormValues) => {
      await createMutation.mutateAsync(buildTrainingSystemPayload(values));
    },
    [createMutation],
  );

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <TrainingSystemFormShell
        form={form}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending}
        editingId={null}
        onBack={() => router.push("/training-systems")}
        onReset={() => { form.reset(); }}
      />
    </PageSection>
  );
}

export default function NewTrainingSystemPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <NewTrainingSystemPageInner />
    </AdminPageGuard>
  );
}
