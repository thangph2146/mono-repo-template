"use client";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { FieldError } from "@ui/components/field";
import { Input } from "@ui/components/input";
import { FormFieldCol } from "@ui/components/typing";
import { SelectPicker, TreePicker, type SelectPickerOption } from "@ui/components/pickers";
import { TypographyH1 } from "@ui/components/typography";
import { Controller, type UseFormReturn } from "react-hook-form";
import { cn } from "@ui/lib/utils";
import { ADMIN_PAGE_SUBTITLE_CLASS, ADMIN_PAGE_TITLE_PRIMARY_CLASS } from "@ui/lib/layout-shell";
import { ArrowLeft, Hash, Monitor } from "lucide-react";
import type { ScreenFormValues } from "../types";
export interface ScreenFormShellProps { form: UseFormReturn<ScreenFormValues>; onSubmit: (v: ScreenFormValues) => Promise<void>; submitting: boolean; editingId: string | null; cameraOptions: SelectPickerOption[]; templateOptions: SelectPickerOption[]; onBack: () => void; onReset: () => void; }
export function ScreenFormShell({ form, onSubmit, submitting, editingId, cameraOptions, templateOptions, onBack, onReset }: ScreenFormShellProps) {
  const { control } = form;
  return (<>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" className="h-10 gap-2 rounded-lg" onClick={onBack}><ArrowLeft className="size-4" /> Quay lại</Button>
        <div><TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>{editingId ? "Chỉnh sửa màn hình" : "Thêm màn hình"}</TypographyH1><p className={ADMIN_PAGE_SUBTITLE_CLASS}>Quản lý màn hình.</p></div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={onReset} disabled={submitting}>Đặt lại</Button>
        <Button type="submit" form="screen-form" className="h-10 rounded-lg font-bold" disabled={submitting}>{submitting ? "Đang lưu..." : editingId ? "Cập nhật" : "Lưu"}</Button>
      </div>
    </div>
    <form id="screen-form" onSubmit={form.handleSubmit(onSubmit)} className="my-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg"><Monitor className="size-5 text-primary" /> Thông tin màn hình</CardTitle><CardDescription>Thông tin cơ bản của màn hình.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <Controller name="name" control={control} render={({ field, fieldState }) => (<FormFieldCol label="Tên màn hình" required><Input placeholder="VD: Màn hình sảnh A" {...field} className={cn(fieldState.error && "border-destructive")} />{fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}</FormFieldCol>)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller name="code" control={control} render={({ field }) => (<FormFieldCol label="Mã màn hình"><Input placeholder="SCR-001" {...field} /></FormFieldCol>)} />
                <Controller name="cameraId" control={control} render={({ field }) => (<FormFieldCol label="Camera"><SelectPicker value={field.value} onChange={(value) => { field.onChange(value); const s = cameraOptions.find(o => o.value === value); form.setValue("cameraName", s?.label ?? ""); }} options={cameraOptions} placeholder="Chọn camera" /></FormFieldCol>)} />
              </div>
              <Controller name="templateId" control={control} render={({ field }) => (<FormFieldCol label="Template"><SelectPicker value={field.value} onChange={(value) => { field.onChange(value); const s = templateOptions.find(o => o.value === value); form.setValue("templateName", s?.label ?? ""); }} options={templateOptions} placeholder="Chọn template" /></FormFieldCol>)} />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg text-muted-foreground"><Hash className="size-5" /> Trạng thái</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Controller name="status" control={control} render={({ field }) => (<FormFieldCol label="Trạng thái"><TreePicker
                            value={String(field.value)}
                            onChange={(v) => field.onChange(v != null ? Number(v) : 1)}
                            options={[
                              { value: "1", label: "Hoạt động" },
                              { value: "0", label: "Khóa" },
                            ]}
                            placeholder="Chọn trạng thái"
                          /></FormFieldCol>)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  </>);
}
