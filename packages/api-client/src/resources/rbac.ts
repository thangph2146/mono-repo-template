import type { ApiClient } from "../client";
import type { RbacPermission, RbacRole } from "../types";
import { normalizePagedResult } from "./_shared";

type ApiRoleRow = {
  id?: string | number;
  name?: string;
  displayName?: string;
  description?: string | null;
  permissions?: unknown;
};

function normalizePermissionCodes(value: unknown): string[] {
  const visit = (input: unknown): string[] => {
    if (Array.isArray(input)) {
      return input.flatMap((item) => visit(item));
    }
    if (typeof input !== "string") {
      return [];
    }

    const trimmed = input.trim();
    if (!trimmed) {
      return [];
    }

    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'))
    ) {
      try {
        return visit(JSON.parse(trimmed));
      } catch {
        return [trimmed];
      }
    }

    return [trimmed];
  };

  return [...new Set(visit(value))].sort((a, b) => a.localeCompare(b));
}

function mapRole(row: ApiRoleRow): RbacRole {
  return {
    id: Number(row.id ?? 0),
    code: row.name ?? "",
    name: row.displayName ?? row.name ?? "",
    description: row.description ?? null,
    permissions: normalizePermissionCodes(row.permissions),
  };
}

export class RbacApi {
  constructor(private readonly http: ApiClient) {}

  private async listRoleRows(): Promise<ApiRoleRow[]> {
    const payload = await this.http.get<unknown>("/admin/roles", {
      query: { page: 1, limit: 500, status: "all" },
    });
    return normalizePagedResult<ApiRoleRow>(payload).items;
  }

  async listPermissions(): Promise<RbacPermission[]> {
    try {
      const rows = await this.listRoleRows();
      const codes = [...new Set(rows.flatMap((row) => normalizePermissionCodes(row.permissions)))];

      return codes.map((code, index) => ({
        id: index + 1,
        code,
        name: code,
        description: null,
      }));
    } catch {
      return [];
    }
  }

  async listRoles(): Promise<RbacRole[]> {
    try {
      const rows = await this.listRoleRows();
      return rows.map(mapRole);
    } catch {
      return [];
    }
  }
}
