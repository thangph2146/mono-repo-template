import type { ApiClient } from '../client';
import type {
  AuthUser,
  CreateUserInput,
  UpdateUserInput,
  User,
  UserCartPayload,
  UserCredentials,
} from '../types';

export class UsersApi {
  constructor(private readonly http: ApiClient) {}

  list(): Promise<User[]> {
    return this.http.get<User[]>('/users');
  }

  byRoleCode(roleCode: string): Promise<User[]> {
    return this.http.get<User[]>(
      `/users/by-role/${encodeURIComponent(roleCode)}`,
    );
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

  remove(id: number): Promise<void> {
    return this.http.delete<void>(`/users/${id}`);
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
