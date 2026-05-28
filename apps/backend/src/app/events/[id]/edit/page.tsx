"use client";

import { useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import { EventFormShell, useEventForm, useEventDetailQuery, buildEventPayload } from "../../_component";
import type { EventFormValues } from "../../_component";

function EditEventPageInner() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { form } = useEventForm();
  const { data: entity, isLoading, isError, refetch } = useEventDetailQuery(api, id);

  useEffect(() => { if (isError) { toast.error("Không tải được sự kiện"); router.push("/events"); } }, [isError, router]);

  useEffect(() => {
    if (!entity) return;
    form.reset({
      title: entity.title ?? "",
      slug: entity.slug ?? "",
      description: entity.description ?? "",
      startDate: entity.startDate ?? "",
      endDate: entity.endDate ?? "",
      checkinStart: entity.checkinStart ?? "",
      checkinEnd: entity.checkinEnd ?? "",
      registrationStart: entity.registrationStart ?? "",
      registrationEnd: entity.registrationEnd ?? "",
      organizer: entity.organizer ?? "",
      location: entity.location ?? "",
      address: entity.address ?? "",
      status: entity.status ?? 1,
      allowCheckin: entity.allowCheckin ?? true,
      allowCheckout: entity.allowCheckout ?? true,
      requireFaceId: entity.requireFaceId ?? false,
      maxParticipants: entity.maxParticipants ?? 0,
      format: entity.format ?? 0,
      onlineLink: entity.onlineLink ?? "",
      content: entity.content ?? null,
    });
  }, [entity, form]);

  const invalidateAll = async () => { await queryClient.invalidateQueries({ queryKey: ["events"] }); };

  const updateMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) => api.events.update(id, input),
    onSuccess: async (_data, variables) => {
      await invalidateAll();
      toast.success(`Đã cập nhật sự kiện "${(variables.title as string)?.trim()}"`);
      router.push(`/events/${id}`);
    },
    onError: (err: unknown) => { toast.error(err instanceof Error ? err.message : "Không thể cập nhật sự kiện"); },
  });

  const handleSubmit = useCallback(async (values: EventFormValues) => {
    await updateMutation.mutateAsync(buildEventPayload(values));
  }, [updateMutation]);

  if (isLoading) return <PageSection max="full" className="min-w-0 flex items-center justify-center py-24"><Loader2 className="size-8 animate-spin text-muted-foreground" /></PageSection>;
  if (!entity) return null;

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <EventFormShell form={form} onSubmit={handleSubmit} submitting={updateMutation.isPending} editingId={id}
        onBack={() => router.push(`/events/${id}`)} onReset={async () => { await refetch(); }} />
    </PageSection>
  );
}

export default function EditEventPage() {
  return <AdminPageGuard roles={["super_admin", "admin", "manager"]}><EditEventPageInner /></AdminPageGuard>;
}
