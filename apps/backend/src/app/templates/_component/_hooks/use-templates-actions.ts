import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { TemplateConfirmAction, TemplateFormValues } from "../types";
import { templateFormSchema } from "../types";
import { zodResolver } from "@hookform/resolvers/zod";
const EMPTY: TemplateFormValues = { name: "", code: "", status: 1 };
export function buildTemplatePayload(v: TemplateFormValues) { return { name: v.name.trim(), code: v.code?.trim() || null, status: v.status }; }
export function useTemplateForm() { const form = useForm<TemplateFormValues>({ resolver: zodResolver(templateFormSchema), defaultValues: EMPTY }); return { form, resetForm: useCallback(() => form.reset(EMPTY), [form]) }; }
export function useHandleConfirmAction(del: { mutateAsync: (id: string) => Promise<unknown> }, restore: { mutateAsync: (id: string) => Promise<unknown> }, purge: { mutateAsync: (id: string) => Promise<unknown> }, setConfirmAction: (v: TemplateConfirmAction | null) => void) { return useCallback(async ({ kind, row }: TemplateConfirmAction) => { try { if (kind === "delete") { await del.mutateAsync(row.id); toast.success(`Đã đưa «${row.name}» vào thùng rác`); } else if (kind === "restore") { await restore.mutateAsync(row.id); toast.success(`Đã khôi phục «${row.name}»`); } else { await purge.mutateAsync(row.id); toast.success(`Đã xóa vĩnh viễn «${row.name}»`); } } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Lỗi"); } finally { setConfirmAction(null); } }, [del, restore, purge, setConfirmAction]); }
export function useConfirmAction() { const [a, s] = useState<TemplateConfirmAction | null>(null); return { confirmAction: a, setConfirmAction: s }; }
