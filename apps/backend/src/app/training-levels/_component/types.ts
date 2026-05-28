import { z } from "zod";

export type TrainingLevelRow = {
  id: string;
  name: string;
  code: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export interface TrainingLevelConfirmAction {
  kind: "delete" | "restore" | "purge";
  row: TrainingLevelRow;
}

export const entityFormSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
  code: z.string().optional(),
  status: z.coerce.number(),
});

export type TrainingLevelFormValues = z.infer<typeof entityFormSchema>;

export type TrainingLevelDetail = TrainingLevelRow;
