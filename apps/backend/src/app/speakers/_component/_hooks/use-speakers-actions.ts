import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import type { UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";
import type { SpeakerConfirmAction, SpeakerFormValues } from "../types";
import { speakerFormSchema } from "../types";
import { zodResolver } from "@hookform/resolvers/zod";

const EMPTY_VALUES: SpeakerFormValues = {
  name: "",
  title: "",
  organization: "",
  bio: "",
  avatar: "",
  email: "",
  phone: "",
  status: 1,
};

export function buildSpeakerPayload(values: SpeakerFormValues): Record<string, unknown> {
  return {
    name: values.name.trim(),
    title: values.title?.trim() || null,
    organization: values.organization?.trim() || null,
    bio: values.bio?.trim() || null,
    avatar: values.avatar?.trim() || null,
    email: values.email?.trim() || null,
    phone: values.phone?.trim() || null,
    status: values.status,
  };
}

export function useSpeakerForm() {
  const form = useForm<SpeakerFormValues>({
    resolver: zodResolver(speakerFormSchema),
    defaultValues: EMPTY_VALUES,
  });
  const resetForm = useCallback(() => { form.reset(EMPTY_VALUES); }, [form]);
  return { form, resetForm };
}

export function useHandleConfirmAction(
  deleteMutation: UseMutationResult<unknown, Error, string>,
  restoreMutation: UseMutationResult<unknown, Error, string>,
  purgeMutation: UseMutationResult<unknown, Error, string>,
  setConfirmAction: React.Dispatch<React.SetStateAction<SpeakerConfirmAction | null>>,
) {
  return useCallback(
    async ({ kind, row }: SpeakerConfirmAction) => {
      try {
        if (kind === "delete") {
          await deleteMutation.mutateAsync(row.id);
          toast.success(`Đã đưa «${row.name}» vào thùng rác`);
        } else if (kind === "restore") {
          await restoreMutation.mutateAsync(row.id);
          toast.success(`Đã khôi phục «${row.name}»`);
        } else if (kind === "purge") {
          await purgeMutation.mutateAsync(row.id);
          toast.success(`Đã xóa vĩnh viễn «${row.name}»`);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Không thể thực hiện thao tác";
        toast.error(message);
      } finally {
        setConfirmAction(null);
      }
    },
    [deleteMutation, restoreMutation, purgeMutation, setConfirmAction],
  );
}

export function useConfirmAction() {
  const [confirmAction, setConfirmAction] = useState<SpeakerConfirmAction | null>(null);
  return { confirmAction, setConfirmAction };
}
