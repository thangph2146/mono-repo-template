import type { ApiClient } from "../client";
import { getData, postData, deleteData } from "./_shared";

export interface ParentStudent {
  id: string;
  parentId: string;
  studentCode: string;
  studentName: string | null;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddStudentInput {
  studentCode: string;
  note?: string;
}

export class MyStudentsApi {
  constructor(private readonly http: ApiClient) {}

  async list(): Promise<{ items: ParentStudent[] }> {
    const payload = await getData<{ items: ParentStudent[] }>(this.http, "/admin/my-students");
    return payload;
  }

  async add(input: AddStudentInput): Promise<ParentStudent> {
    const payload = await postData<ParentStudent>(this.http, "/admin/my-students", input);
    return payload;
  }

  async remove(id: string | number): Promise<void> {
    await deleteData<unknown>(this.http, `/admin/my-students/${id}`);
  }
}
