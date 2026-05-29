"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import { EventFormShell, useEventForm, useEventDetailQuery, buildEventPayload } from "../../_component";
import type { EventDetail, EventFormValues, EventFormSpeaker } from "../../_component";

function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function normalizeContent(
  value: unknown,
): EventFormValues["content"] {
  if (value && typeof value === "object" && "root" in value) return value
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === "object" && "root" in parsed) return parsed
    } catch {}
  }
  return {
    root: {
      children: [
        {
          children: [],
          direction: null,
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  }
}

function buildFormValues(entity: EventDetail, speakers: EventFormSpeaker[]): EventFormValues {
  return {
    title: entity.title ?? "",
    slug: entity.slug ?? "",
    description: entity.description ?? "",
    startDate: toDatetimeLocal(entity.startDate),
    endDate: toDatetimeLocal(entity.endDate),
    checkinStart: toDatetimeLocal(entity.checkinStart),
    checkinEnd: toDatetimeLocal(entity.checkinEnd),
    registrationStart: toDatetimeLocal(entity.registrationStart),
    registrationEnd: toDatetimeLocal(entity.registrationEnd),
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
    content: normalizeContent(entity.content),
    speakers,
  };
}

function EditEventPageInner() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { form } = useEventForm();
  const { data: entity, isLoading, isError, refetch } = useEventDetailQuery(api, id);
  const [existingSpeakers, setExistingSpeakers] = useState<{ id: string; speakerId: number }[]>([]);

  useEffect(() => { if (isError) { toast.error("Không tải được sự kiện"); router.push("/events"); } }, [isError, router]);

  useEffect(() => {
    if (!entity) return;
    api.eventSpeakers.list<EventFormSpeaker & { id: string }>({ eventId: id, limit: 100 })
      .then((res) => {
        const assignments = res.items.map((a) => ({
          id: a.id,
          speakerId: a.speakerId as number,
        }));
        setExistingSpeakers(assignments);
        const speakers = res.items.map((a) => ({
          speakerId: a.speakerId as number,
          role: (a.role as string) ?? undefined,
          presentationTitle: (a.presentationTitle as string) ?? undefined,
          duration: a.duration != null ? (a.duration as number) : undefined,
        }));
        form.reset(buildFormValues(entity, speakers));
      })
      .catch(() => form.reset(buildFormValues(entity, [])));
  }, [entity, form, id]);

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
    const newSpeakers = values.speakers ?? [];
    const existingMap = new Map(existingSpeakers.map((a) => [a.speakerId, a]));
    const newIds = newSpeakers.map((s) => s.speakerId);
    const existingIds = existingSpeakers.map((a) => a.speakerId);
    const toCreate = newSpeakers.filter((s) => !existingIds.includes(s.speakerId));
    const toUpdate = newSpeakers.filter((s) => existingIds.includes(s.speakerId));
    const toRemove = existingSpeakers.filter((a) => !newIds.includes(a.speakerId));
    await Promise.all([
      ...toCreate.map((s) =>
        api.eventSpeakers.create({
          eventId: id,
          speakerId: s.speakerId,
          role: s.role?.trim() || null,
          presentationTitle: s.presentationTitle?.trim() || null,
          duration: s.duration ?? null,
        }).catch(() => {})
      ),
      ...toUpdate.map((s) => {
        const existing = existingMap.get(s.speakerId);
        if (!existing) return Promise.resolve();
        return api.eventSpeakers.update(existing.id, {
          role: s.role?.trim() || null,
          presentationTitle: s.presentationTitle?.trim() || null,
          duration: s.duration ?? null,
        }).catch(() => {});
      }),
      ...toRemove.map((a) => api.eventSpeakers.remove(a.id).catch(() => {})),
    ]);
  }, [updateMutation, existingSpeakers, id]);

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
