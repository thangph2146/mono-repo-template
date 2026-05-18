"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import { Pencil, Trash2, ArchiveRestore, FolderTree, Folder } from "lucide-react";
import type { CategoryRow, CategoryTreeOption } from "./types";

export function getCategoryColumns({
  openEdit,
  setConfirmAction,
  categoryTreeOptions,
  canWriteCategories,
}: {
  openEdit: (row: CategoryRow) => void;
  setConfirmAction: (action: { kind: "delete" | "restore" | "purge"; row: CategoryRow }) => void;
  categoryTreeOptions: CategoryTreeOption[];
  canWriteCategories: boolean;
}): ColumnDef<CategoryRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Tên",
      enableColumnFilter: false,
      cell: ({ row, getValue }) => (
        <div className="flex min-w-0 items-center gap-2">
          {row.depth === 0 ? (
            <FolderTree className="size-4 shrink-0 text-primary" aria-hidden />
          ) : (
            <Folder className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          )}
          <span className="truncate font-medium">{String(getValue())}</span>
        </div>
      ),
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{String(getValue())}</span>
      ),
      meta: { filterPlaceholder: "Lọc slug" },
    },
    {
      id: "parentId",
      accessorFn: (row) => row.parentName ?? "Gốc",
      header: "Danh mục cha",
      cell: ({ row }) =>
        row.original.parentName ? (
          row.original.parentName
        ) : (
          <span className="text-muted-foreground">Gốc</span>
        ),
      meta: {
        filterVariant: "tree-multi-select",
        treeOptions: categoryTreeOptions.map((c) => ({
          value: c.id,
          label: c.name,
          children: c.subRows?.map((s) => ({
            value: s.id,
            label: s.name,
            children: s.subRows?.map((ss) => ({ value: ss.id, label: ss.name })),
          })),
        })),
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      enableColumnFilter: false,
      enableSorting: false,
      meta: { disableColumnFilter: true },
      cell: ({ row }) => {
        const c = row.original;
        const childCount = c._count?.children ?? 0;
        const linkedPosts = c.postCount ?? 0;
        if (!canWriteCategories) return null;
        return (
          <div className="flex flex-wrap gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg"
              onClick={() => openEdit(c)}
            >
              <Pencil className="mr-1 h-4 w-4" /> Sửa
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmAction({ kind: "delete", row: c })}
              disabled={childCount > 0 || linkedPosts > 0}
            >
              <Trash2 className="h-4 w-4" /> Xóa tạm
            </Button>
          </div>
        );
      },
    },
  ];
}

export function getTrashColumns({
  setConfirmAction,
  formatDateTime,
  categoryTreeOptions,
}: {
  setConfirmAction: (action: { kind: "delete" | "restore" | "purge"; row: CategoryRow }) => void;
  formatDateTime: (date: string) => string;
  categoryTreeOptions: CategoryTreeOption[];
}): ColumnDef<CategoryRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Tên",
      enableColumnFilter: false,
      cell: ({ row, getValue }) => (
        <div className="flex items-center gap-2">
          {row.depth === 0 ? (
            <FolderTree className="size-4 shrink-0 text-primary" aria-hidden />
          ) : (
            <Folder className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          )}
          <span className="font-medium">{String(getValue())}</span>
        </div>
      ),
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{String(getValue())}</span>
      ),
      meta: { filterPlaceholder: "Lọc slug" },
    },
    {
      id: "parentId",
      accessorFn: (row) => row.parentName ?? "Gốc",
      header: "Danh mục cha",
      cell: ({ row }) =>
        row.original.parentName ? (
          row.original.parentName
        ) : (
          <span className="text-muted-foreground">Gốc</span>
        ),
      meta: {
        filterVariant: "tree-multi-select",
        treeOptions: categoryTreeOptions.map((c) => ({
          value: c.id,
          label: c.name,
          children: c.subRows?.map((s) => ({
            value: s.id,
            label: s.name,
            children: s.subRows?.map((ss) => ({ value: ss.id, label: ss.name })),
          })),
        })),
      },
    },
    {
      accessorKey: "deletedAt",
      header: "Xóa lúc",
      enableColumnFilter: false,
      cell: ({ getValue }) => {
        const v = getValue() as string | null | undefined;
        return (
          <span className="text-xs text-muted-foreground">
            {v ? formatDateTime(v) : "—"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      enableColumnFilter: false,
      enableSorting: false,
      meta: { disableColumnFilter: true },
      cell: ({ row }) => (
        <div className="flex flex-wrap justify-end gap-1">
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
            Xóa hẳn
          </Button>
        </div>
      ),
    },
  ];
}
