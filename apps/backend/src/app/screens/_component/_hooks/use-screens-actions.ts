import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { ScreenConfirmAction, ScreenFormValues } from "../types";
import { screenFormSchema } from "../types";
import { zodResolver } from "@hookform/resolvers/zod";
const EMPTY: ScreenFormValues = { name: "", code: "", cameraId: "", cameraName: "", templateId: "", templateName: "", status: 1 };
export function buildScreenPayload(v: ScreenFormValues) { return { name: v.name.trim(), code: v.code?.trim() || null, cameraId: v.cameraId?.trim() || null, cameraName: v.cameraName?.trim() || null, templateId: v.templateId?.trim() || null, templateName: v.templateName?.trim() || null, status: v.status }; }
export function useScreenForm() { const form = useForm<ScreenFormValues>({ resolver: zodResolver(screenFormSchema), defaultValues: EMPTY }); return { form, resetForm: useCallback(() => form.reset(EMPTY), [form]) }; }
export function useHandleConfirmAction(del: { mutateAsync: (id: string) => Promise<unknown> }, restore: { mutateAsync: (id: string) => Promise<unknown> }, purge: { mutateAsync: (id: string) => Promise<unknown> }, setConfirmAction: (v: ScreenConfirmAction | null) => void) { return useCallback(async ({ kind, row }: ScreenConfirmAction) => { try { if (kind === "delete") { await del.mutateAsync(row.id); toast.success(`Đã đưa «${row.name}» vào thùng rác`); } else if (kind === "restore") { await restore.mutateAsync(row.id); toast.success(`Đã khôi phục «${row.name}»`); } else { await purge.mutateAsync(row.id); toast.success(`Đã xóa vĩnh viễn «${row.name}»`); } } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Lỗi"); } finally { setConfirmAction(null); } }, [del, restore, purge, setConfirmAction]); }
export function useConfirmAction() { const [a, s] = useState<ScreenConfirmAction | null>(null); return { confirmAction: a, setConfirmAction: s }; }
