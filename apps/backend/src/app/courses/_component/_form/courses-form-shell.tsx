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
import { ArrowLeft, BookOpen, Hash } from "lucide-react";
import type { CourseFormValues } from "../types";

export interface CourseFormShellProps {
  form: UseFormReturn<CourseFormValues>;
  onSubmit: (values: CourseFormValues) => Promise<void>;
  submitting: boolean;
  editingId: string | null;
  onBack: () => void;
  onReset: () => void;
}

export function CourseFormShell({
  form,
  onSubmit,
  submitting,
  editingId,
  onBack,
  onReset,
}: CourseFormShellProps) {
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
              {editingId ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}
            </TypographyH1>
            <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
              Quản lý các khóa học trong hệ thống.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={onReset} disabled={submitting}>
            Đặt lại
          </Button>
          <Button type="submit" form="course-form" className="h-10 rounded-lg font-bold" disabled={submitting}>
            {submitting ? "Đang lưu..." : editingId ? "Cập nhật" : "Lưu"}
          </Button>
        </div>
      </div>

      <form id="course-form" onSubmit={form.handleSubmit(onSubmit)} className="my-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="size-5 text-primary" />
                  Thông tin cơ bản
                </CardTitle>
                <CardDescription>
                  Tên và thông tin khóa học.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name="name"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormFieldCol label="Tên khóa học" required>
                      <Input
                        placeholder="VD: Khóa học 2026-2030"
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
                  name="startYear"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormFieldCol label="Năm bắt đầu">
                      <Input
                        type="number"
                        placeholder="VD: 2026"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        className={cn(fieldState.error && "border-destructive")}
                      />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </FormFieldCol>
                  )}
                />

                <Controller
                  name="endYear"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormFieldCol label="Năm kết thúc">
                      <Input
                        type="number"
                        placeholder="VD: 2030"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        className={cn(fieldState.error && "border-destructive")}
                      />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </FormFieldCol>
                  )}
                />

                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormFieldCol label="Mã khoa">
                      <Input
                        type="number"
                        placeholder="VD: 1"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        className={cn(fieldState.error && "border-destructive")}
                      />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
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
                    Khóa học sau khi lưu có thể được sử dụng trong hệ thống.
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
