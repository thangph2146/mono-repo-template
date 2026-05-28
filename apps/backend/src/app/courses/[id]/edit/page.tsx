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
  CourseFormShell,
  useCourseForm,
  useCourseDetailQuery,
  buildCoursePayload,
} from "../../_component";
import type { CourseFormValues } from "../../_component";

function EditCoursePageInner() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { form } = useCourseForm();

  const { data: entity, isLoading, isError, refetch } = useCourseDetailQuery(api, id);

  useEffect(() => {
    if (isError) {
      toast.error("Không tải được khóa học");
      router.push("/courses");
    }
  }, [isError, router]);

  useEffect(() => {
    if (!entity) return;
    form.reset({
      name: entity.name ?? "",
      startYear: entity.startYear ?? undefined,
      endYear: entity.endYear ?? undefined,
      departmentId: entity.departmentId ?? undefined,
      status: entity.status ?? 1,
    });
  }, [entity, form]);

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["courses"] });
  };

  const updateMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) =>
      api.courses.update(id, input),
    onSuccess: async (_data, variables) => {
      await invalidateAll();
      toast.success(`Đã cập nhật khóa học "${(variables.name as string)?.trim()}"`);
      router.push(`/courses/${id}`);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể cập nhật khóa học";
      toast.error(message);
    },
  });

  const handleSubmit = useCallback(
    async (values: CourseFormValues) => {
      await updateMutation.mutateAsync(buildCoursePayload(values));
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
      <CourseFormShell
        form={form}
        onSubmit={handleSubmit}
        submitting={updateMutation.isPending}
        editingId={id}
        onBack={() => router.push(`/courses/${id}`)}
        onReset={async () => { await refetch(); }}
      />
    </PageSection>
  );
}

export default function EditCoursePage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <EditCoursePageInner />
    </AdminPageGuard>
  );
}
