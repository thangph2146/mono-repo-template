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
import { ArrowLeft, MapPin, Hash, Globe } from "lucide-react";
import type { LocationFormValues } from "../types";

export interface LocationFormShellProps {
  form: UseFormReturn<LocationFormValues>;
  onSubmit: (values: LocationFormValues) => Promise<void>;
  submitting: boolean;
  editingId: string | null;
  onBack: () => void;
  onReset: () => void;
}

export function LocationFormShell({
  form,
  onSubmit,
  submitting,
  editingId,
  onBack,
  onReset,
}: LocationFormShellProps) {
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
              {editingId ? "Chỉnh sửa địa điểm" : "Thêm địa điểm"}
            </TypographyH1>
            <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
              Quản lý địa điểm trong hệ thống.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={onReset} disabled={submitting}>
            Đặt lại
          </Button>
          <Button type="submit" form="location-form" className="h-10 rounded-lg font-bold" disabled={submitting}>
            {submitting ? "Đang lưu..." : editingId ? "Cập nhật" : "Lưu"}
          </Button>
        </div>
      </div>

      <form id="location-form" onSubmit={form.handleSubmit(onSubmit)} className="my-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="size-5 text-primary" />
                  Thông tin địa điểm
                </CardTitle>
                <CardDescription>
                  Thông tin cơ bản của địa điểm.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name="mapUrl"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormFieldCol label="URL bản đồ (Google Maps Embed)" required>
                      <Input
                        placeholder="https://www.google.com/maps/embed?pb=..."
                        {...field}
                        className={cn(fieldState.error && "border-destructive")}
                      />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Globe className="size-3 shrink-0" />
                        <span>Nhập Google Maps Embed URL để hiển thị bản đồ.</span>
                      </div>
                    </FormFieldCol>
                  )}
                />

                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <FormFieldCol label="Tên địa điểm">
                      <Input
                        placeholder="VD: Hội trường A"
                        {...field}
                      />
                    </FormFieldCol>
                  )}
                />

                <Controller
                  name="address"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormFieldCol label="Địa chỉ">
                      <Textarea
                        placeholder="Địa chỉ chi tiết của địa điểm..."
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
                        value={field.value ?? 1}
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
                    Địa điểm sau khi lưu có thể được chọn khi tạo sự kiện.
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
