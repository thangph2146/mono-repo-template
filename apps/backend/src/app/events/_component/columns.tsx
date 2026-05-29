"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Pencil, Trash2, ArchiveRestore, Eye, Calendar, MapPin } from "lucide-react";
import type { EventRow, EventConfirmAction } from "./types";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("vi-VN");
}

export function getEventColumns({
  openDetail, openEdit, setConfirmAction, canWrite,
}: {
  openDetail: (row: EventRow) => void;
  openEdit: (row: EventRow) => void;
  setConfirmAction: (action: EventConfirmAction) => void;
  canWrite: boolean;
}): ColumnDef<EventRow>[] {
  return [
    {
      accessorKey: "title",
      header: "Sự kiện",
      enableColumnFilter: false,
      cell: ({ row, getValue }) => (
        <button type="button" className="font-medium text-left text-foreground hover:text-primary transition-colors" onClick={() => openDetail(row.original)}>
          {String(getValue())}
        </button>
      ),
    },
    {
      accessorKey: "organizer",
      header: "Đơn vị tổ chức",
      enableColumnFilter: false,
      cell: ({ getValue }) => <span className="text-sm">{String(getValue() ?? "—")}</span>,
    },
    {
      accessorKey: "startDate",
      header: "Bắt đầu",
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (filterValue == null || filterValue === "") return true;
        const rowVal = row.getValue(columnId) as string;
        if (!rowVal) return false;
        const [fromStr, toStr] = String(filterValue).split(",");
        const rowDate = rowVal.split("T")[0];
        if (fromStr && rowDate < fromStr) return false;
        if (toStr && rowDate > toStr) return false;
        return true;
      },
      meta: { filterVariant: "date-range" },
      cell: ({ getValue }) => (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="size-3" />{formatDate(getValue() as string)}
        </span>
      ),
    },
    {
      accessorKey: "location",
      header: "Địa điểm",
      enableColumnFilter: false,
      cell: ({ getValue }) => (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3" />{String(getValue() ?? "—")}
        </span>
      ),
    },
    {
      accessorKey: "format",
      header: "Hình thức",
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (filterValue == null || filterValue === "") return true;
        return String(row.getValue(columnId)) === String(filterValue);
      },
      meta: {
        filterVariant: "select",
        selectOptions: [
          { value: "0", label: "Offline" },
          { value: "1", label: "Online" },
          { value: "2", label: "Hybrid" },
        ],
      },
      cell: ({ getValue }) => {
        const fmt = getValue() as number;
        return (
          <Badge variant={fmt === 1 ? "secondary" : fmt === 2 ? "outline" : "default"} className="text-[10px]">
            {fmt === 1 ? "Online" : fmt === 2 ? "Hybrid" : "Offline"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (filterValue == null || filterValue === "") return true;
        return String(row.getValue(columnId)) === String(filterValue);
      },
      meta: {
        filterVariant: "select",
        selectOptions: [
          { value: "1", label: "Hoạt động" },
          { value: "0", label: "Khóa" },
        ],
      },
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
      id: "actions",
      header: "Thao tác",
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <Button type="button" variant="default" onClick={() => openDetail(row.original)}>
            <Eye className="size-3.5" /> Xem
          </Button>
          {canWrite && (
            <Button type="button" variant="outline" onClick={() => openEdit(row.original)}>
              <Pencil className="size-3.5" /> Sửa
            </Button>
          )}
          {canWrite && (
            <Button type="button" variant="destructive" onClick={() => setConfirmAction({ kind: "delete", row: row.original })}>
              <Trash2 className="size-3.5" /> Xóa tạm
            </Button>
          )}
        </div>
      ),
    },
  ];
}

export function getTrashColumns({
  setConfirmAction,
  canWrite,
}: {
  setConfirmAction: (action: EventConfirmAction) => void;
  canWrite: boolean;
}): ColumnDef<EventRow>[] {
  return [
    { accessorKey: "title", header: "Sự kiện", enableColumnFilter: false },
    {
      accessorKey: "deletedAt",
      header: "Xóa lúc",
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (filterValue == null || filterValue === "") return true;
        const rowVal = row.getValue(columnId) as string;
        if (!rowVal) return false;
        const [fromStr, toStr] = String(filterValue).split(",");
        const rowDate = rowVal.split("T")[0];
        if (fromStr && rowDate < fromStr) return false;
        if (toStr && rowDate > toStr) return false;
        return true;
      },
      meta: { filterVariant: "date-range" },
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{formatDateTime(getValue() as string)}</span>,
    },
    {
      id: "actions",
      header: "Thao tác",
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {canWrite && (
            <Button type="button" variant="outline" onClick={() => setConfirmAction({ kind: "restore", row: row.original })}>
              <ArchiveRestore className="size-3.5" /> Khôi phục
            </Button>
          )}
          {canWrite && (
            <Button type="button" variant="destructive" onClick={() => setConfirmAction({ kind: "purge", row: row.original })}>
              <Trash2 className="size-3.5" /> Xóa vĩnh viễn
            </Button>
          )}
        </div>
      ),
    },
  ];
}
