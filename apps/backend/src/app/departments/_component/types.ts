import { z } from "zod";

export type DepartmentRow = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export interface DepartmentConfirmAction {
  kind: "delete" | "restore" | "purge";
  row: DepartmentRow;
}

export const departmentFormSchema = z.object({
  name: z.string().min(1, "Tên phòng khoa không được để trống"),
  code: z.string().min(1, "Mã phòng khoa không được để trống"),
  description: z.string().optional(),
  status: z.coerce.number(),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

export type DepartmentDetail = DepartmentRow;
