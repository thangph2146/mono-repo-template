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

export type PagedResult<T> = { items: T[]; total: number };

export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  error?: string | null;
  data?: T;
};

export type TagsApiShape = {
  data: TagRow[];
  pagination?: { total?: number };
};

export type TagFormValues = {
  id?: string;
  name: string;
  slug: string;
};

export const EMPTY_TAG_FORM: TagFormValues = { name: "", slug: "" };
