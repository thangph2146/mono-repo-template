import { z } from "zod";

export type CourseRow = {
  id: string;
  name: string;
  startYear: number | null;
  endYear: number | null;
  departmentId: number | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export interface CourseConfirmAction {
  kind: "delete" | "restore" | "purge";
  row: CourseRow;
}

export const courseFormSchema = z.object({
  name: z.string().min(1, "Tên khóa học không được để trống"),
  startYear: z.coerce.number().optional(),
  endYear: z.coerce.number().optional(),
  departmentId: z.coerce.number().optional(),
  status: z.coerce.number(),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;

export type CourseDetail = CourseRow;
