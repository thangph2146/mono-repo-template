"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import {
  CourseFormShell,
  useCourseForm,
  buildCoursePayload,
} from "../_component";
import type { CourseFormValues } from "../_component";

function NewCoursePageInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { form } = useCourseForm();

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["courses"] });
  };

  const createMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) =>
      api.courses.create(input),
    onSuccess: async (_data, variables) => {
      await invalidateAll();
      toast.success(`Đã tạo khóa học "${(variables.name as string)?.trim()}"`);
      router.push("/courses");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể tạo khóa học";
      toast.error(message);
    },
  });

  const handleSubmit = useCallback(
    async (values: CourseFormValues) => {
      await createMutation.mutateAsync(buildCoursePayload(values));
    },
    [createMutation],
  );

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <CourseFormShell
        form={form}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending}
        editingId={null}
        onBack={() => router.push("/courses")}
        onReset={() => { form.reset(); }}
      />
    </PageSection>
  );
}

export default function NewCoursePage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <NewCoursePageInner />
    </AdminPageGuard>
  );
}
