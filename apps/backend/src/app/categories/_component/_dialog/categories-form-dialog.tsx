"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import { Button } from "@ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { Plus } from "lucide-react";
import type { FormState, CategoryTreeOption } from "../types";
import {
  CATEGORY_ICON_OPTIONS,
  resolveCategoryIcon,
} from "@/lib/category-icons";
import { cn } from "@ui/lib/utils";
import {
  ADMIN_DIALOG_CONTENT_CATEGORY_CLASS,
} from "@ui/lib/layout-shell";

export interface CategoriesFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: FormState;
  onFormChange: (form: FormState) => void;
  onSubmit: () => void;
  submitting: boolean;
  categoryTreeOptions: CategoryTreeOption[];
  slugify: (value: string) => string;
  contentClassName?: string;
  canWriteCategories: boolean;
}

const ROOT_PARENT_VALUE = "__root__";

function flattenCategoryOptions(
  rows: CategoryTreeOption[],
  excludedIds: Set<string>,
  depth = 0
): Array<{ id: string; name: string; depth: number }> {
  const options: Array<{ id: string; name: string; depth: number }> = [];
  for (const row of rows) {
    if (!excludedIds.has(row.id)) {
      options.push({ id: row.id, name: row.name, depth });
    }
    if (row.subRows) {
      options.push(...flattenCategoryOptions(row.subRows, excludedIds, depth + 1));
    }
  }
  return options;
}

export function CategoriesFormDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  submitting,
  categoryTreeOptions,
  slugify,
  contentClassName,
  canWriteCategories,
}: CategoriesFormDialogProps) {
  const excludedIds = form.id
    ? new Set([form.id])
    : new Set<string>();

  const parentOptions = flattenCategoryOptions(categoryTreeOptions, excludedIds);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {canWriteCategories && (
        <DialogTrigger
          render={
            <Button
              onClick={() =>
                onFormChange({
                  name: "",
                  slug: "",
                  description: "",
                  icon: "Package2",
                  sortOrder: 0,
                  isActive: true,
                  parentId: ROOT_PARENT_VALUE,
                })
              }
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
            {form.id ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
          </DialogTitle>
          <DialogDescription>
            Slug được tự động sinh từ tên. Cập nhật slug sẽ tự đồng bộ lại
            tham chiếu trên các nội dung liên quan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cat-name">Tên hiển thị</Label>
              <Input
                id="cat-name"
                placeholder="VD: Tin tuyển sinh"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  onFormChange({
                    ...form,
                    name,
                    slug: form.id ? form.slug : slugify(name),
                  });
                }}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                placeholder="do-uong"
                value={form.slug}
                onChange={(e) =>
                  onFormChange({
                    ...form,
                    slug: slugify(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Biểu tượng</Label>
              <Select
                value={form.icon}
                onValueChange={(v) =>
                  onFormChange({ ...form, icon: v ?? "Package2" })
                }
              >
                <SelectTrigger className="w-full rounded-lg">
                  <SelectValue placeholder="Chọn biểu tượng" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_ICON_OPTIONS.map((name) => {
                    const Icon = resolveCategoryIcon(name);
                    return (
                      <SelectItem key={name} value={name}>
                        <div className="flex items-center gap-2">
                          <Icon className="size-4" /> {name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-order">Thứ tự</Label>
              <Input
                id="cat-order"
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  onFormChange({
                    ...form,
                    sortOrder: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cat-desc">Mô tả</Label>
              <Input
                id="cat-desc"
                placeholder="Mô tả ngắn gọn"
                value={form.description}
                onChange={(e) =>
                  onFormChange({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Danh mục cha</Label>
              <Select
                value={form.parentId}
                onValueChange={(value) =>
                  onFormChange({
                    ...form,
                    parentId: value || ROOT_PARENT_VALUE,
                  })
                }
              >
                <SelectTrigger className="w-full rounded-lg">
                  <SelectValue placeholder="Chọn danh mục cha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROOT_PARENT_VALUE}>
                    Cấp gốc
                  </SelectItem>
                  {parentOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {`${".. ".repeat(option.depth)}${option.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Danh mục con sẽ hiển thị lùi cấp trong bảng tree.
              </p>
            </div>
            <div className="border-outline-variant flex items-center justify-between rounded-lg border px-4 py-3 sm:col-span-2">
              <div>
                <p className="text-sm font-semibold">Đang hoạt động</p>
                <p className="text-xs text-muted-foreground">
                  Khi tắt, danh mục sẽ ẩn khỏi các bộ chọn nội dung nhưng
                  vẫn giữ lại tham chiếu cũ.
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) =>
                  onFormChange({ ...form, isActive: v })
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between items-center">
          <Button
            variant="outline"
            className="mr-auto rounded-lg"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            className={cn("rounded-lg font-bold")}
            onClick={() => void onSubmit()}
            disabled={submitting}
          >
            {submitting ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
