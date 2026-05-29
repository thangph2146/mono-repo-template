"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Pencil, Trash2, ArchiveRestore, Eye } from "lucide-react";
import type { LocationRow, LocationConfirmAction } from "./types";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}

export function getLocationColumns({
  openDetail,
  openEdit,
  setConfirmAction,
  canWrite,
}: {
  openDetail: (row: LocationRow) => void;
  openEdit: (row: LocationRow) => void;
  setConfirmAction: (action: LocationConfirmAction) => void;
  canWrite: boolean;
}): ColumnDef<LocationRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Tên",
      enableColumnFilter: false,
      cell: ({ row, getValue }) => (
        <button
          type="button"
          className="font-medium text-left text-foreground hover:text-primary transition-colors"
          onClick={() => openDetail(row.original)}
        >
          {String(getValue() ?? "—")}
        </button>
      ),
    },
    {
      accessorKey: "address",
      header: "Địa chỉ",
      enableColumnFilter: false,
      cell: ({ getValue }) => (
        <span className="text-sm">{String(getValue() ?? "—")}</span>
      ),
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
        const status = getValue() as number | null;
        return status === 0 ? (
          <Badge variant="outline" className="text-[10px]">Khóa</Badge>
        ) : (
          <Badge variant="default" className="text-[10px]">Hoạt động</Badge>
        );
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Cập nhật",
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
          {canWrite && (
            <Button type="button" variant="outline" onClick={() => openEdit(row.original)}>
              <Pencil className="size-3.5" />
              Sửa
            </Button>
          )}
          {canWrite && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmAction({ kind: "delete", row: row.original })}
            >
              <Trash2 className="size-3.5" />
              Xóa tạm
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
  setConfirmAction: (action: LocationConfirmAction) => void;
  canWrite: boolean;
}): ColumnDef<LocationRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Tên",
      enableColumnFilter: false,
    },
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
          {canWrite && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmAction({ kind: "restore", row: row.original })}
            >
              <ArchiveRestore className="size-3.5" />
              Khôi phục
            </Button>
          )}
          {canWrite && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmAction({ kind: "purge", row: row.original })}
            >
              <Trash2 className="size-3.5" />
              Xóa vĩnh viễn
            </Button>
          )}
        </div>
      ),
    },
  ];
}
