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
  TagFormShell,
  useTagForm,
  useTagDetailQuery,
  buildTagPayload,
} from "../../_component";
import type { TagFormValues } from "../../_component";

function EditTagPageInner() {
  const router = useRouter();
  const params = useParams();
  const tagId = params.id as string;
  const queryClient = useQueryClient();
  const { form } = useTagForm();

  const { data: tag, isLoading, isError, refetch } = useTagDetailQuery(api, tagId);

  useEffect(() => {
    if (isError) {
      toast.error("Không tải được thẻ");
      router.push("/tags");
    }
  }, [isError, router]);

  useEffect(() => {
    if (!tag) return;
    form.reset({
      name: tag.name ?? "",
      slug: tag.slug ?? "",
    });
  }, [tag, form]);

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["media", "tags"] });
  };

  const updateMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) =>
      api.tags.update(tagId, input),
    onSuccess: async (_data, variables) => {
      await invalidateAll();
      toast.success(`Đã cập nhật thẻ "${(variables.name as string)?.trim()}"`);
      router.push(`/tags/${tagId}`);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể cập nhật thẻ";
      toast.error(message);
    },
  });

  const handleSubmit = useCallback(
    async (values: TagFormValues) => {
      await updateMutation.mutateAsync(buildTagPayload(values));
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

  if (!tag) return null;

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <TagFormShell
        form={form}
        onSubmit={handleSubmit}
        submitting={updateMutation.isPending}
        editingId={tagId}
        onBack={() => router.push(`/tags/${tagId}`)}
        onReset={async () => {
          await refetch();
        }}
      />
    </PageSection>
  );
}

export default function EditTagPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <EditTagPageInner />
    </AdminPageGuard>
  );
}
