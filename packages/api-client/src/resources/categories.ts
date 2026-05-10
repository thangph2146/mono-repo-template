import type { ApiClient } from '../client';
import type {
  Category,
  CategoryUsage,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../types';

export class CategoriesApi {
  constructor(private readonly http: ApiClient) {}

  list(options?: { activeOnly?: boolean }): Promise<Category[]> {
    const query = options?.activeOnly ? '?active=true' : '';
    return this.http.get<Category[]>(`/categories${query}`);
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

  remove(id: number): Promise<void> {
    return this.http.delete<void>(`/categories/${id}`);
  }
}
