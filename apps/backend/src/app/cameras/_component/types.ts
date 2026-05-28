import { z } from "zod";
export type CameraRow = { id: string; name: string; code: string | null; ipAddress: string | null; port: number | null; username: string | null; status: number; createdAt: string; updatedAt: string; deletedAt: string | null; };
export interface CameraConfirmAction { kind: "delete" | "restore" | "purge"; row: CameraRow; }
export const cameraFormSchema = z.object({ name: z.string().min(1, "Tên camera không được để trống"), code: z.string().optional(), ipAddress: z.string().optional(), port: z.coerce.number().optional(), username: z.string().optional(), password: z.string().optional(), status: z.coerce.number(), });
export type CameraFormValues = z.infer<typeof cameraFormSchema>;
export type CameraDetail = CameraRow;
