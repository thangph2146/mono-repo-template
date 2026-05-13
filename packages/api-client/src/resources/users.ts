import type { ApiClient } from "../client";
import type {
  ChangePasswordInput,
  CreateUserInput,
  UpdateProfileInput,
  UpdateUserInput,
  User,
  UserRoleRef,
} from "../types";
import { getData, normalizePagedResult, postData, putData, deleteData } from "./_shared";

type ApiUserRole = {
  id?: string;
  name?: string;
  displayName?: string;
};

type ApiUserRow = {
  id: string | number;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  roles?: ApiUserRole[];
};

type UsersListParams = {
  q?: string;
  page?: number;
  limit?: number;
  filters?: Record<string, string>;
};

function toApiFilterQuery(filters?: Record<string, string>): Record<string, string> {
  if (!filters) return {};
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    const normalized = String(value ?? "").trim();
    if (!normalized) continue;
    query[`filter[${key}]`] = normalized;
  }
  return query;
}

function mapRole(role: ApiUserRole): UserRoleRef {
  const code = role.name?.trim() || "";
  return {
    code,
    name: role.displayName?.trim() || code,
  };
}

function mapUserRow(row: ApiUserRow): User {
  const id = row.id != null && row.id !== "" ? String(row.id) : "";
  return {
    id,
    email: row.email ?? "",
    fullName: row.name?.trim() || row.email || "",
    phone: row.phone ?? null,
    address: row.address ?? null,
    roles: (row.roles ?? []).map(mapRole),
    isActive: row.isActive ?? true,
    createdAt: row.createdAt ?? new Date(0).toISOString(),
    updatedAt: row.updatedAt ?? new Date(0).toISOString(),
    deletedAt: row.deletedAt ?? null,
  };
}

export class UsersApi {
  constructor(private readonly http: ApiClient) {}

  private async resolveRoleIds(roleCodes?: string[]): Promise<string[] | undefined> {
    if (!roleCodes?.length) return undefined;
    const payload = await this.http.get<unknown>("/admin/roles", {
      query: { page: 1, limit: 500, status: "all" },
    });
    const roles = normalizePagedResult<{ id?: string; name?: string }>(payload).items;
    const wanted = new Set(roleCodes.map((code) => code.trim().toLowerCase()));
    const roleIds = roles
      .filter((role) => role.name && wanted.has(role.name.trim().toLowerCase()))
      .map((role) => String(role.id ?? "").trim())
      .filter(Boolean);
    return roleIds.length ? roleIds : undefined;
  }

  async list(params?: UsersListParams): Promise<{ items: User[]; total: number }> {
    const payload = await this.http.get<unknown>("/admin/users", {
      query: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        search: params?.q,
        status: "active",
        ...toApiFilterQuery(params?.filters),
      },
    });
    const normalized = normalizePagedResult<ApiUserRow>(payload);
    return { items: normalized.items.map(mapUserRow), total: normalized.total };
  }

  async listTrashed(params?: UsersListParams): Promise<{ items: User[]; total: number }> {
    const payload = await this.http.get<unknown>("/admin/users", {
      query: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        search: params?.q,
        status: "deleted",
        ...toApiFilterQuery(params?.filters),
      },
    });
    const normalized = normalizePagedResult<ApiUserRow>(payload);
    return { items: normalized.items.map(mapUserRow), total: normalized.total };
  }

  async listDealers(): Promise<User[]> {
    const rows = await this.list({ page: 1, limit: 500 });
    return rows.items.filter((user) =>
      user.roles.some((role) => role.code === "customer" || role.code === "dealer"),
    );
  }

  async get(id: string | number): Promise<User> {
    const row = await getData<ApiUserRow>(this.http, `/admin/users/${id}`);
    return mapUserRow(row);
  }

  async byEmail(email: string): Promise<User | null> {
    const rows = await this.list({ q: email, page: 1, limit: 100 });
    return (
      rows.items.find(
        (user) => user.email.trim().toLowerCase() === email.trim().toLowerCase(),
      ) ?? null
    );
  }

  async create(input: CreateUserInput): Promise<User> {
    const roleIds = await this.resolveRoleIds(input.roleCodes);
    const row = await postData<ApiUserRow>(this.http, "/admin/users", {
      email: input.email,
      name: input.fullName,
      password: input.password,
      phone: input.phone,
      address: input.address,
      isActive: input.isActive,
      roleIds,
    });
    return mapUserRow(row);
  }

  async update(id: string | number, input: UpdateUserInput): Promise<User> {
    const roleIds = await this.resolveRoleIds(input.roleCodes);
    const row = await putData<ApiUserRow>(this.http, `/admin/users/${id}`, {
      email: input.email,
      name: input.fullName,
      password: input.password,
      phone: input.phone,
      address: input.address,
      isActive: input.isActive,
      roleIds,
    });
    return mapUserRow(row);
  }

  async updateProfile(id: string | number, input: UpdateProfileInput): Promise<User> {
    return this.update(id, {
      fullName: input.fullName,
      phone: input.phone,
      address: input.address,
    });
  }

  async changePassword(
    id: string | number,
    input: ChangePasswordInput,
  ): Promise<{ ok: true }> {
    await putData<ApiUserRow>(this.http, `/admin/users/${id}`, {
      password: input.newPassword,
    });
    return { ok: true };
  }

  async remove(id: string | number): Promise<void> {
    await deleteData<unknown>(this.http, `/admin/users/${id}`);
  }

  async restore(id: string | number): Promise<User> {
    const row = await postData<ApiUserRow>(this.http, `/admin/users/${id}/restore`);
    return mapUserRow(row);
  }

  async purgeTrashed(id: string | number): Promise<void> {
    await deleteData<unknown>(this.http, `/admin/users/${id}/hard-delete`);
  }
}
