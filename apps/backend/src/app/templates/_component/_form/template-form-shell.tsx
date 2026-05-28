"use client";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { FieldError } from "@ui/components/field";
import { Input } from "@ui/components/input";
import { FormFieldCol } from "@ui/components/typing";
import { TypographyH1 } from "@ui/components/typography";
import { Controller, type UseFormReturn } from "react-hook-form";
import { cn } from "@ui/lib/utils";
import { ADMIN_PAGE_SUBTITLE_CLASS, ADMIN_PAGE_TITLE_PRIMARY_CLASS } from "@ui/lib/layout-shell";
import { ArrowLeft, LayoutTemplate } from "lucide-react";
import type { TemplateFormValues } from "../types";
export interface TemplateFormShellProps { form: UseFormReturn<TemplateFormValues>; onSubmit: (v: TemplateFormValues) => Promise<void>; submitting: boolean; editingId: string | null; onBack: () => void; onReset: () => void; }
export function TemplateFormShell({ form, onSubmit, submitting, editingId, onBack, onReset }: TemplateFormShellProps) {
  const { control } = form;
  return (<>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" className="h-10 gap-2 rounded-lg" onClick={onBack}><ArrowLeft className="size-4" /> Quay lại</Button>
        <div><TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>{editingId ? "Chỉnh sửa mẫu hiển thị" : "Thêm mẫu hiển thị"}</TypographyH1><p className={ADMIN_PAGE_SUBTITLE_CLASS}>Quản lý mẫu hiển thị.</p></div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={onReset} disabled={submitting}>Đặt lại</Button>
        <Button type="submit" form="template-form" className="h-10 rounded-lg font-bold" disabled={submitting}>{submitting ? "Đang lưu..." : editingId ? "Cập nhật" : "Lưu"}</Button>
      </div>
    </div>
    <form id="template-form" onSubmit={form.handleSubmit(onSubmit)} className="my-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg"><LayoutTemplate className="size-5 text-primary" /> Thông tin mẫu</CardTitle><CardDescription>Thông tin cơ bản của mẫu hiển thị.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <Controller name="name" control={control} render={({ field, fieldState }) => (<FormFieldCol label="Tên mẫu" required><Input placeholder="VD: Mẫu hiển thị mặc định" {...field} className={cn(fieldState.error && "border-destructive")} />{fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}</FormFieldCol>)} />
              <Controller name="code" control={control} render={({ field }) => (<FormFieldCol label="Mã mẫu"><Input placeholder="TEMPLATE_001" {...field} /></FormFieldCol>)} />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg text-muted-foreground"><LayoutTemplate className="size-5" /> Trạng thái</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Controller name="status" control={control} render={({ field }) => (<FormFieldCol label="Trạng thái"><select value={field.value} onChange={e => field.onChange(Number(e.target.value))} className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"><option value={1}>Hoạt động</option><option value={0}>Khóa</option></select></FormFieldCol>)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  </>);
}
