"use client";

import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { FieldError } from "@ui/components/field";
import { Input } from "@ui/components/input";
import { FormFieldCol } from "@ui/components/typing";
import { Badge } from "@ui/components/badge";
import { TypographyH1 } from "@ui/components/typography";
import { Controller, type UseFormReturn } from "react-hook-form";
import { cn } from "@ui/lib/utils";
import { ADMIN_PAGE_SUBTITLE_CLASS, ADMIN_PAGE_TITLE_PRIMARY_CLASS } from "@ui/lib/layout-shell";
import { ArrowLeft, Globe, Hash, Tag } from "lucide-react";
import type { TagFormValues } from "../types";

export interface TagFormShellProps {
  form: UseFormReturn<TagFormValues>;
  onSubmit: (values: TagFormValues) => Promise<void>;
  submitting: boolean;
  editingId: string | null;
  onBack: () => void;
  onReset: () => void;
}

export function TagFormShell({
  form,
  onSubmit,
  submitting,
  editingId,
  onBack,
  onReset,
}: TagFormShellProps) {
  const { control, watch } = form;
  const watchedName = watch("name");

  const nameLength = watchedName.trim().length;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 gap-2 rounded-lg"
            onClick={onBack}
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
          <div>
            <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
              {editingId ? "Chỉnh sửa thẻ" : "Tạo thẻ mới"}
            </TypographyH1>
            <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
              Slug được tự động sinh từ tên. Cập nhật slug sẽ tự động đồng bộ lại tham chiếu trên các nội dung liên quan.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg"
            onClick={onReset}
            disabled={submitting}
          >
            Đặt lại
          </Button>
          <Button
            type="submit"
            form="tag-form"
            className="h-10 rounded-lg font-bold"
            disabled={submitting}
          >
            {submitting ? "Đang lưu..." : editingId ? "Cập nhật" : "Lưu"}
          </Button>
        </div>
      </div>

      <form id="tag-form" onSubmit={form.handleSubmit(onSubmit)} className="my-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Tag className="size-5 text-primary" />
                  Thông tin cơ bản
                </CardTitle>
                <CardDescription>
                  Tên thẻ và slug — những yếu tố ảnh hưởng đến khả năng tìm thấy và nhận diện.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name="name"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormFieldCol label="Tên hiển thị" required>
                      <Input
                        placeholder="VD: công nghệ, giải trí, giáo dục"
                        {...field}
                        className={cn(fieldState.error && "border-destructive")}
                      />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>Tối đa 50 ký tự, nên ngắn gọn và dễ nhận diện.</span>
                        <Badge variant={nameLength > 50 ? "destructive" : "outline"} className="ml-auto">{nameLength} ký tự</Badge>
                      </div>
                    </FormFieldCol>
                  )}
                />

                <Controller
                  name="slug"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormFieldCol label="Slug / đường dẫn">
                      <Input
                        placeholder="cong-nghe"
                        {...field}
                        className={cn(fieldState.error && "border-destructive")}
                      />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Globe className="size-3 shrink-0" />
                        <span className="break-all font-mono">/the/{field.value || "ten-the"}</span>
                      </div>
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
                  Tổng quan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trạng thái</p>
                  <p className="mt-1 text-sm font-medium">
                    {editingId ? "Đang chỉnh sửa" : "Tạo mới"}
                  </p>
                </div>
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/10 p-3">
                  <p className="text-xs text-muted-foreground">
                    Thẻ sau khi lưu có thể được gắn vào bài viết để phân loại nội dung.
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
