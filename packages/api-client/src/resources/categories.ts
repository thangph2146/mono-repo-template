import type { ApiClient } from "../client";
import type {
  Category,
  CategoryUsage,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../types";
import { deleteData, getData, normalizePagedResult, postData, putData } from "./_shared";

type ApiCategoryRow = {
  id: string | number;
  name: string;
  slug: string;
  parentId?: string | null;
  parentName?: string | null;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number;
  _count?: { children?: number };
  postCount?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

function mapCategory(row: ApiCategoryRow): Category {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    icon: row.icon ?? null,
    sortOrder: row.sortOrder ?? 0,
    isActive: row.deletedAt == null,
    parentId: row.parentId ?? null,
    parentName: row.parentName ?? null,
    _count: { children: row._count?.children ?? 0 },
    postCount: row.postCount ?? 0,
    createdAt: row.createdAt ?? new Date(0).toISOString(),
    updatedAt: row.updatedAt ?? new Date(0).toISOString(),
    deletedAt: row.deletedAt ?? null,
  };
}

export class CategoriesApi {
  constructor(private readonly http: ApiClient) {}

  async list(params?: {
    q?: string;
    page?: number;
    limit?: number;
    activeOnly?: boolean;
  }): Promise<Category[] | { items: Category[]; total: number }> {
    const payload = await this.http.get<unknown>("/admin/categories", {
      query: {
        page: params?.page ?? 1,
        limit: params?.limit ?? (params?.activeOnly ? 500 : 20),
        search: params?.q,
        status: params?.activeOnly ? "active" : "all",
      },
    });
    const normalized = normalizePagedResult<ApiCategoryRow>(payload);
    const items = normalized.items.map(mapCategory);
    if (params?.page != null || params?.limit != null) {
      return { items, total: normalized.total };
    }
    return items;
  }

  async listTrashed(params?: {
    page?: number;
    limit?: number;
    q?: string;
  }): Promise<{ items: Category[]; total: number }> {
    const payload = await this.http.get<unknown>("/admin/categories", {
      query: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        search: params?.q,
        status: "deleted",
      },
    });
    const normalized = normalizePagedResult<ApiCategoryRow>(payload);
    return { items: normalized.items.map(mapCategory), total: normalized.total };
  }

  async usage(): Promise<CategoryUsage[]> {
    try {
      return await getData<CategoryUsage[]>(this.http, "/admin/categories/usage");
    } catch {
      return [];
    }
  }

  async get(id: string | number): Promise<Category> {
    const row = await getData<ApiCategoryRow>(this.http, `/admin/categories/${id}`);
    return mapCategory(row);
  }

  async bySlug(slug: string): Promise<Category> {
    const rows = await this.list({ activeOnly: true });
    const items = Array.isArray(rows) ? rows : rows.items;
    const found = items.find((row) => row.slug === slug);
    if (!found) {
      throw new Error(`Không tìm thấy danh mục slug=${slug}`);
    }
    return found;
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const row = await postData<ApiCategoryRow>(this.http, "/admin/categories", {
      name: input.name,
      slug: input.slug,
      description: input.description,
      parentId: input.parentId,
    });
    return mapCategory(row);
  }

  async update(id: string | number, input: UpdateCategoryInput): Promise<Category> {
    const row = await putData<ApiCategoryRow>(this.http, `/admin/categories/${id}`, {
      name: input.name,
      slug: input.slug,
      description: input.description,
      parentId: input.parentId,
    });
    return mapCategory(row);
  }

  async remove(id: string | number): Promise<void> {
    await deleteData<unknown>(this.http, `/admin/categories/${id}`);
  }

  async restore(id: string | number): Promise<Category> {
    const row = await postData<ApiCategoryRow>(
      this.http,
      `/admin/categories/${id}/restore`,
    );
    return mapCategory(row);
  }

  async purgeTrashed(id: string | number): Promise<void> {
    await deleteData<unknown>(this.http, `/admin/categories/${id}/hard-delete`);
  }
}
