"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import {
  GuideFormShell,
  useGuideForm,
  useGuidesQuery,
  PAGE_KEY,
  sortGroupsByOrder,
} from "../_component";
import type { GuideFormData } from "../_component";

function NewGuidePageInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { form, resetForm } = useGuideForm();

  const { data } = useGuidesQuery({ api, page: 1, limit: 1000, search: "" });
  const existingGroups = sortGroupsByOrder((data?.data ?? []).filter((g) => g.pageKey === PAGE_KEY));
  const nextOrder = existingGroups.length + 1;

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "guides"] });
  };

  const createMutation = useMutation({
    mutationFn: async (input: GuideFormData) => {
      await api.guides.create({
        pageKey: PAGE_KEY,
        sectionKey: input.sectionKey,
        isVisible: input.isVisible,
        content: { ...input.content, order: nextOrder },
      });
    },
    onSuccess: async (_data, variables) => {
      await invalidateAll();
      toast.success(`Đã tạo nhóm hướng dẫn "${variables.sectionKey}"`);
      router.push("/guides");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể tạo nhóm hướng dẫn";
      toast.error(message);
    },
  });

  const handleSubmit = useCallback(async (values: GuideFormData) => {
    await createMutation.mutateAsync(values);
  }, [createMutation]);

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <GuideFormShell
        form={form}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending}
        editingId={null}
        onBack={() => router.push("/guides")}
        onReset={resetForm}
      />
    </PageSection>
  );
}

export default function NewGuidePage() {
  return (
    <AdminPageGuard permission="page_contents:create">
      <NewGuidePageInner />
    </AdminPageGuard>
  );
}
