import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import type { UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";
import type { EventConfirmAction, EventFormValues } from "../types";
import { eventFormSchema } from "../types";
import { zodResolver } from "@hookform/resolvers/zod";

const EMPTY_EDITOR_STATE = {
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

const EMPTY_VALUES: EventFormValues = {
  title: "", slug: "", description: "",
  startDate: "", endDate: "", checkinStart: "", checkinEnd: "",
  registrationStart: "", registrationEnd: "",
  organizer: "", location: "", address: "",
  status: 1, allowCheckin: true, allowCheckout: true, requireFaceId: false,
  maxParticipants: 0, format: 0, onlineLink: "", content: EMPTY_EDITOR_STATE, speakers: [],
};

export function buildEventPayload(values: EventFormValues): Record<string, unknown> {
  return {
    title: values.title.trim(),
    slug: values.slug?.trim() || null,
    description: values.description?.trim() || null,
    startDate: values.startDate || null,
    endDate: values.endDate || null,
    checkinStart: values.checkinStart || null,
    checkinEnd: values.checkinEnd || null,
    registrationStart: values.registrationStart || null,
    registrationEnd: values.registrationEnd || null,
    organizer: values.organizer?.trim() || null,
    location: values.location?.trim() || null,
    address: values.address?.trim() || null,
    status: values.status,
    allowCheckin: values.allowCheckin,
    allowCheckout: values.allowCheckout,
    requireFaceId: values.requireFaceId,
    maxParticipants: values.maxParticipants,
    format: values.format ?? 0,
    onlineLink: values.onlineLink?.trim() || null,
    content: values.content ?? null,
  };
}

export function useEventForm() {
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: EMPTY_VALUES,
  });
  const resetForm = useCallback(() => { form.reset(EMPTY_VALUES); }, [form]);
  return { form, resetForm };
}

export function useHandleConfirmAction(
  deleteMutation: UseMutationResult<unknown, Error, string>,
  restoreMutation: UseMutationResult<unknown, Error, string>,
  purgeMutation: UseMutationResult<unknown, Error, string>,
  setConfirmAction: React.Dispatch<React.SetStateAction<EventConfirmAction | null>>,
) {
  return useCallback(
    async ({ kind, row }: EventConfirmAction) => {
      try {
        if (kind === "delete") { await deleteMutation.mutateAsync(row.id); toast.success(`Đã đưa «${row.title}» vào thùng rác`); }
        else if (kind === "restore") { await restoreMutation.mutateAsync(row.id); toast.success(`Đã khôi phục «${row.title}»`); }
        else if (kind === "purge") { await purgeMutation.mutateAsync(row.id); toast.success(`Đã xóa vĩnh viễn «${row.title}»`); }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Không thể thực hiện thao tác");
      } finally { setConfirmAction(null); }
    },
    [deleteMutation, restoreMutation, purgeMutation, setConfirmAction],
  );
}

export function useConfirmAction() {
  const [confirmAction, setConfirmAction] = useState<EventConfirmAction | null>(null);
  return { confirmAction, setConfirmAction };
}
