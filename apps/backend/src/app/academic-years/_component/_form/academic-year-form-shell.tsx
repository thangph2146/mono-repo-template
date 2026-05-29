"use client";

import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { FieldError } from "@ui/components/field";
import { Input } from "@ui/components/input";
import { FormFieldCol } from "@ui/components/typing";
import { DatePicker, TreePicker } from "@ui/components/pickers";
import { TypographyH1 } from "@ui/components/typography";
import { Controller, type UseFormReturn } from "react-hook-form";
import { cn } from "@ui/lib/utils";
import { ADMIN_PAGE_SUBTITLE_CLASS, ADMIN_PAGE_TITLE_PRIMARY_CLASS } from "@ui/lib/layout-shell";
import { ArrowLeft, FileText, Hash } from "lucide-react";
import type { AcademicYearFormValues } from "../types";

export interface AcademicYearFormShellProps {
  form: UseFormReturn<AcademicYearFormValues>;
  onSubmit: (values: AcademicYearFormValues) => Promise<void>;
  submitting: boolean;
  editingId: string | null;
  onBack: () => void;
  onReset: () => void;
}

export function AcademicYearFormShell({
  form,
  onSubmit,
  submitting,
  editingId,
  onBack,
  onReset,
}: AcademicYearFormShellProps) {
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
              {editingId ? "Chỉnh sửa niên khóa" : "Tạo niên khóa mới"}
            </TypographyH1>
            <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
              Quản lý các niên khóa trong hệ thống.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={onReset} disabled={submitting}>
            Đặt lại
          </Button>
          <Button type="submit" form="academic-year-form" className="h-10 rounded-lg font-bold" disabled={submitting}>
            {submitting ? "Đang lưu..." : editingId ? "Cập nhật" : "Lưu"}
          </Button>
        </div>
      </div>

      <form id="academic-year-form" onSubmit={form.handleSubmit(onSubmit)} className="my-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="size-5 text-primary" />
                  Thông tin niên khóa
                </CardTitle>
                <CardDescription>
                  Tên và thời gian của niên khóa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name="name"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormFieldCol label="Tên niên khóa" required>
                      <Input
                        placeholder="VD: 2024-2025"
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
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <FormFieldCol label="Ngày bắt đầu">
                      <DatePicker
                        value={field.value}
                        onChange={(v) => field.onChange(v ?? "")}
                        placeholder="Chọn ngày"
                      />
                    </FormFieldCol>
                  )}
                />

                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <FormFieldCol label="Ngày kết thúc">
                      <DatePicker
                        value={field.value}
                        onChange={(v) => field.onChange(v ?? "")}
                        placeholder="Chọn ngày"
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
                      <TreePicker
                        value={String(field.value)}
                        onChange={(v) => field.onChange(v != null ? Number(v) : 1)}
                        options={[
                          { value: "1", label: "Hoạt động" },
                          { value: "0", label: "Tắt" },
                        ]}
                        placeholder="Chọn trạng thái"
                      />
                    </FormFieldCol>
                  )}
                />
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/10 p-3">
                  <p className="text-xs text-muted-foreground">
                    Niên khóa sau khi lưu có thể được sử dụng trong các chức năng liên quan.
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
