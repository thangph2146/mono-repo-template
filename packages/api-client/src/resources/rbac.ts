import type { ApiClient } from '../client';
import type { RbacPermission, RbacRole } from '../types';

export class RbacApi {
  constructor(private readonly http: ApiClient) {}

  listPermissions(): Promise<RbacPermission[]> {
    return this.http.get<RbacPermission[]>('/rbac/permissions');
  }

  listRoles(): Promise<RbacRole[]> {
    return this.http.get<RbacRole[]>('/rbac/roles');
  }
}
