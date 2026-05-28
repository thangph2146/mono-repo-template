"use client";

import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { FieldError } from "@ui/components/field";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import { FormFieldCol } from "@ui/components/typing";
import { TypographyH1 } from "@ui/components/typography";
import { Controller, type UseFormReturn } from "react-hook-form";
import { cn } from "@ui/lib/utils";
import { ADMIN_PAGE_SUBTITLE_CLASS, ADMIN_PAGE_TITLE_PRIMARY_CLASS } from "@ui/lib/layout-shell";
import { ArrowLeft, Building2, Hash } from "lucide-react";
import type { DepartmentFormValues } from "../types";

export interface DepartmentFormShellProps {
  form: UseFormReturn<DepartmentFormValues>;
  onSubmit: (values: DepartmentFormValues) => Promise<void>;
  submitting: boolean;
  editingId: string | null;
  onBack: () => void;
  onReset: () => void;
}

export function DepartmentFormShell({
  form,
  onSubmit,
  submitting,
  editingId,
  onBack,
  onReset,
}: DepartmentFormShellProps) {
  const { control } = form;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" className="h-10 gap-2 rounded-lg" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
          <div>
            <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
              {editingId ? "Chỉnh sửa phòng khoa" : "Tạo phòng khoa mới"}
            </TypographyH1>
            <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
              Quản lý các phòng khoa trong hệ thống.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={onReset} disabled={submitting}>
            Đặt lại
          </Button>
          <Button type="submit" form="department-form" className="h-10 rounded-lg font-bold" disabled={submitting}>
            {submitting ? "Đang lưu..." : editingId ? "Cập nhật" : "Lưu"}
          </Button>
        </div>
      </div>

      <form id="department-form" onSubmit={form.handleSubmit(onSubmit)} className="my-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="size-5 text-primary" />
                  Thông tin phòng khoa
                </CardTitle>
                <CardDescription>
                  Tên, mã và mô tả của phòng khoa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name="name"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormFieldCol label="Tên phòng khoa" required>
                      <Input
                        placeholder="VD: Phòng Công nghệ thông tin"
                        {...field}
                        className={cn(fieldState.error && "border-destructive")}
                      />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </FormFieldCol>
                  )}
                />

                <Controller
                  name="code"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormFieldCol label="Mã phòng khoa" required>
                      <Input
                        placeholder="VD: P.CNTT"
                        {...field}
                        className={cn(fieldState.error && "border-destructive")}
                      />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </FormFieldCol>
                  )}
                />

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <FormFieldCol label="Mô tả">
                      <Textarea
                        placeholder="Mô tả ngắn về phòng khoa..."
                        {...field}
                        rows={3}
                      />
                    </FormFieldCol>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground">
                  <Hash className="size-5" />
                  Trạng thái
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <FormFieldCol label="Trạng thái">
                      <select
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value={1}>Hoạt động</option>
                        <option value={0}>Tắt</option>
                      </select>
                    </FormFieldCol>
                  )}
                />
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/10 p-3">
                  <p className="text-xs text-muted-foreground">
                    Phòng khoa sau khi lưu có thể được sử dụng trong các chức năng liên quan.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </>
  );
}
