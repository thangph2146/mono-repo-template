"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Pencil, Trash2, ArchiveRestore, Eye } from "lucide-react";
import type { SpeakerRow, SpeakerConfirmAction } from "./types";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}

export function getSpeakerColumns({
  openDetail,
  openEdit,
  setConfirmAction,
}: {
  openDetail: (row: SpeakerRow) => void;
  openEdit: (row: SpeakerRow) => void;
  setConfirmAction: (action: SpeakerConfirmAction) => void;
}): ColumnDef<SpeakerRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Tên",
      enableColumnFilter: true,
      meta: { filterPlaceholder: "Lọc theo tên…" },
      cell: ({ row, getValue }) => (
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
      accessorKey: "title",
      header: "Chức danh",
      cell: ({ getValue }) => (
        <span className="text-sm">{String(getValue() ?? "—")}</span>
      ),
    },
    {
      accessorKey: "organization",
      header: "Tổ chức",
      cell: ({ getValue }) => (
        <span className="text-sm">{String(getValue() ?? "—")}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ getValue }) => {
        const status = getValue() as number;
        return status === 1 ? (
          <Badge variant="default" className="text-[10px]">Hoạt động</Badge>
        ) : (
          <Badge variant="outline" className="text-[10px]">Khóa</Badge>
        );
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Cập nhật",
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
          <Button type="button" variant="default" onClick={() => openDetail(row.original)}>
            <Eye className="size-3.5" />
            Xem
          </Button>
          <Button type="button" variant="outline" onClick={() => openEdit(row.original)}>
            <Pencil className="size-3.5" />
            Sửa
          </Button>
          <Button
            type="button"
            variant="destructive"
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
  setConfirmAction: (action: SpeakerConfirmAction) => void;
}): ColumnDef<SpeakerRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Tên",
      meta: { filterPlaceholder: "Lọc theo tên…" },
    },
    {
      accessorKey: "deletedAt",
      header: "Xóa lúc",
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
            onClick={() => setConfirmAction({ kind: "restore", row: row.original })}
          >
            <ArchiveRestore className="size-3.5" />
            Khôi phục
          </Button>
          <Button
            type="button"
            variant="destructive"
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
