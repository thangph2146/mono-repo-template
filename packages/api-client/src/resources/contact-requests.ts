import type { ApiClient } from "../client";
import { getData, putData, deleteData } from "./_shared";

export interface ContactRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: "new" | "in-progress" | "resolved" | "archived";
  notes?: string;
  respondedBy?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactRequestsListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface UpdateContactRequestInput {
  status?: ContactRequest["status"];
  notes?: string;
}

export class ContactRequestsApi {
  constructor(private readonly http: ApiClient) {}

  async list(params?: ContactRequestsListParams): Promise<{ items: ContactRequest[]; total: number }> {
    const payload = await getData<{ items: ContactRequest[]; total: number }>(this.http, "/admin/contact-requests", {
      query: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        status: params?.status,
        search: params?.search,
      },
    });
    return payload;
  }

  async detail(id: string | number): Promise<ContactRequest> {
    const payload = await getData<ContactRequest>(this.http, `/admin/contact-requests/${id}`);
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
}
