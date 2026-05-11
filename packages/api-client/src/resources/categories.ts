import type { ApiClient } from '../client';
import type {
  Category,
  CategoryUsage,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../types';

export type CategoryListOptions = {
  activeOnly?: boolean;
  q?: string;
  page?: number;
  limit?: number;
};

export class CategoriesApi {
  constructor(private readonly http: ApiClient) {}

  list(
    options?: CategoryListOptions,
  ): Promise<Category[] | { items: Category[]; total: number }> {
    const p = new URLSearchParams();
    if (options?.activeOnly) p.set('active', 'true');
    if (options?.q?.trim()) p.set('q', options.q.trim());
    if (options?.page != null) p.set('page', String(options.page));
    if (options?.limit != null) p.set('limit', String(options.limit));
    const qs = p.toString();
    return this.http.get<Category[] | { items: Category[]; total: number }>(
      `/categories${qs ? `?${qs}` : ''}`,
    );
  }

  listTrashed(options?: {
    page?: number;
    limit?: number;
    q?: string;
  }): Promise<{ items: Category[]; total: number }> {
    const p = new URLSearchParams();
    if (options?.q?.trim()) p.set('q', options.q.trim());
    if (options?.page != null) p.set('page', String(options.page));
    if (options?.limit != null) p.set('limit', String(options.limit));
    const qs = p.toString();
    return this.http.get<{ items: Category[]; total: number }>(
      `/categories/trashed${qs ? `?${qs}` : ''}`,
    );
  }

  usage(): Promise<CategoryUsage[]> {
    return this.http.get<CategoryUsage[]>('/categories/usage');
  }

  bySlug(slug: string): Promise<Category> {
    return this.http.get<Category>(
      `/categories/slug/${encodeURIComponent(slug)}`,
    );
  }

  get(id: number): Promise<Category> {
    return this.http.get<Category>(`/categories/${id}`);
  }

  create(input: CreateCategoryInput): Promise<Category> {
    return this.http.post<Category>('/categories', input);
  }

  update(id: number, input: UpdateCategoryInput): Promise<Category> {
    return this.http.put<Category>(`/categories/${id}`, input);
  }

  restore(id: number): Promise<Category> {
    return this.http.post<Category>(`/categories/${id}/restore`, {});
  }

  remove(id: number): Promise<void> {
    return this.http.delete<void>(`/categories/${id}`);
  }

  /** Xóa vĩnh viễn (chỉ bản ghi đang trong thùng rác). */
  purgeTrashed(id: number): Promise<void> {
    return this.http.delete<void>(`/categories/${id}/permanent`);
  }
}
