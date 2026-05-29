"use client";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { FieldError } from "@ui/components/field";
import { Input } from "@ui/components/input";
import { FormFieldCol } from "@ui/components/typing";
import { TreePicker } from "@ui/components/pickers";
import { TypographyH1 } from "@ui/components/typography";
import { Controller, type UseFormReturn } from "react-hook-form";
import { cn } from "@ui/lib/utils";
import { ADMIN_PAGE_SUBTITLE_CLASS, ADMIN_PAGE_TITLE_PRIMARY_CLASS } from "@ui/lib/layout-shell";
import { ArrowLeft, Hash, Camera } from "lucide-react";
import type { CameraFormValues } from "../types";
export interface CameraFormShellProps { form: UseFormReturn<CameraFormValues>; onSubmit: (v: CameraFormValues) => Promise<void>; submitting: boolean; editingId: string | null; onBack: () => void; onReset: () => void; }
export function CameraFormShell({ form, onSubmit, submitting, editingId, onBack, onReset }: CameraFormShellProps) {
  const { control } = form;
  return (<>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" className="h-10 gap-2 rounded-lg" onClick={onBack}><ArrowLeft className="size-4" /> Quay lại</Button>
        <div><TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>{editingId ? "Chỉnh sửa camera" : "Thêm camera"}</TypographyH1><p className={ADMIN_PAGE_SUBTITLE_CLASS}>Quản lý camera.</p></div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={onReset} disabled={submitting}>Đặt lại</Button>
        <Button type="submit" form="camera-form" className="h-10 rounded-lg font-bold" disabled={submitting}>{submitting ? "Đang lưu..." : editingId ? "Cập nhật" : "Lưu"}</Button>
      </div>
    </div>
    <form id="camera-form" onSubmit={form.handleSubmit(onSubmit)} className="my-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg"><Camera className="size-5 text-primary" /> Thông tin camera</CardTitle><CardDescription>Thông tin cơ bản của camera.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <Controller name="name" control={control} render={({ field, fieldState }) => (<FormFieldCol label="Tên camera" required><Input placeholder="VD: Camera cổng A" {...field} className={cn(fieldState.error && "border-destructive")} />{fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}</FormFieldCol>)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller name="code" control={control} render={({ field }) => (<FormFieldCol label="Mã camera"><Input placeholder="CAM-001" {...field} /></FormFieldCol>)} />
                <Controller name="ipAddress" control={control} render={({ field }) => (<FormFieldCol label="Địa chỉ IP"><Input placeholder="192.168.1.100" {...field} /></FormFieldCol>)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller name="port" control={control} render={({ field }) => (<FormFieldCol label="Cổng"><Input type="number" placeholder="554" value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormFieldCol>)} />
                <Controller name="username" control={control} render={({ field }) => (<FormFieldCol label="Tên đăng nhập"><Input placeholder="admin" {...field} /></FormFieldCol>)} />
              </div>
              <Controller name="password" control={control} render={({ field }) => (<FormFieldCol label="Mật khẩu"><Input type="password" placeholder="••••••••" {...field} /></FormFieldCol>)} />
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
