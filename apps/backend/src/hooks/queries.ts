"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query"
import {
  api,
  type ChangePasswordInput,
  type RbacPermission,
  type RbacRole,
  type UpdateProfileInput,
  type User,
  type ContactRequest,
  type ParentStudent,
  type ParentStudentAdmin,
} from "@/lib/api"

export const queryKeys = {
  staffProfile: (id: string | number) =>
    ["users", "staff-profile", id] as const,
  staffUserList: () => ["users", "staff-list"] as const,
  usersTrashed: () => ["users", "trashed"] as const,
  rbacCatalog: () => ["rbac", "catalog"] as const,
  contactRequests: (params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
    trash?: boolean
    filters?: Record<string, string>
  }) => ["contact-requests", params] as const,
  myStudents: () => ["my-students"] as const,
  parentStudents: (params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
  }) => ["parent-students", params] as const,
}

export type UsersListData = { items: User[]; total: number }
export type RbacCatalog = { permissions: RbacPermission[]; roles: RbacRole[] }
export type ContactRequestsData = { items: ContactRequest[]; total: number }
export type MyStudentsData = { items: ParentStudent[] }
export type ParentStudentsData = { items: ParentStudentAdmin[]; total: number }

export const useStaffProfile = (userId: string | number | null | undefined) =>
  useQuery<User, Error>({
    queryKey: queryKeys.staffProfile(userId ?? "missing"),
    queryFn: () => api.users.get(userId as string | number),
    enabled:
      (typeof userId === "string" && userId.trim().length > 0) ||
      (typeof userId === "number" && userId > 0),
  })

export const useUpdateStaffProfile = (): UseMutationResult<
  User,
  Error,
  { id: string | number; input: UpdateProfileInput }
> => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }) => api.users.updateProfile(id, input),
    onSuccess: (u) => {
      qc.setQueryData(queryKeys.staffProfile(u.id), u)
    },
  })
}

export const useChangeStaffPassword = (): UseMutationResult<
  { ok: true },
  Error,
  { id: string | number; input: ChangePasswordInput }
> => {
  return useMutation({
    mutationFn: ({ id, input }) => api.users.changePassword(id, input),
  })
}

export const useRbacCatalog = (opts?: { enabled?: boolean }) =>
  useQuery<RbacCatalog, Error>({
    queryKey: queryKeys.rbacCatalog(),
    queryFn: async () => {
      const [permissions, roles] = await Promise.all([
        api.rbac.listPermissions(),
        api.rbac.listRoles(),
      ])
      return { permissions, roles }
    },
    enabled: opts?.enabled ?? true,
  })

export const useStaffUserList = (opts?: {
  enabled?: boolean
  listParams?: {
    q?: string
    page?: number
    limit?: number
    filters?: Record<string, string>
  }
}): UseQueryResult<UsersListData, Error> =>
  useQuery({
    queryKey: [...queryKeys.staffUserList(), opts?.listParams ?? null] as const,
    queryFn: async () => {
      const res = await api.users.list({
        q: opts?.listParams?.q,
        page: opts?.listParams?.page,
        limit: opts?.listParams?.limit,
        filters: opts?.listParams?.filters,
      })
      return { items: res.items, total: res.total }
    },
    enabled: opts?.enabled ?? true,
  })

export const useTrashedStaffUsers = (opts?: {
  enabled?: boolean
  listParams?: {
    page?: number
    limit?: number
    q?: string
    filters?: Record<string, string>
  }
}): UseQueryResult<UsersListData, Error> =>
  useQuery({
    queryKey: [...queryKeys.usersTrashed(), opts?.listParams ?? null] as const,
    queryFn: async () => {
      const lp = opts?.listParams
      const res = await api.users.listTrashed({
        page: lp?.page ?? 1,
        limit: lp?.limit ?? 25,
        q: lp?.q,
        filters: lp?.filters,
      })
      return { items: res.items, total: res.total }
    },
    enabled: opts?.enabled ?? true,
  })

// Contact Requests hooks
export const useContactRequests = (opts?: {
  enabled?: boolean
  params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
    trash?: boolean
    filters?: Record<string, string>
  }
}): UseQueryResult<ContactRequestsData, Error> =>
  useQuery({
    queryKey: queryKeys.contactRequests(opts?.params),
    queryFn: async () => {
      const res = await api.contactRequests.list(opts?.params)
      return { items: res.items, total: res.total }
    },
    enabled: opts?.enabled ?? true,
  })

export const useContactRequestDetail = (
  id: string | number | null | undefined
) =>
  useQuery<ContactRequest, Error>({
    queryKey: ["contact-requests", id],
    queryFn: () => api.contactRequests.detail(id as string | number),
    enabled: !!id,
  })

// My Students hooks
export const useMyStudents = (opts?: {
  enabled?: boolean
}): UseQueryResult<MyStudentsData, Error> =>
  useQuery({
    queryKey: queryKeys.myStudents(),
    queryFn: async () => {
      const res = await api.myStudents.list()
      return { items: res.items }
    },
    enabled: opts?.enabled ?? true,
  })

// Parent Students hooks
export const useParentStudents = (opts?: {
  enabled?: boolean
  params?: { page?: number; limit?: number; status?: string; search?: string }
}): UseQueryResult<ParentStudentsData, Error> =>
  useQuery({
    queryKey: queryKeys.parentStudents(opts?.params),
    queryFn: async () => {
      const res = await api.parentStudents.list(opts?.params)
      return { items: res.items, total: res.total }
    },
    enabled: opts?.enabled ?? true,
  })
