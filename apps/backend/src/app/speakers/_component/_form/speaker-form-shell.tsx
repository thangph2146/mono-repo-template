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
import { ArrowLeft, Hash, User, Briefcase } from "lucide-react";
import type { SpeakerFormValues } from "../types";

export interface SpeakerFormShellProps {
  form: UseFormReturn<SpeakerFormValues>;
  onSubmit: (values: SpeakerFormValues) => Promise<void>;
  submitting: boolean;
  editingId: string | null;
  onBack: () => void;
  onReset: () => void;
}

export function SpeakerFormShell({
  form,
  onSubmit,
  submitting,
  editingId,
  onBack,
  onReset,
}: SpeakerFormShellProps) {
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
              {editingId ? "Chỉnh sửa diễn giả" : "Thêm diễn giả"}
            </TypographyH1>
            <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
              Quản lý diễn giả trong hệ thống.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={onReset} disabled={submitting}>
            Đặt lại
          </Button>
          <Button type="submit" form="speaker-form" className="h-10 rounded-lg font-bold" disabled={submitting}>
            {submitting ? "Đang lưu..." : editingId ? "Cập nhật" : "Lưu"}
          </Button>
        </div>
      </div>

      <form id="speaker-form" onSubmit={form.handleSubmit(onSubmit)} className="my-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="size-5 text-primary" />
                  Thông tin diễn giả
                </CardTitle>
                <CardDescription>
                  Thông tin cơ bản của diễn giả.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name="name"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormFieldCol label="Tên diễn giả" required>
                      <Input
                        placeholder="VD: Nguyễn Văn A"
                        {...field}
                        className={cn(fieldState.error && "border-destructive")}
                      />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </FormFieldCol>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <FormFieldCol label="Chức danh">
                        <Input
                          placeholder="VD: Giám đốc điều hành"
                          {...field}
                        />
                      </FormFieldCol>
                    )}
                  />

                  <Controller
                    name="organization"
                    control={control}
                    render={({ field }) => (
                      <FormFieldCol label="Tổ chức">
                        <Input
                          placeholder="VD: Công ty ABC"
                          {...field}
                        />
                      </FormFieldCol>
                    )}
                  />
                </div>

                <Controller
                  name="bio"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormFieldCol label="Tiểu sử">
                      <Textarea
                        placeholder="Tiểu sử của diễn giả..."
                        {...field}
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

            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="size-5 text-primary" />
                  Liên hệ
                </CardTitle>
                <CardDescription>
                  Thông tin liên hệ của diễn giả.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <FormFieldCol label="Email">
                        <Input
                          placeholder="email@example.com"
                          {...field}
                        />
                      </FormFieldCol>
                    )}
                  />

                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <FormFieldCol label="Số điện thoại">
                        <Input
                          placeholder="+84 123 456 789"
                          {...field}
                        />
                      </FormFieldCol>
                    )}
                  />
                </div>

                <Controller
                  name="avatar"
                  control={control}
                  render={({ field }) => (
                    <FormFieldCol label="URL ảnh đại diện">
                      <Input
                        placeholder="https://example.com/avatar.jpg"
                        {...field}
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
                        <option value={0}>Khóa</option>
                      </select>
                    </FormFieldCol>
                  )}
                />
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/10 p-3">
                  <p className="text-xs text-muted-foreground">
                    Diễn giả sau khi lưu có thể được chọn khi tạo sự kiện.
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
