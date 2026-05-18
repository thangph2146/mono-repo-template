"use client";

import { useState, useEffect } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Switch } from "@ui/components/switch";
import { ScrollArea } from "@ui/components/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ui/components/dialog";
import { StepEditor } from "./step-editor";
import type { GuideGroup, GuideFormData } from "../types";
import { parseContent } from "../utils";

interface GroupFormDialogProps {
  open: boolean;
  initial: GuideGroup | null;
  onClose: () => void;
  onSave: (data: GuideFormData) => void;
  isSaving: boolean;
}

export function GroupFormDialog({
  open,
  initial,
  onClose,
  onSave,
  isSaving,
}: GroupFormDialogProps) {
  const isEdit = !!initial?.id;

  const [sectionKey, setSectionKey] = useState(initial?.sectionKey ?? "");
  const [isVisible, setIsVisible] = useState(initial?.isVisible ?? true);
  const [content, setContent] = useState<GuideGroup["content"]>(
    initial ? parseContent(initial.content) : { title: "", description: "", order: 0, steps: [] }
  );

  useEffect(() => {
    if (open) {
      setSectionKey(initial?.sectionKey ?? "");
      setIsVisible(initial?.isVisible ?? true);
      setContent(
        initial ? parseContent(initial.content) : { title: "", description: "", order: 0, steps: [] }
      );
    }
  }, [open, initial]);

  const reset = () => {
    setSectionKey(initial?.sectionKey ?? "");
    setIsVisible(initial?.isVisible ?? true);
    setContent(
      initial ? parseContent(initial.content) : { title: "", description: "", order: 0, steps: [] }
    );
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = () => {
    onSave({ sectionKey: sectionKey.trim(), isVisible, content });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="size-5" />
            {isEdit ? "Chỉnh sửa nhóm hướng dẫn" : "Thêm nhóm hướng dẫn mới"}
          </DialogTitle>
          <DialogDescription>
            Mỗi nhóm gồm tiêu đề, mô tả và danh sách các bước kèm ảnh minh họa.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="px-2 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="sectionKey">
                Mã nhóm (sectionKey) <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="sectionKey"
                value={sectionKey}
                onChange={(e) => setSectionKey(e.target.value)}
                placeholder="vd: dang-nhap, xem-diem"
                disabled={isEdit}
              />
              <p className="text-xs text-muted-foreground">Slug duy nhất, không dấu, dùng gạch ngang.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">Tiêu đề nhóm</Label>
              <Input
                id="title"
                value={content.title ?? ""}
                onChange={(e) => setContent((c) => ({ ...c, title: e.target.value }))}
                placeholder="vd: Hướng dẫn đăng nhập hệ thống"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc">Mô tả nhóm</Label>
              <Textarea
                id="desc"
                value={content.description ?? ""}
                onChange={(e) => setContent((c) => ({ ...c, description: e.target.value }))}
                placeholder="Mô tả ngắn về nhóm hướng dẫn này…"
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Các bước thực hiện</Label>
              <StepEditor
                steps={content.steps ?? []}
                onChange={(steps) => setContent((c) => ({ ...c, steps }))}
              />
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Switch id="visible" checked={isVisible} onCheckedChange={setIsVisible} />
              <div>
                <Label htmlFor="visible" className="cursor-pointer">
                  Hiển thị công khai
                </Label>
                <p className="text-xs text-muted-foreground">Tắt để ẩn nhóm này khỏi trang frontend.</p>
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Hủy
          </Button>
          <Button disabled={!sectionKey.trim() || isSaving} onClick={handleSave}>
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isEdit ? (
              "Lưu thay đổi"
            ) : (
              "Tạo mới"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
