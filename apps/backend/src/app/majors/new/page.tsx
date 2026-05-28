"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import {
  MajorsFormShell,
  useMajorForm,
  buildMajorPayload,
} from "../_component";
import type { MajorFormValues } from "../_component";

function NewMajorPageInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { form } = useMajorForm();

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["majors"] });
  };

  const createMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) =>
      api.majors.create(input),
    onSuccess: async (_data, variables) => {
      await invalidateAll();
      toast.success(`Đã tạo ngành học "${(variables.name as string)?.trim()}"`);
      router.push("/majors");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể tạo ngành học";
      toast.error(message);
    },
  });

  const handleSubmit = useCallback(
    async (values: MajorFormValues) => {
      await createMutation.mutateAsync(buildMajorPayload(values));
    },
    [createMutation],
  );

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <MajorsFormShell
        form={form}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending}
        editingId={null}
        onBack={() => router.push("/majors")}
        onReset={() => { form.reset(); }}
      />
    </PageSection>
  );
}

export default function NewMajorPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <NewMajorPageInner />
    </AdminPageGuard>
  );
}
