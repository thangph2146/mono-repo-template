import type { ApiClient } from "../client";
import { getData, putData, deleteData } from "./_shared";

export interface ParentStudent {
  id: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  studentCode: string;
  studentName: string | null;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParentStudentsListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface UpdateParentStudentInput {
  status?: ParentStudent["status"];
}

export class ParentStudentsApi {
  constructor(private readonly http: ApiClient) {}

  async list(params?: ParentStudentsListParams): Promise<{ items: ParentStudent[]; total: number }> {
    const payload = await getData<{ items: ParentStudent[]; total: number }>(this.http, "/admin/parent-students", {
      query: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        status: params?.status,
        search: params?.search,
      },
    });
    return payload;
  }

  async detail(id: string | number): Promise<ParentStudent> {
    const payload = await getData<ParentStudent>(this.http, `/admin/parent-students/${id}`);
    return payload;
  }

  async approve(id: string | number): Promise<ParentStudent> {
    const payload = await putData<ParentStudent>(this.http, `/admin/parent-students/${id}`, { status: "approved" });
    return payload;
  }

  async reject(id: string | number): Promise<ParentStudent> {
    const payload = await putData<ParentStudent>(this.http, `/admin/parent-students/${id}`, { status: "rejected" });
    return payload;
  }

  async remove(id: string | number): Promise<void> {
    await deleteData<unknown>(this.http, `/admin/parent-students/${id}`);
  }
}
