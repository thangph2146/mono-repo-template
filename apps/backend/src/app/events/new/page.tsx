"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import { EventFormShell, useEventForm, buildEventPayload } from "../_component";
import type { EventFormValues } from "../_component";

function NewEventPageInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { form } = useEventForm();

  const invalidateAll = async () => { await queryClient.invalidateQueries({ queryKey: ["events"] }); };

  const createMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) => api.events.create(input),
    onSuccess: async (_data, variables) => {
      await invalidateAll();
      toast.success(`Đã tạo sự kiện "${(variables.title as string)?.trim()}"`);
      router.push("/events");
    },
    onError: (err: unknown) => { toast.error(err instanceof Error ? err.message : "Không thể tạo sự kiện"); },
  });

  const handleSubmit = useCallback(async (values: EventFormValues) => {
    const result = await createMutation.mutateAsync(buildEventPayload(values));
    const newEventId = (result as { id?: string })?.id;
    if (newEventId && values.speakers?.length) {
      await Promise.all(values.speakers.map((s) =>
        api.eventSpeakers.create({
          eventId: newEventId,
          speakerId: s.speakerId,
          role: s.role?.trim() || null,
          presentationTitle: s.presentationTitle?.trim() || null,
          duration: s.duration ?? null,
        }).catch(() => {})
      ));
    }
  }, [createMutation]);

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <EventFormShell form={form} onSubmit={handleSubmit} submitting={createMutation.isPending} editingId={null}
        onBack={() => router.push("/events")} onReset={() => { form.reset(); }} />
    </PageSection>
  );
}

export default function NewEventPage() {
  return <AdminPageGuard roles={["super_admin", "admin", "manager"]}><NewEventPageInner /></AdminPageGuard>;
}
