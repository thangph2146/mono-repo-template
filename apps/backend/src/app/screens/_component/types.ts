import { z } from "zod";
export type ScreenRow = { id: string; name: string; code: string | null; cameraId: string | null; cameraName: string | null; templateId: string | null; templateName: string | null; status: number; createdAt: string; updatedAt: string; deletedAt: string | null; };
export interface ScreenConfirmAction { kind: "delete" | "restore" | "purge"; row: ScreenRow; }
export const screenFormSchema = z.object({ name: z.string().min(1, "Tên màn hình không được để trống"), code: z.string().optional(), cameraId: z.string().optional(), cameraName: z.string().optional(), templateId: z.string().optional(), templateName: z.string().optional(), status: z.coerce.number(), });
export type ScreenFormValues = z.infer<typeof screenFormSchema>;
export type ScreenDetail = ScreenRow;
