"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { ScrollArea } from "@ui/components/scroll-area";
import { Textarea } from "@ui/components/textarea";
import { FieldError } from "@ui/components/field";
import type { RbacPermission } from "@workspace/api-client";
import type { CreateRoleInput, UpdateRoleInput } from "../types";

const schema = z.object({
  code: z.string().min(1, "Mã vai trò không được để trống").regex(/^[a-z_]+$/, "Chỉ chứa chữ thường và gạch dưới"),
  name: z.string().min(1, "Tên nội bộ không được để trống"),
  displayName: z.string().min(1, "Tên hiển thị không được để trống"),
  description: z.string().optional(),
  permissionCodes: z.array(z.string()).min(1, "Phải chọn ít nhất 1 quyền"),
});

type FormData = z.infer<typeof schema>;

export interface RoleDialogProps {
  open: boolean;
  onClose: () => void;
  role?: {
    id: number;
    code: string;
    name: string;
    description: string | null;
    permissions: string[];
  } | null;
  permissions: RbacPermission[];
}

export function RoleDialog({ open, onClose, role, permissions }: RoleDialogProps) {
  const isEdit = !!role;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: role?.code || "",
      name: role?.name || "",
      displayName: role?.name || "",
      description: role?.description || "",
      permissionCodes: role?.permissions || [],
    },
  });

  const handleSubmit = async (data: FormData) => {
    try {
      if (isEdit && role) {
        const updateData: UpdateRoleInput = {
          name: data.name,
          displayName: data.displayName,
          description: data.description,
          permissionCodes: data.permissionCodes,
        };
        // TODO: Implement API call when endpoint is available
        // await api.rbac.updateRole(role.id, updateData);
        console.log("Update role:", role.id, updateData);
        toast.success("Đã cập nhật vai trò thành công");
      } else {
        const createData: CreateRoleInput = {
          code: data.code,
          name: data.name,
          displayName: data.displayName,
          description: data.description,
          permissionCodes: data.permissionCodes,
        };
        // TODO: Implement API call when endpoint is available
        // await api.rbac.createRole(createData);
        console.log("Create role:", createData);
        toast.success("Đã tạo vai trò thành công");
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được vai trò");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Cập nhật vai trò" : "Tạo vai trò mới"}</DialogTitle>
          <DialogDescription>
            Thiết lập thông tin vai trò và chọn quyền hạn phù hợp.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Mã vai trò</Label>
              <Controller
                name="code"
                control={form.control}
                render={({ field }) => (
                  <>
                    <Input
                      id="code"
                      {...field}
                      disabled={isEdit}
                      placeholder="content_editor"
                    />
                    <FieldError>{form.formState.errors.code?.message}</FieldError>
                  </>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Tên hiển thị</Label>
              <Controller
                name="displayName"
                control={form.control}
                render={({ field }) => (
                  <>
                    <Input id="displayName" {...field} placeholder="Biên tập nội dung" />
                    <FieldError>{form.formState.errors.displayName?.message}</FieldError>
                  </>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Tên nội bộ</Label>
            <Controller
              name="name"
              control={form.control}
              render={({ field }) => (
                <>
                  <Input id="name" {...field} placeholder="Biên tập nội dung" />
                  <FieldError>{form.formState.errors.name?.message}</FieldError>
                </>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Controller
              name="description"
              control={form.control}
              render={({ field }) => (
                <Textarea id="description" {...field} placeholder="Mô tả rõ vai trò này phục vụ bộ phận nào..." />
              )}
            />
          </div>

          <Controller
            name="permissionCodes"
            control={form.control}
            render={({ field: { value, onChange }, fieldState }) => (
              <div className="space-y-2">
                <Label>Quyền hạn *</Label>
                <ScrollArea className="max-h-[300px] rounded-lg border border-border p-3">
                  <div className="space-y-2">
                    {permissions.map((perm) => (
                      <div key={perm.code} className="flex items-center gap-3">
                        <Checkbox
                          checked={value.includes(perm.code)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              onChange([...value, perm.code]);
                            } else {
                              onChange(value.filter((c) => c !== perm.code));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{perm.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{perm.code}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
              </div>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Plus className="size-4 mr-2" />
                  {isEdit ? "Lưu thay đổi" : "Tạo vai trò"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
