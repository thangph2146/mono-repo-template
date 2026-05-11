import type { ApiClient } from '../client';
import type {
  AuthUser,
  ChangePasswordInput,
  CreateUserInput,
  UpdateProfileInput,
  UpdateUserInput,
  User,
  UserCartPayload,
  UserCredentials,
} from '../types';

export type UserListOptions = {
  q?: string;
  page?: number;
  limit?: number;
};

export class UsersApi {
  constructor(private readonly http: ApiClient) {}

  list(
    options?: UserListOptions,
  ): Promise<User[] | { items: User[]; total: number }> {
    const p = new URLSearchParams();
    if (options?.q?.trim()) p.set('q', options.q.trim());
    if (options?.page != null) p.set('page', String(options.page));
    if (options?.limit != null) p.set('limit', String(options.limit));
    const qs = p.toString();
    return this.http.get<User[] | { items: User[]; total: number }>(
      `/users${qs ? `?${qs}` : ''}`,
    );
  }

  listTrashed(options?: {
    page?: number;
    limit?: number;
    q?: string;
  }): Promise<{ items: User[]; total: number }> {
    const p = new URLSearchParams();
    if (options?.q?.trim()) p.set('q', options.q.trim());
    if (options?.page != null) p.set('page', String(options.page));
    if (options?.limit != null) p.set('limit', String(options.limit));
    const qs = p.toString();
    return this.http.get<{ items: User[]; total: number }>(
      `/users/trashed${qs ? `?${qs}` : ''}`,
    );
  }

  byRoleCode(roleCode: string): Promise<User[]> {
    return this.http.get<User[]>(
      `/users/by-role/${encodeURIComponent(roleCode)}`,
    );
  }

  /** Đại lý (role customer) — yêu cầu `products.read`. */
  listDealers(): Promise<User[]> {
    return this.http.get<User[]>('/users/dealers');
  }

  byEmail(email: string): Promise<User | null> {
    return this.http.get<User | null>(
      `/users/email/${encodeURIComponent(email)}`,
    );
  }

  get(id: number): Promise<User> {
    return this.http.get<User>(`/users/${id}`);
  }

  create(input: CreateUserInput): Promise<User> {
    return this.http.post<User>('/users', input);
  }

  update(id: number, input: UpdateUserInput): Promise<User> {
    return this.http.put<User>(`/users/${id}`, input);
  }

  updateProfile(id: number, input: UpdateProfileInput): Promise<User> {
    return this.http.put<User>(`/users/${id}/profile`, input);
  }

  changePassword(id: number, input: ChangePasswordInput): Promise<{ ok: true }> {
    return this.http.post<{ ok: true }>(
      `/users/${id}/change-password`,
      input,
    );
  }

  restore(id: number): Promise<User> {
    return this.http.post<User>(`/users/${id}/restore`, {});
  }

  remove(id: number): Promise<void> {
    return this.http.delete<void>(`/users/${id}`);
  }

  /** Xóa vĩnh viễn (chỉ tài khoản đang trong thùng rác). */
  purgeTrashed(id: number): Promise<void> {
    return this.http.delete<void>(`/users/${id}/permanent`);
  }

  login(credentials: UserCredentials): Promise<AuthUser | null> {
    return this.http.post<AuthUser | null>('/users/login', credentials);
  }

  getCart(userId: number): Promise<UserCartPayload> {
    return this.http.get<UserCartPayload>(`/users/${userId}/cart`);
  }

  saveCart(userId: number, body: UserCartPayload): Promise<{ ok: true }> {
    return this.http.put<{ ok: true }>(`/users/${userId}/cart`, body);
  }
}
