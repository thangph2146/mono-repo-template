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

export interface CategoryTreeOption {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  subRows?: CategoryTreeOption[];
}

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

export interface PagedResult<T> {
  items: T[];
  total: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  error?: string | null;
  data?: T;
}

export interface PagedApiShape<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
