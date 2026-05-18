import { z } from "zod";

export type TagRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type TagTreeRow = TagRow & {
  isGroup?: boolean;
  itemCount?: number;
  subRows?: TagTreeRow[];
};

export interface TagConfirmAction {
  kind: "delete" | "restore" | "purge";
  row: TagRow;
}

export const tagFormSchema = z.object({
  name: z.string().min(1, "Tên thẻ không được để trống"),
  slug: z.string(),
});

export type TagFormValues = z.infer<typeof tagFormSchema>;

export interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface TagDetail extends TagRow {
  postCount: number;
  posts: RelatedPost[];
}

export interface PagedResult<T> {
  items: T[];
  total: number;
}

export interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  error?: string | null;
  data?: T;
}

export interface PagedApiShape<T> {
  data: T[];
  pagination?: { total?: number };
}

export type TagsApiShape = {
  data: TagRow[];
  pagination?: { total?: number };
};
