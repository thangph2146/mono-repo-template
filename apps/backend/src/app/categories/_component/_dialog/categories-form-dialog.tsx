"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@ui/components/dialog";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import { FieldError } from "@ui/components/field";
import { FormFieldCol } from "@ui/components/typing";
import { SelectPicker, TreePicker, type TreeOption, type SelectPickerOption } from "@ui/components/pickers";
import { Plus } from "lucide-react";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { CategoryTreeOption } from "../types";
import { CATEGORY_ICON_OPTIONS, resolveCategoryIcon } from "@/lib/category-icons";
import { cn } from "@ui/lib/utils";
import { ADMIN_DIALOG_CONTENT_CATEGORY_CLASS } from "@ui/lib/layout-shell";
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

export interface CategoriesFormDialogProps {
  form: UseFormReturn<CategoryFormValues>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CategoryFormValues) => void;
  submitting: boolean;
  categoryTreeOptions: CategoryTreeOption[];
  slugify: (value: string) => string;
  contentClassName?: string;
  canWriteCategories: boolean;
  editingId: string | null;
  onOpenCreate: () => void;
}

export function CategoriesFormDialog({
  form,
  open,
  onOpenChange,
  onSubmit,
  submitting,
  categoryTreeOptions,
  slugify,
  contentClassName,
  canWriteCategories,
  editingId,
  onOpenCreate,
}: CategoriesFormDialogProps) {
  const { control, watch } = form;
  const currentParentId = watch("parentId");

  const excludedIds = editingId ? new Set([editingId]) : new Set<string>();
  const parentTreeOptions = buildParentTreeOptions(categoryTreeOptions, excludedIds);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {canWriteCategories && (
        <DialogTrigger
          render={
            <Button
              onClick={onOpenCreate}
              className="flex h-12 items-center gap-2 rounded-lg px-6 font-bold shadow-md"
            />
          }
        >
          <Plus className="size-5" aria-hidden /> Thêm danh mục
        </DialogTrigger>
      )}
      <DialogContent className={contentClassName ?? ADMIN_DIALOG_CONTENT_CATEGORY_CLASS}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">
            {editingId ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
          </DialogTitle>
          <DialogDescription>
            Slug được tự động sinh từ tên. Cập nhật slug sẽ tự đồng bộ lại
            tham chiếu trên các nội dung liên quan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <FormFieldCol label="Tên hiển thị" required className="sm:col-span-2">
                  <Input
                    placeholder="VD: Tin tuyển sinh"
                    {...field}
                    onChange={(e) => {
                      const { value } = e.target;
                      field.onChange(value);
                      if (!editingId) form.setValue("slug", slugify(value));
                    }}
                    className={cn(fieldState.error && "border-destructive")}
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </FormFieldCol>
              )}
            />

            <Controller
              name="slug"
              control={control}
              render={({ field, fieldState }) => (
                <FormFieldCol label="Slug" className="sm:col-span-2">
                  <Input
                    placeholder="tin-tuyen-sinh"
                    {...field}
                    onChange={(e) => field.onChange(slugify(e.target.value))}
                    className={cn(fieldState.error && "border-destructive")}
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </FormFieldCol>
              )}
            />

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
                <FormFieldCol label="Thứ tự">
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                  />
                </FormFieldCol>
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <FormFieldCol label="Mô tả" className="sm:col-span-2">
                  <Textarea
                    placeholder="Mô tả ngắn gọn"
                    {...field}
                    rows={2}
                  />
                </FormFieldCol>
              )}
            />

            <Controller
              name="parentId"
              control={control}
              render={({ field }) => (
                <FormFieldCol label="Danh mục cha" className="sm:col-span-2">
                  <TreePicker
                    value={currentParentId === ROOT_PARENT_VALUE ? "" : currentParentId}
                    onChange={(value) =>
                      field.onChange((typeof value === "string" && value) || ROOT_PARENT_VALUE)
                    }
                    options={parentTreeOptions}
                    placeholder="Cấp gốc"
                  />
                </FormFieldCol>
              )}
            />
          </div>

          <DialogFooter className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              className="mr-auto rounded-lg"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="rounded-lg font-bold"
              disabled={submitting}
            >
              {submitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
