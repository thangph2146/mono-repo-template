"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Pencil, Trash2, ArchiveRestore } from "lucide-react";
import type { TagRow, TagTreeRow } from "./types";
import { formatDateTime } from "./utils";

export function getTagColumns({
  openEdit,
  setDeleteTarget,
  canWrite,
  canDelete,
}: {
  openEdit: (row: TagRow) => void;
  setDeleteTarget: (row: TagRow) => void;
  canWrite: boolean;
  canDelete: boolean;
}): ColumnDef<TagTreeRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Tên / nhóm",
      enableColumnFilter: true,
      meta: { filterPlaceholder: "Lọc theo tên…" },
      cell: ({ row, getValue }) =>
        row.original.isGroup ? (
          <div className="flex items-center gap-2">
            <span className="font-medium capitalize">{String(getValue())}</span>
            <Badge variant="outline" className="text-[10px]">
              {row.original.itemCount} thẻ
            </Badge>
          </div>
        ) : (
          <span className="font-medium">{String(getValue())}</span>
        ),
    },
    {
      accessorKey: "slug",
      header: "Slug",
      enableColumnFilter: true,
      meta: { filterPlaceholder: "Lọc theo slug…" },
      cell: ({ row, getValue }) => (
        <span className="font-mono text-xs">
          {row.original.isGroup
            ? `nhom:${String(getValue())}`
            : String(getValue())}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "Cập nhật / quy mô",
      enableColumnFilter: true,
      meta: { filterVariant: "date-range", filterPlaceholder: "Chọn khoảng ngày" },
      cell: ({ row, getValue }) =>
        row.original.isGroup ? (
          <span className="text-xs text-muted-foreground">
            Nhóm theo tiền tố slug
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {formatDateTime(getValue() as string)}
          </span>
        ),
    },
    {
      id: "actions",
      header: "Thao tác",
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) =>
        row.original.isGroup ? null : (
          <div className="flex flex-wrap gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg"
              onClick={() => openEdit(row.original)}
              disabled={!canWrite}
            >
              <Pencil className="size-3.5" />
              Sửa
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteTarget(row.original)}
              disabled={!canDelete}
            >
              <Trash2 className="size-3.5" />
              Xóa tạm
            </Button>
          </div>
        ),
    },
  ];
}

export function getTrashColumns({
  setRestoreTarget,
  setPurgeTarget,
  canDelete,
}: {
  setRestoreTarget: (row: TagRow) => void;
  setPurgeTarget: (row: TagRow) => void;
  canDelete: boolean;
}): ColumnDef<TagRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Tên",
      meta: { filterPlaceholder: "Lọc theo tên…" },
    },
    {
      accessorKey: "deletedAt",
      header: "Xóa lúc",
      enableColumnFilter: true,
      meta: { filterVariant: "date-range", filterPlaceholder: "Chọn khoảng ngày" },
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(getValue() as string)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-lg"
            onClick={() => setRestoreTarget(row.original)}
            disabled={!canDelete}
          >
            <ArchiveRestore className="size-3.5" />
            Khôi phục
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => setPurgeTarget(row.original)}
            disabled={!canDelete}
          >
            <Trash2 className="size-3.5" />
            Xóa hẳn
          </Button>
        </div>
      ),
    },
  ];
}
