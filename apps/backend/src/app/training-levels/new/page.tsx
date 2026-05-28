"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import {
  TrainingLevelFormShell,
  useTrainingLevelForm,
  buildTrainingLevelPayload,
} from "../_component";
import type { TrainingLevelFormValues } from "../_component";

function NewTrainingLevelPageInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { form } = useTrainingLevelForm();

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["training-levels"] });
  };

  const createMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) =>
      api.trainingLevels.create(input),
    onSuccess: async (_data, variables) => {
      await invalidateAll();
      toast.success(`Đã tạo bậc học "${(variables.name as string)?.trim()}"`);
      router.push("/training-levels");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể tạo bậc học";
      toast.error(message);
    },
  });

  const handleSubmit = useCallback(
    async (values: TrainingLevelFormValues) => {
      await createMutation.mutateAsync(buildTrainingLevelPayload(values));
    },
    [createMutation],
  );

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <TrainingLevelFormShell
        form={form}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending}
        editingId={null}
        onBack={() => router.push("/training-levels")}
        onReset={() => { form.reset(); }}
      />
    </PageSection>
  );
}

export default function NewTrainingLevelPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <NewTrainingLevelPageInner />
    </AdminPageGuard>
  );
}
