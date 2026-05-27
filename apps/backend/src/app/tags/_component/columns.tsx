"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Pencil, Trash2, ArchiveRestore, Eye } from "lucide-react";
import type { TagRow, TagTreeRow, TagConfirmAction } from "./types";
import { formatDateTime } from "./utils";

export function getTagColumns({
  openDetail,
  openEdit,
  setConfirmAction,
}: {
  openDetail: (row: TagRow) => void;
  openEdit: (row: TagRow) => void;
  setConfirmAction: (action: TagConfirmAction) => void;
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
          <button
            type="button"
            className="font-medium text-left text-foreground hover:text-primary transition-colors"
            onClick={() => openDetail(row.original)}
          >
            {String(getValue())}
          </button>
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
      filterFn: (row: Row<TagTreeRow>, columnId: string, filterValue: unknown) => {
        if (filterValue == null || filterValue === "") return true;
        if (row.original.isGroup) return true;
        const dates = String(filterValue).split(",").filter(Boolean);
        if (!dates.length) return true;
        const rowDate = new Date(row.getValue<string>(columnId));
        if (Number.isNaN(rowDate.getTime())) return true;
        if (dates.length === 1) return rowDate >= new Date(dates[0]);
        return rowDate >= new Date(dates[0]) && rowDate <= new Date(dates[1]);
      },
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
              variant="default"
              size="sm"
              className="h-8 gap-1 rounded-lg"
              onClick={() => openDetail(row.original)}
            >
              <Eye className="size-3.5" />
              Xem
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg"
              onClick={() => openEdit(row.original)}
            >
              <Pencil className="size-3.5" />
              Sửa
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmAction({ kind: "delete", row: row.original })}
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
  setConfirmAction,
}: {
  setConfirmAction: (action: TagConfirmAction) => void;
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
            onClick={() => setConfirmAction({ kind: "restore", row: row.original })}
          >
            <ArchiveRestore className="size-3.5" />
            Khôi phục
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmAction({ kind: "purge", row: row.original })}
          >
            <Trash2 className="size-3.5" />
            Xóa vĩnh viễn
          </Button>
        </div>
      ),
    },
  ];
}
