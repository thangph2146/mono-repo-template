import type { ApiClient } from "../client"
import {
  getData,
  putData,
  deleteData,
  postData,
  normalizePagedResult,
} from "./_shared"

type ApiContactStatus = "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
type UiContactStatus = "new" | "in-progress" | "resolved" | "archived"

type ApiContactRequest = Omit<ContactRequest, "status"> & {
  status: ApiContactStatus | UiContactStatus
}

export interface ContactRequest {
  id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  content?: string
  status: "new" | "in-progress" | "resolved" | "archived"
  priority?: "HIGH" | "MEDIUM" | "LOW"
  isRead?: boolean
  assignedToName?: string | null
  assignedToId?: string | null
  assignedTo?: { id: string; name: string | null; email: string } | null
  notes?: string
  respondedBy?: string
  respondedAt?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface ContactRequestsListParams {
  page?: number
  limit?: number
  status?: string
  search?: string
  trash?: boolean
  filters?: Record<string, string>
}

export interface CreateContactRequestInput {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

export interface UpdateContactRequestInput {
  status?: ContactRequest["status"]
  notes?: string
}

function toApiStatus(status?: string): string | undefined {
  if (!status) return undefined
  const normalized = status.trim()
  if (normalized === "new") return "NEW"
  if (normalized === "in-progress") return "IN_PROGRESS"
  if (normalized === "resolved") return "RESOLVED"
  if (normalized === "archived") return "CLOSED"
  return normalized
}

function fromApiStatus(status: ApiContactRequest["status"]): UiContactStatus {
  if (status === "NEW") return "new"
  if (status === "IN_PROGRESS") return "in-progress"
  if (status === "RESOLVED") return "resolved"
  if (status === "CLOSED") return "archived"
  return status
}

function toApiFilterQuery(
  filters?: Record<string, string>
): Record<string, string> {
  if (!filters) return {}
  const query: Record<string, string> = {}
  for (const [key, value] of Object.entries(filters)) {
    const normalized = String(value ?? "").trim()
    if (!normalized) continue
    query[`filter[${key}]`] =
      key === "status" ? (toApiStatus(normalized) ?? normalized) : normalized
  }
  return query
}

function mapContactRequest(row: ApiContactRequest): ContactRequest {
  return {
    ...row,
    status: fromApiStatus(row.status),
  }
}

export class ContactRequestsApi {
  constructor(private readonly http: ApiClient) {}

  async list(
    params?: ContactRequestsListParams
  ): Promise<{ items: ContactRequest[]; total: number }> {
    const payload = await getData<unknown>(
      this.http,
      "/admin/contact-requests",
      {
        query: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          status: toApiStatus(params?.status),
          trash: params?.trash,
          search: params?.search,
          ...toApiFilterQuery(params?.filters),
        },
      }
    )
    const normalized = normalizePagedResult<ApiContactRequest>(payload)
    return {
      items: normalized.items.map(mapContactRequest),
      total: normalized.total,
    }
  }

  async detail(id: string | number): Promise<ContactRequest> {
    const payload = await getData<ApiContactRequest>(
      this.http,
      `/admin/contact-requests/${id}`
    )
    return mapContactRequest(payload)
  }

  async create(input: CreateContactRequestInput): Promise<ContactRequest> {
    const payload = await postData<ApiContactRequest>(
      this.http,
      "/admin/contact-requests",
      input
    )
    return mapContactRequest(payload)
  }

  async update(
    id: string | number,
    input: UpdateContactRequestInput
  ): Promise<ContactRequest> {
    const payload = await putData<ApiContactRequest>(
      this.http,
      `/admin/contact-requests/${id}`,
      {
        ...input,
        status: toApiStatus(input.status),
      }
    )
    return mapContactRequest(payload)
  }

  async archive(id: string | number): Promise<ContactRequest> {
    return this.update(id, { status: "archived" })
  }

  async remove(id: string | number): Promise<void> {
    await deleteData<unknown>(this.http, `/admin/contact-requests/${id}`)
  }

  async restore(id: string | number): Promise<ContactRequest> {
    const payload = await postData<ApiContactRequest | undefined>(
      this.http,
      `/admin/contact-requests/${id}/restore`
    )
    return payload
      ? mapContactRequest(payload)
      : (payload as unknown as ContactRequest)
  }

  async hardDelete(id: string | number): Promise<void> {
    await deleteData<unknown>(
      this.http,
      `/admin/contact-requests/${id}/hard-delete`
    )
  }

  async bulkDelete(
    ids: string[]
  ): Promise<{ affected: number; message: string }> {
    const payload = await postData<{ affected: number; message: string }>(
      this.http,
      `/admin/contact-requests/bulk`,
      { action: "delete", ids }
    )
    return payload
  }

  async bulkRestore(
    ids: string[]
  ): Promise<{ affected: number; message: string }> {
    const payload = await postData<{ affected: number; message: string }>(
      this.http,
      `/admin/contact-requests/bulk`,
      { action: "restore", ids }
    )
    return payload
  }

  async bulkHardDelete(
    ids: string[]
  ): Promise<{ affected: number; message: string }> {
    const payload = await postData<{ affected: number; message: string }>(
      this.http,
      `/admin/contact-requests/bulk`,
      { action: "hard-delete", ids }
    )
    return payload
  }
}
