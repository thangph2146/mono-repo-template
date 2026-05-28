"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import {
  AcademicYearFormShell,
  useAcademicYearForm,
  buildAcademicYearPayload,
} from "../_component";
import type { AcademicYearFormValues } from "../_component";

function NewAcademicYearPageInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { form } = useAcademicYearForm();

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["academic-years"] });
  };

  const createMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) =>
      api.academicYears.create(input),
    onSuccess: async (_data, variables) => {
      await invalidateAll();
      toast.success(`Đã tạo niên khóa "${(variables.name as string)?.trim()}"`);
      router.push("/academic-years");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể tạo niên khóa";
      toast.error(message);
    },
  });

  const handleSubmit = useCallback(
    async (values: AcademicYearFormValues) => {
      await createMutation.mutateAsync(buildAcademicYearPayload(values));
    },
    [createMutation],
  );

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <AcademicYearFormShell
        form={form}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending}
        editingId={null}
        onBack={() => router.push("/academic-years")}
        onReset={() => { form.reset(); }}
      />
    </PageSection>
  );
}

export default function NewAcademicYearPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <NewAcademicYearPageInner />
    </AdminPageGuard>
  );
}
