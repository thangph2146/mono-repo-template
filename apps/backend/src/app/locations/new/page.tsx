"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import {
  LocationFormShell,
  useLocationForm,
  buildLocationPayload,
} from "../_component";
import type { LocationFormValues } from "../_component";

function NewLocationPageInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { form } = useLocationForm();

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["locations"] });
  };

  const createMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) =>
      api.locations.create(input),
    onSuccess: async (_data, variables) => {
      await invalidateAll();
      toast.success(`Đã tạo địa điểm "${(variables.name as string)?.trim() || (variables.mapUrl as string)?.trim()}"`);
      router.push("/locations");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể tạo địa điểm";
      toast.error(message);
    },
  });

  const handleSubmit = useCallback(
    async (values: LocationFormValues) => {
      await createMutation.mutateAsync(buildLocationPayload(values));
    },
    [createMutation],
  );

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <LocationFormShell
        form={form}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending}
        editingId={null}
        onBack={() => router.push("/locations")}
        onReset={() => { form.reset(); }}
      />
    </PageSection>
  );
}

export default function NewLocationPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <NewLocationPageInner />
    </AdminPageGuard>
  );
}
