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
  GuideFormShell,
  useGuideForm,
  useGuideDetailQuery,
  parseContent,
} from "../../_component";
import type { GuideFormData } from "../../_component";

function EditGuidePageInner() {
  const router = useRouter();
  const params = useParams();
  const guideId = params.id as string;
  const queryClient = useQueryClient();
  const { form } = useGuideForm();

  const { data: guide, isLoading, isError, refetch } = useGuideDetailQuery(api, guideId);

  useEffect(() => {
    if (isError) {
      toast.error("Không tải được nhóm hướng dẫn");
      router.push("/guides");
    }
  }, [isError, router]);

  useEffect(() => {
    if (!guide) return;
    form.reset({
      sectionKey: guide.sectionKey,
      isVisible: guide.isVisible,
      content: parseContent(guide.content),
    });
  }, [guide, form]);

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "guides"] });
  };

  const updateMutation = useMutation({
    mutationFn: async (input: GuideFormData) => {
      await api.guides.update(guideId, input as unknown as Record<string, unknown>);
    },
    onSuccess: async (_data, variables) => {
      await invalidateAll();
      toast.success(`Đã cập nhật nhóm hướng dẫn "${variables.sectionKey}"`);
      router.push("/guides");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể cập nhật nhóm hướng dẫn";
      toast.error(message);
    },
  });

  const handleSubmit = useCallback(async (values: GuideFormData) => {
    await updateMutation.mutateAsync(values);
  }, [updateMutation]);

  if (isLoading) {
    return (
      <PageSection max="full" className="min-w-0 flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </PageSection>
    );
  }

  if (!guide) return null;

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <GuideFormShell
        form={form}
        onSubmit={handleSubmit}
        submitting={updateMutation.isPending}
        editingId={guideId}
        onBack={() => router.push("/guides")}
        onReset={async () => {
          await refetch();
        }}
      />
    </PageSection>
  );
}

export default function EditGuidePage() {
  return (
    <AdminPageGuard permission="page_contents:update">
      <EditGuidePageInner />
    </AdminPageGuard>
  );
}
