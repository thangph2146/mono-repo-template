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
import { Button } from "@ui/components/button";

import { ADMIN_DIALOG_CONTENT_CATEGORY_CLASS } from "@ui/lib/layout-shell";
import type { TagFormValues } from "../types";
import { slugify } from "../utils";

export interface TagFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: TagFormValues;
  onChange: (form: TagFormValues) => void;
  onSave: () => void;
  canWrite: boolean;
  submitting: boolean;
  trigger?: React.ReactNode;
}

export function TagFormDialog({
  open,
  onOpenChange,
  form,
  onChange,
  onSave,
  canWrite,
  submitting,
  trigger,
}: TagFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger as never} />
      ) : null}
      <DialogContent className={ADMIN_DIALOG_CONTENT_CATEGORY_CLASS}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">
            {form.id ? "Chỉnh sửa thẻ" : "Tạo thẻ mới"}
          </DialogTitle>
          <DialogDescription>
            Slug được tự động sinh từ tên, phù hợp cho URL hoặc bộ lọc nội dung.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="tag-name">Tên thẻ</Label>
            <Input
              id="tag-name"
              value={form.name}
              placeholder="VD: Học bổng"
              onChange={(e) => {
                const name = e.target.value;
                onChange({
                  ...form,
                  name,
                  slug: form.id ? form.slug : slugify(name),
                });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tag-slug">Slug</Label>
            <Input
              id="tag-slug"
              value={form.slug}
              placeholder="hoc-bong"
              onChange={(e) =>
                onChange({
                  ...form,
                  slug: slugify(e.target.value),
                })
              }
            />
          </div>
        </div>
        <DialogFooter>
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
            type="button"
            className="rounded-lg font-bold"
            onClick={() => onSave()}
            disabled={!canWrite || submitting}
          >
            {submitting ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
