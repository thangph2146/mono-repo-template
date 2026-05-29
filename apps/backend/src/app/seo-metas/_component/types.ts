import { z } from "zod";

export type SeoMetaRow = {
  id: string;
  page: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export interface SeoMetaConfirmAction {
  kind: "delete" | "restore" | "purge";
  row: SeoMetaRow;
}

export const seoMetaFormSchema = z.object({
  page: z.string().min(1, "Đường dẫn không được để trống"),
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  status: z.coerce.number(),
});

export type SeoMetaFormValues = z.infer<typeof seoMetaFormSchema>;

export type SeoMetaDetail = SeoMetaRow;
