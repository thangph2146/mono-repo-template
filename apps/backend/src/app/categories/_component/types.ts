import type { ChildCategory, RelatedPost, CategoryTreeNode } from "@workspace/api-client";

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parentName: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  icon: string | null;
  sortOrder: number;
  _count: { children: number };
  postCount: number;
  subRows?: CategoryRow[];
}

export type CategoryTreeOption = CategoryTreeNode;

export interface CategoryConfirmAction {
  kind: "delete" | "restore" | "purge";
  row: CategoryRow;
}

export interface FormState {
  id?: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  parentId: string;
}

export interface CategoryDetail extends CategoryRow {
  children: ChildCategory[];
  posts: RelatedPost[];
}

export type { ChildCategory, RelatedPost } from "@workspace/api-client";
