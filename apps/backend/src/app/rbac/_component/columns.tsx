"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Lock, Pencil, Trash2 } from "lucide-react";
import { isSuperAdminRoleCode } from "@workspace/api-client";

type RoleRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  permissions: string[];
  isActive: boolean;
  deletedAt: string | null;
};

export interface RbacColumnsProps {
  onEdit: (role: RoleRow) => void;
  onDelete: (role: RoleRow) => void;
  canManageRoles: boolean;
}

export function getRbacColumns(props: RbacColumnsProps): ColumnDef<RoleRow>[] {
  const { onEdit, onDelete, canManageRoles } = props;

  return [
    {
      accessorKey: "name",
      header: "Vai trò",
      meta: { filterPlaceholder: "Lọc tên vai trò…" },
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs font-mono text-muted-foreground">{row.original.code}</div>
        </div>
      ),
    },
    {
      id: "permissionCount",
      header: "Số quyền",
      accessorFn: (row) => row.permissions.length,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <Badge variant="secondary" className="rounded-lg">
          {row.original.permissions.length}
        </Badge>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      meta: {
        filterVariant: "select",
        selectOptions: [
          { value: "true", label: "Hoạt động" },
          { value: "false", label: "Tạm tắt" },
        ],
      },
      filterFn: (row, id, value) => {
        if (!value) return true;
        return String(row.getValue(id)) === String(value);
      },
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="outline" className="border-emerald-300 text-emerald-700">
            Hoạt động
          </Badge>
        ) : (
          <Badge variant="outline">Tạm tắt</Badge>
        ),
    },
    {
      id: "actions",
      header: "Thao tác",
      enableSorting: false,
      enableColumnFilter: false,
      meta: { disableColumnFilter: true },
      cell: ({ row }) => {
        const role = row.original;
        const isSuperAdmin = isSuperAdminRoleCode(role.code);

        return (
          <div className="flex flex-wrap gap-1">
            {!isSuperAdmin && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-lg"
                  onClick={() => onEdit(role)}
                  disabled={!canManageRoles}
                >
                  <Pencil className="size-3.5" />
                  Sửa
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(role)}
                  disabled={!canManageRoles}
                >
                  <Trash2 className="size-3.5" />
                  Xóa tạm
                </Button>
              </>
            )}
            {isSuperAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 rounded-lg text-muted-foreground"
                disabled
              >
                <Lock className="size-3.5" />
                Hệ thống
              </Button>
            )}
          </div>
        );
      },
    },
  ];
}
