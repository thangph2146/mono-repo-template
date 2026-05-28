import { z } from "zod";

export type TrainingSystemRow = {
  id: string;
  name: string;
  code: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export interface TrainingSystemConfirmAction {
  kind: "delete" | "restore" | "purge";
  row: TrainingSystemRow;
}

export const entityFormSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
  code: z.string().optional(),
  status: z.coerce.number(),
});

export type TrainingSystemFormValues = z.infer<typeof entityFormSchema>;

export type TrainingSystemDetail = TrainingSystemRow;
