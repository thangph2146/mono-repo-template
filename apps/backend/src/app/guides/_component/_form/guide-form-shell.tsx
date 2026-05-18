"use client";

import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { FieldError } from "@ui/components/field";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Switch } from "@ui/components/switch";
import { Badge } from "@ui/components/badge";
import { TypographyH1 } from "@ui/components/typography";
import { Controller, type UseFormReturn } from "react-hook-form";
import { cn } from "@ui/lib/utils";
import { ADMIN_PAGE_SUBTITLE_CLASS, ADMIN_PAGE_TITLE_PRIMARY_CLASS } from "@ui/lib/layout-shell";
import { ArrowLeft, BookOpen, Layers, ListOrdered } from "lucide-react";
import { StepEditor } from "./step-editor";
import type { GuideFormData } from "../types";

export interface GuideFormShellProps {
  form: UseFormReturn<GuideFormData>;
  onSubmit: (values: GuideFormData) => Promise<void>;
  submitting: boolean;
  editingId: string | null;
  onBack: () => void;
  onReset: () => void;
}

export function GuideFormShell({
  form,
  onSubmit,
  submitting,
  editingId,
  onBack,
  onReset,
}: GuideFormShellProps) {
  const { control, watch } = form;
  const watchedSectionKey = watch("sectionKey");
  const watchedTitle = watch("content.title");
  const watchedDescription = watch("content.description");

  const sectionKeyLength = watchedSectionKey?.trim().length ?? 0;
  const titleLength = watchedTitle?.trim().length ?? 0;
  const descLength = watchedDescription?.trim().length ?? 0;

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
              {editingId ? "Chỉnh sửa nhóm hướng dẫn" : "Tạo nhóm hướng dẫn mới"}
            </TypographyH1>
            <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
              Mỗi nhóm gồm tiêu đề, mô tả và danh sách các bước kèm ảnh minh họa.
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
            form="guide-form"
            className="h-10 rounded-lg font-bold"
            disabled={submitting}
          >
            {submitting ? "Đang lưu..." : editingId ? "Cập nhật" : "Lưu"}
          </Button>
        </div>
      </div>

      <form id="guide-form" onSubmit={form.handleSubmit(onSubmit)} className="my-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layers className="size-5 text-primary" />
                  Các bước thực hiện
                </CardTitle>
                <CardDescription>
                  Danh sách các bước chi tiết kèm ảnh minh họa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name="content.steps"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <StepEditor
                        steps={field.value ?? []}
                        onChange={(steps) => field.onChange(steps)}
                      />
                    </div>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="size-5 text-primary" />
                  Thông tin cơ bản
                </CardTitle>
                <CardDescription>
                  Mã nhóm, tiêu đề và mô tả — thông tin hiển thị trên trang hướng dẫn.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name="sectionKey"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-1.5">
                      <Label htmlFor="sectionKey">
                        Mã nhóm (sectionKey) <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="sectionKey"
                        placeholder="vd: dang-nhap, xem-diem"
                        {...field}
                        disabled={!!editingId}
                        className={cn(fieldState.error && "border-destructive")}
                      />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>Slug duy nhất, không dấu, dùng gạch ngang.</span>
                        <Badge variant={sectionKeyLength > 50 ? "destructive" : "outline"} className="ml-auto">{sectionKeyLength} ký tự</Badge>
                      </div>
                    </div>
                  )}
                />

                <Controller
                  name="content.title"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-1.5">
                      <Label htmlFor="title">Tiêu đề nhóm</Label>
                      <Input
                        id="title"
                        placeholder="vd: Hướng dẫn đăng nhập hệ thống"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        className={cn(fieldState.error && "border-destructive")}
                      />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>Tiêu đề ngắn gọn, dễ hiểu.</span>
                        <Badge variant={titleLength > 100 ? "destructive" : "outline"} className="ml-auto">{titleLength} ký tự</Badge>
                      </div>
                    </div>
                  )}
                />

                <Controller
                  name="content.description"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <Label htmlFor="desc">Mô tả nhóm</Label>
                      <Textarea
                        id="desc"
                        placeholder="Mô tả ngắn về nhóm hướng dẫn này…"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        rows={3}
                        className="resize-none"
                      />
                      <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                        <span>Mô tả ngắn giúp phân biệt nhóm.</span>
                        <Badge variant="outline">{descLength} ký tự</Badge>
                      </div>
                    </div>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ListOrdered className="size-5 text-primary" />
                  Cài đặt hiển thị
                </CardTitle>
                <CardDescription>
                  Điều chỉnh cách hiển thị nhóm hướng dẫn.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name="isVisible"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      <Switch
                        id="visible"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <div className="flex-1">
                        <Label htmlFor="visible" className="cursor-pointer">
                          Hiển thị công khai
                        </Label>
                        <p className="text-xs text-muted-foreground">Tắt để ẩn nhóm này khỏi trang frontend.</p>
                      </div>
                    </div>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground">
                  <Layers className="size-5" />
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
                    Nhóm hướng dẫn sau khi lưu sẽ hiển thị trên trang hướng dẫn sử dụng cho người dùng.
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
