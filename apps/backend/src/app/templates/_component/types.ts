import { z } from "zod";
export type TemplateRow = { id: string; name: string; code: string | null; content: unknown; status: number; createdAt: string; updatedAt: string; deletedAt: string | null; };
export interface TemplateConfirmAction { kind: "delete" | "restore" | "purge"; row: TemplateRow; }
export const templateFormSchema = z.object({ name: z.string().min(1, "Tên mẫu không được để trống"), code: z.string().optional(), status: z.coerce.number(), });
export type TemplateFormValues = z.infer<typeof templateFormSchema>;
export type TemplateDetail = TemplateRow;
