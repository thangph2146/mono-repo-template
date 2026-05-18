"use client";

import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { FieldError } from "@ui/components/field";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import { FormFieldCol } from "@ui/components/typing";
import { SelectPicker, TreePicker, type TreeOption, type SelectPickerOption } from "@ui/components/pickers";
import { Badge } from "@ui/components/badge";
import { TypographyH1 } from "@ui/components/typography";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { CategoryTreeOption } from "../types";
import { CATEGORY_ICON_OPTIONS, resolveCategoryIcon } from "@/lib/category-icons";
import { cn } from "@ui/lib/utils";
import { ADMIN_PAGE_SUBTITLE_CLASS, ADMIN_PAGE_TITLE_PRIMARY_CLASS } from "@ui/lib/layout-shell";
import { ArrowLeft, FolderTree, Globe, Layers, ListOrdered, Tag } from "lucide-react";
import type { CategoryFormValues } from "../_hooks";

const ROOT_PARENT_VALUE = "__root__";

function buildParentTreeOptions(
  rows: CategoryTreeOption[],
  excludedIds: Set<string>,
): TreeOption[] {
  const result: TreeOption[] = [];
  for (const row of rows) {
    if (excludedIds.has(row.id)) continue;
    const children = row.subRows
      ? buildParentTreeOptions(row.subRows, excludedIds)
      : [];
    result.push({
      value: row.id,
      label: row.name,
      children: children.length > 0 ? children : undefined,
    });
  }
  return result;
}

const ICON_OPTIONS: SelectPickerOption[] = CATEGORY_ICON_OPTIONS.map((name) => {
  const Icon = resolveCategoryIcon(name);
  return {
    value: name,
    label: name,
    render: () => (
      <div className="flex items-center gap-2">
        <Icon className="size-4" />
        <span>{name}</span>
      </div>
    ),
  };
});

export interface CategoryFormShellProps {
  form: UseFormReturn<CategoryFormValues>;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
  submitting: boolean;
  editingId: string | null;
  categoryTreeOptions: CategoryTreeOption[];
  onBack: () => void;
  onReset: () => void;
}

export function CategoryFormShell({
  form,
  onSubmit,
  submitting,
  editingId,
  categoryTreeOptions,
  onBack,
  onReset,
}: CategoryFormShellProps) {
  const { control, watch } = form;
  const currentParentId = watch("parentId");
  const watchedName = watch("name");
  const watchedDescription = watch("description");

  const nameLength = watchedName.trim().length;
  const descLength = watchedDescription.trim().length;

  const excludedIds = editingId ? new Set([editingId]) : new Set<string>();
  const parentTreeOptions = buildParentTreeOptions(categoryTreeOptions, excludedIds);

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
              {editingId ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
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
            form="category-form"
            className="h-10 rounded-lg font-bold"
            disabled={submitting}
          >
            {submitting ? "Đang lưu..." : editingId ? "Cập nhật" : "Lưu"}
          </Button>
        </div>
      </div>

      <form id="category-form" onSubmit={form.handleSubmit(onSubmit)} className="my-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Tag className="size-5 text-primary" />
                  Thông tin cơ bản
                </CardTitle>
                <CardDescription>
                  Tên danh mục, slug và mô tả — những yếu tố ảnh hưởng đến khả năng tìm thấy và nhận diện.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name="name"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormFieldCol label="Tên hiển thị" required>
                      <Input
                        placeholder="VD: Tin tuyển sinh"
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
                        placeholder="tin-tuyen-sinh"
                        {...field}
                        className={cn(fieldState.error && "border-destructive")}
                      />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Globe className="size-3 shrink-0" />
                        <span className="break-all font-mono">/danh-muc/{field.value || "ten-danh-muc"}</span>
                      </div>
                    </FormFieldCol>
                  )}
                />

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <FormFieldCol label="Mô tả">
                      <Textarea
                        placeholder="Mô tả ngắn gọn về danh mục này..."
                        {...field}
                        rows={3}
                      />
                      <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                        <span>Mô tả ngắn giúp phân biệt danh mục trong danh sách và SEO.</span>
                        <Badge variant="outline">{descLength} ký tự</Badge>
                      </div>
                    </FormFieldCol>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layers className="size-5 text-primary" />
                  Phân cấp & Hiển thị
                </CardTitle>
                <CardDescription>
                  Thiết lập danh mục cha, biểu tượng và thứ tự sắp xếp.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name="parentId"
                  control={control}
                  render={({ field }) => (
                    <FormFieldCol label={<div className="flex items-center gap-2"><FolderTree className="size-4 text-muted-foreground" />Danh mục cha</div>}>
                      <TreePicker
                        value={currentParentId === ROOT_PARENT_VALUE ? "" : currentParentId}
                        onChange={(value) =>
                          field.onChange((typeof value === "string" && value) || ROOT_PARENT_VALUE)
                        }
                        options={parentTreeOptions}
                        placeholder="Cấp gốc (không có cha)"
                      />
                      <p className="text-xs text-muted-foreground">
                        {currentParentId === ROOT_PARENT_VALUE
                          ? "Danh mục này sẽ là cấp gốc trong cây phân cấp."
                          : "Đang chọn danh mục cha. Có thể bỏ chọn để đưa lên cấp gốc."}
                      </p>
                    </FormFieldCol>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    name="icon"
                    control={control}
                    render={({ field }) => (
                      <FormFieldCol label="Biểu tượng">
                        <SelectPicker
                          value={field.value}
                          onChange={(v) => field.onChange((v as string) ?? "Package2")}
                          options={ICON_OPTIONS}
                          placeholder="Chọn biểu tượng"
                        />
                      </FormFieldCol>
                    )}
                  />

                  <Controller
                    name="sortOrder"
                    control={control}
                    render={({ field }) => (
                      <FormFieldCol label={<div className="flex items-center gap-2"><ListOrdered className="size-4 text-muted-foreground" />Thứ tự</div>}>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">Số càng nhỏ hiển thị càng trước.</p>
                      </FormFieldCol>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground">
                  <Layers className="size-5" />
                  Tổng quan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cấp hiện tại</p>
                  <p className="mt-1 text-sm font-medium">
                    {currentParentId === ROOT_PARENT_VALUE
                      ? "Cấp gốc"
                      : "Danh mục con"}
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trạng thái</p>
                  <p className="mt-1 text-sm font-medium">
                    {editingId ? "Đang chỉnh sửa" : "Tạo mới"}
                  </p>
                </div>
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/10 p-3">
                  <p className="text-xs text-muted-foreground">
                    Danh mục sau khi lưu có thể được gắn vào bài viết và hiển thị dưới dạng cây phân cấp.
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
