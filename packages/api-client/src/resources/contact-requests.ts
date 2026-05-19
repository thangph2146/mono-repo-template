import type { ApiClient } from "../client";
import { getData, putData, deleteData, postData, normalizePagedResult } from "./_shared";

export interface ContactRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  content?: string;
  status: "new" | "in-progress" | "resolved" | "archived";
  priority?: "HIGH" | "MEDIUM" | "LOW";
  isRead?: boolean;
  assignedToName?: string | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string | null; email: string } | null;
  notes?: string;
  respondedBy?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ContactRequestsListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  trash?: boolean;
}

export interface CreateContactRequestInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface UpdateContactRequestInput {
  status?: ContactRequest["status"];
  notes?: string;
}

export class ContactRequestsApi {
  constructor(private readonly http: ApiClient) {}

  async list(params?: ContactRequestsListParams): Promise<{ items: ContactRequest[]; total: number }> {
    const payload = await getData<unknown>(this.http, "/admin/contact-requests", {
      query: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        status: params?.status,
        trash: params?.trash,
        search: params?.search,
      },
    });
    return normalizePagedResult<ContactRequest>(payload);
  }

  async detail(id: string | number): Promise<ContactRequest> {
    const payload = await getData<ContactRequest>(this.http, `/admin/contact-requests/${id}`);
    return payload;
  }

  async create(input: CreateContactRequestInput): Promise<ContactRequest> {
    const payload = await postData<ContactRequest>(this.http, "/admin/contact-requests", input);
    return payload;
  }

  async update(id: string | number, input: UpdateContactRequestInput): Promise<ContactRequest> {
    const payload = await putData<ContactRequest>(this.http, `/admin/contact-requests/${id}`, input);
    return payload;
  }

  async archive(id: string | number): Promise<ContactRequest> {
    return this.update(id, { status: "archived" });
  }

  async remove(id: string | number): Promise<void> {
    await deleteData<unknown>(this.http, `/admin/contact-requests/${id}`);
  }

  async restore(id: string | number): Promise<ContactRequest> {
    const payload = await postData<ContactRequest>(this.http, `/admin/contact-requests/${id}/restore`);
    return payload;
  }

  async hardDelete(id: string | number): Promise<void> {
    await deleteData<unknown>(this.http, `/admin/contact-requests/${id}/hard-delete`);
  }

  async bulkDelete(ids: string[]): Promise<{ affected: number; message: string }> {
    const payload = await postData<{ affected: number; message: string }>(
      this.http,
      `/admin/contact-requests/bulk`,
      { action: 'delete', ids }
    );
    return payload;
  }

  async bulkRestore(ids: string[]): Promise<{ affected: number; message: string }> {
    const payload = await postData<{ affected: number; message: string }>(
      this.http,
      `/admin/contact-requests/bulk`,
      { action: 'restore', ids }
    );
    return payload;
  }

  async bulkHardDelete(ids: string[]): Promise<{ affected: number; message: string }> {
    const payload = await postData<{ affected: number; message: string }>(
      this.http,
      `/admin/contact-requests/bulk`,
      { action: 'hard-delete', ids }
    );
    return payload;
  }
}
