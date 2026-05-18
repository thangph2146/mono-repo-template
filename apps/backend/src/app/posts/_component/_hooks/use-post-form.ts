"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSerializedEditorState, createParagraphNode } from "../utils";

export const postFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Tiêu đề không được để trống"),
  slug: z.string(),
  excerpt: z.string(),
  image: z.string(),
  content: z.any(),
  published: z.boolean(),
  publishedAt: z.string(),
  categoryIds: z.array(z.string()),
  tagIds: z.array(z.string()),
});

export type PostFormValues = z.infer<typeof postFormSchema>;

const EMPTY_VALUES: PostFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  image: "",
  content: createSerializedEditorState([createParagraphNode()]),
  published: false,
  publishedAt: "",
  categoryIds: [],
  tagIds: [],
};

export function usePostForm(defaultValues?: Partial<PostFormValues>) {
  return useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: { ...EMPTY_VALUES, ...defaultValues },
  });
}
