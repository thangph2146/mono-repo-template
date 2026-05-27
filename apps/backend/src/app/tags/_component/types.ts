import { z } from "zod";
import type { RelatedPost } from "@workspace/api-client";

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

export interface TagDetail extends TagRow {
  postCount: number;
  posts: RelatedPost[];
}

export type { RelatedPost } from "@workspace/api-client";
