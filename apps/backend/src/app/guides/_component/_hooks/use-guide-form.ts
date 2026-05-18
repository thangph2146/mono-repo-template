import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { GuideFormData } from "../types";

export const guideFormSchema = z.object({
  sectionKey: z.string().min(1, "Mã nhóm không được để trống"),
  isVisible: z.boolean(),
  content: z.object({
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    order: z.number().optional(),
    steps: z.array(z.object({
      order: z.number(),
      title: z.string(),
      description: z.string(),
      imageUrl: z.string().nullable().optional(),
    })).optional(),
  }),
});

export type GuideFormValues = GuideFormData;

const EMPTY_VALUES: GuideFormValues = {
  sectionKey: "",
  isVisible: true,
  content: { title: null, description: null, order: 0, steps: [] },
};

export function useGuideForm() {
  const form = useForm<GuideFormData>({
    resolver: zodResolver(guideFormSchema),
    defaultValues: EMPTY_VALUES,
  });
  const resetForm = useCallback(() => { form.reset(EMPTY_VALUES); }, [form]);
  return { form, resetForm };
}

export function buildGuidePayload(values: GuideFormData): Record<string, unknown> {
  return {
    sectionKey: values.sectionKey.trim(),
    isVisible: values.isVisible,
    content: values.content,
  };
}
