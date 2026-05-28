"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Pencil, Trash2, ArchiveRestore, Eye } from "lucide-react";
import type { ScreenRow, ScreenConfirmAction } from "./types";
function fmt(v: string | null | undefined): string { if (!v) return "—"; const d = new Date(v); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("vi-VN"); }
export function getScreenColumns({ openDetail, openEdit, setConfirmAction }: { openDetail: (row: ScreenRow) => void; openEdit: (row: ScreenRow) => void; setConfirmAction: (a: ScreenConfirmAction) => void; }): ColumnDef<ScreenRow>[] {
  return [
    { accessorKey: "name", header: "Tên màn hình", enableColumnFilter: true, meta: { filterPlaceholder: "Lọc…" }, cell: ({ row, getValue }) => (<button type="button" className="font-medium text-left text-foreground hover:text-primary transition-colors" onClick={() => openDetail(row.original)}>{String(getValue())}</button>) },
    { accessorKey: "code", header: "Mã", cell: ({ getValue }) => <span className="text-sm font-mono">{String(getValue() ?? "—")}</span> },
    { accessorKey: "cameraName", header: "Camera", cell: ({ getValue }) => <span className="text-sm">{String(getValue() ?? "—")}</span> },
    { accessorKey: "templateName", header: "Template", cell: ({ getValue }) => <span className="text-sm">{String(getValue() ?? "—")}</span> },
    { accessorKey: "status", header: "Trạng thái", cell: ({ getValue }) => { const s = getValue() as number; return s === 1 ? <Badge variant="default" className="text-[10px]">Hoạt động</Badge> : <Badge variant="outline" className="text-[10px]">Khóa</Badge>; } },
    { id: "actions", header: "Thao tác", enableSorting: false, enableColumnFilter: false, cell: ({ row }) => (<div className="flex flex-wrap gap-1"><Button type="button" variant="default" onClick={() => openDetail(row.original)}><Eye className="size-3.5" /> Xem</Button><Button type="button" variant="outline" onClick={() => openEdit(row.original)}><Pencil className="size-3.5" /> Sửa</Button><Button type="button" variant="destructive" onClick={() => setConfirmAction({ kind: "delete", row: row.original })}><Trash2 className="size-3.5" /> Xóa tạm</Button></div>) },
  ];
}
export function getTrashColumns({ setConfirmAction }: { setConfirmAction: (a: ScreenConfirmAction) => void; }): ColumnDef<ScreenRow>[] {
  return [{ accessorKey: "name", header: "Tên", meta: { filterPlaceholder: "Lọc…" } }, { accessorKey: "deletedAt", header: "Xóa lúc", cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{fmt(getValue() as string)}</span> }, { id: "actions", header: "Thao tác", enableSorting: false, enableColumnFilter: false, cell: ({ row }) => (<div className="flex flex-wrap gap-1"><Button type="button" variant="outline" onClick={() => setConfirmAction({ kind: "restore", row: row.original })}><ArchiveRestore className="size-3.5" /> Khôi phục</Button><Button type="button" variant="destructive" onClick={() => setConfirmAction({ kind: "purge", row: row.original })}><Trash2 className="size-3.5" /> Xóa vĩnh viễn</Button></div>) }];
}
