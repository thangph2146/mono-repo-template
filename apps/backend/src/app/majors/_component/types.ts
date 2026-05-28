import { z } from "zod";

export type MajorRow = {
  id: string;
  name: string;
  code: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export interface MajorConfirmAction {
  kind: "delete" | "restore" | "purge";
  row: MajorRow;
}

export const majorFormSchema = z.object({
  name: z.string().min(1, "Tên ngành không được để trống"),
  code: z.string().min(1, "Mã ngành không được để trống"),
  status: z.coerce.number(),
});

export type MajorFormValues = z.infer<typeof majorFormSchema>;

export type MajorDetail = MajorRow;
