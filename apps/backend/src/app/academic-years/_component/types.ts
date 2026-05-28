import { z } from "zod";

export type AcademicYearRow = {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export interface AcademicYearConfirmAction {
  kind: "delete" | "restore" | "purge";
  row: AcademicYearRow;
}

export const academicYearFormSchema = z.object({
  name: z.string().min(1, "Tên niên khóa không được để trống"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.coerce.number(),
});

export type AcademicYearFormValues = z.infer<typeof academicYearFormSchema>;

export type AcademicYearDetail = AcademicYearRow;
