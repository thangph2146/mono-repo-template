"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArchiveRestore,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
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
import { PageSection } from "@ui/components/layout";
import { ScrollArea } from "@ui/components/scroll-area";
import { Switch } from "@ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Textarea } from "@ui/components/textarea";
import { TypographyH1, TypographyPLargeMuted, TypographyPSmallMuted } from "@ui/components/typography";
import { canUserAccess, isSuperAdminRoleCode, PERMISSION_CODES } from "@workspace/api-client";
import { AdminConfirmActionDialog } from "@/components/admin-confirm-action-dialog";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminTablePaginationFooter } from "@/components/admin-table-pagination-footer";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useRbacCatalog } from "@/hooks/queries";
import { api, type RbacPermission } from "@/lib/api";
import {
  permissionGroupKey,
  permissionGroupLabelVi,
  permissionLabelVi,
} from "@/lib/permission-labels";
import { useAuth } from "@/providers/auth-provider";
import {
  ADMIN_ALERT_DIALOG_CONTENT_CLASS,
  ADMIN_DIALOG_CONTENT_LG_CLASS,
  ADMIN_PAGE_FORM_COLUMN_CLASS,
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_TITLE_ICON_SM_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  error?: string | null;
  data?: T;
  pagination?: { page?: number; limit?: number; total?: number };
};

type RoleRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  permissions: string[];
  isActive: boolean;
  deletedAt: string | null;
};

type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

type RoleFormState = {
  id: string | null;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  permissions: string[];
};

const ROLE_PRESETS: { label: string; code: string; name: string; description: string; permissions: string[] }[] = [
  {
    label: "Phụ huynh",
    code: "parent",
    name: "Phụ huynh",
    description: "Tài khoản phụ huynh — xem kết quả học tập của con",
    permissions: [
      "students:view",
      "students:view_own",
      "notifications:view",
      "notifications:view_own",
    ],
  },
  {
    label: "Biên tập viên",
    code: "editor",
    name: "Biên tập viên",
    description: "Quản lý bài viết, danh mục và thẻ nội dung",
    permissions: [
      "categories:view",
      "categories:create",
      "categories:update",
      "categories:manage",
      "tags:view",
      "tags:create",
      "tags:update",
      "tags:manage",
    ],
  },
  {
    label: "Nhân viên hỗ trợ",
    code: "support_staff",
    name: "Nhân viên hỗ trợ",
    description: "Xem và xử lý yêu cầu liên hệ hỗ trợ",
    permissions: [
      "contact_requests:view",
      "contact_requests:update",
      "contact_requests:assign",
    ],
  },
];

const EMPTY_FORM: RoleFormState = {
  id: null,
  code: "",
  name: "",
  description: "",
  isActive: true,
  permissions: [],
};

function unwrapEnvelope<T>(payload: unknown): T {
  if (!payload || typeof payload !== "object") return payload as T;
  const envelope = payload as ApiEnvelope<T>;
  if (envelope.success === false) {
    throw new Error(envelope.message || envelope.error || "Yeu cau that bai");
  }
  return "data" in envelope ? (envelope.data as T) : (payload as T);
}

function normalizePermissionCodes(value: unknown): string[] {
  const visit = (input: unknown): string[] => {
    if (Array.isArray(input)) return input.flatMap((item) => visit(item));
    if (typeof input !== "string") return [];
    const trimmed = input.trim();
    if (!trimmed) return [];
    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'))
    ) {
      try {
        return visit(JSON.parse(trimmed));
      } catch {
        return [trimmed];
      }
    }
    return [trimmed];
  };
  return [...new Set(visit(value))].sort((a, b) => a.localeCompare(b));
}

function normalizePagedRoles(payload: unknown): PagedResult<RoleRow> {
  const envelope =
    payload && typeof payload === "object" ? (payload as ApiEnvelope<unknown>) : {};
  const raw = envelope.data;
  const rows = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown }).data)
      ? ((raw as { data: unknown[] }).data ?? [])
      : [];

  const items: RoleRow[] = rows.map((row) => {
    const record = row as Record<string, unknown>;
    return {
      id: String(record.id ?? ""),
      code: String(record.name ?? ""),
      name: String(record.displayName ?? record.name ?? ""),
      description: (record.description as string | null | undefined) ?? null,
      permissions: normalizePermissionCodes(record.permissions),
      isActive: Boolean(record.isActive ?? true),
      deletedAt: (record.deletedAt as string | null | undefined) ?? null,
    };
  });

  const pagination = envelope.pagination ?? {};
  const page = Number(pagination.page ?? 1);
  const limit = Number(pagination.limit ?? (items.length || 10));
  const total = Number(pagination.total ?? items.length);
  return { items, total, page, limit };
}

function roleCodeify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function RbacPage() {
  const queryClient = useQueryClient();
  const { user: session } = useAuth();
  const canReadRbac = session != null && canUserAccess(session, PERMISSION_CODES.RBAC_READ);
  const canManageRoles =
    session != null &&
    (session.roles.some((role) => isSuperAdminRoleCode(role.name)) ||
      session.permissions.includes("roles:create") ||
      session.permissions.includes("roles:update") ||
      session.permissions.includes("roles:delete") ||
      session.permissions.includes("roles:manage"));

  const permissionCatalog = useRbacCatalog({
    enabled: Boolean(session) && canReadRbac,
  });
  const permissions = useMemo(
    () => permissionCatalog.data?.permissions ?? [],
    [permissionCatalog.data?.permissions],
  );

  const [tab, setTab] = useState<"list" | "trash">("list");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [trashPage, setTrashPage] = useState(1);
  const [trashPageSize, setTrashPageSize] = useState(15);
  const [globalFilter, setGlobalFilter] = useState("");
  const [trashGlobalFilter, setTrashGlobalFilter] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedRowIds, setSelectedRowIds] = useState<RowSelectionState>({});
  const [trashSelectedRowIds, setTrashSelectedRowIds] = useState<RowSelectionState>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [form, setForm] = useState<RoleFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<RoleRow | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<RoleRow | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<RoleRow | null>(null);

  const debouncedQ = useDebouncedValue(globalFilter, 300);
  const debouncedTrashQ = useDebouncedValue(trashGlobalFilter, 300);

  const listQuery = useQuery({
    queryKey: ["rbac", "roles", "list", page, pageSize, debouncedQ],
    queryFn: async (): Promise<PagedResult<RoleRow>> =>
      normalizePagedRoles(
        await api.http.get("/admin/roles", {
          query: {
            page,
            limit: pageSize,
            search: debouncedQ.trim() || undefined,
            status: "active",
          },
        }),
      ),
    enabled: Boolean(session) && canReadRbac && tab === "list",
  });

  const trashQuery = useQuery({
    queryKey: ["rbac", "roles", "trash", trashPage, trashPageSize, debouncedTrashQ],
    queryFn: async (): Promise<PagedResult<RoleRow>> =>
      normalizePagedRoles(
        await api.http.get("/admin/roles", {
          query: {
            page: trashPage,
            limit: trashPageSize,
            search: debouncedTrashQ.trim() || undefined,
            status: "deleted",
          },
        }),
      ),
    enabled: Boolean(session) && canReadRbac && tab === "trash",
  });

  const invalidateRoles = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["rbac", "roles", "list"] }),
      queryClient.invalidateQueries({ queryKey: ["rbac", "roles", "trash"] }),
      queryClient.invalidateQueries({ queryKey: ["rbac", "catalog"] }),
    ]);
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: async (input: RoleFormState) =>
      unwrapEnvelope<RoleRow>(
        await api.http.post("/admin/roles", {
          name: input.code,
          displayName: input.name,
          description: input.description || null,
          isActive: input.isActive,
          permissions: input.permissions,
        }),
      ),
    onSuccess: invalidateRoles,
  });

  const updateMutation = useMutation({
    mutationFn: async (input: RoleFormState) =>
      unwrapEnvelope<RoleRow>(
        await api.http.put(`/admin/roles/${input.id}`, {
          name: input.code,
          displayName: input.name,
          description: input.description || null,
          isActive: input.isActive,
          permissions: input.permissions,
        }),
      ),
    onSuccess: invalidateRoles,
  });

  const deleteMutation = useMutation({
    /** Luôn dùng bulk soft-delete để tránh nhầm route DELETE (soft vs hard-delete). */
    mutationFn: async (id: string) =>
      api.http.post("/admin/roles/bulk", { action: "delete", ids: [id] }),
    onSuccess: invalidateRoles,
  });
  const restoreMutation = useMutation({
    mutationFn: async (id: string) => api.http.post(`/admin/roles/${id}/restore`),
    onSuccess: invalidateRoles,
  });
  const purgeMutation = useMutation({
    mutationFn: async (id: string) => api.http.delete(`/admin/roles/${id}/hard-delete`),
    onSuccess: invalidateRoles,
  });
  const bulkMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: "delete" | "restore" | "hard-delete"; ids: string[] }) =>
      api.http.post("/admin/roles/bulk", { action, ids }),
    onSuccess: invalidateRoles,
  });

  const listItems = useMemo(() => listQuery.data?.items ?? [], [listQuery.data?.items]);
  const trashItems = useMemo(() => trashQuery.data?.items ?? [], [trashQuery.data?.items]);
  useEffect(() => {
    if (!listItems.length) {
      setSelectedRoleId("");
      return;
    }
    if (!selectedRoleId || !listItems.some((role) => role.id === selectedRoleId)) {
      setSelectedRoleId(listItems[0].id);
    }
  }, [listItems, selectedRoleId]);

  const visiblePermissions = useMemo(() => {
    const q = permissionSearch.trim().toLowerCase();
    if (!q) return permissions;
    return permissions.filter((permission) =>
      [permission.code, permissionLabelVi(permission.code), permission.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [permissionSearch, permissions]);

  const permissionGroups = useMemo(() => {
    const buckets = new Map<string, RbacPermission[]>();
    for (const permission of visiblePermissions) {
      const key = permissionGroupKey(permission.code);
      const arr = buckets.get(key);
      if (arr) arr.push(permission);
      else buckets.set(key, [permission]);
    }
    return Array.from(buckets.entries())
      .map(([key, items]) => ({
        key,
        label: permissionGroupLabelVi(key),
        items: [...items].sort((a, b) => a.code.localeCompare(b.code)),
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [visiblePermissions]);

  const openCreateDialog = () => {
    setForm(EMPTY_FORM);
    setPermissionSearch("");
    setDialogOpen(true);
  };

  const openEditDialog = (role: RoleRow) => {
    setForm({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description ?? "",
      isActive: role.isActive,
      permissions: role.permissions,
    });
    setPermissionSearch("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const code = roleCodeify(form.code || form.name);
    const name = form.name.trim();
    if (!code) {
      toast.error("Mã vai trò không hợp lệ");
      return;
    }
    if (!name) {
      toast.error("Tên vai trò là bắt buộc");
      return;
    }


    const payload: RoleFormState = {
      ...form,
      code,
      name,
      description: form.description.trim(),
    };
    try {
      if (form.id) {
        await updateMutation.mutateAsync(payload);
        toast.success(`Đã cập nhật role "${name}"`);
      } else {
        const created = await createMutation.mutateAsync(payload);
        toast.success(`Đã tạo role "${created.name || name}"`);
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được role");
    }
  };

  const columns = useMemo<ColumnDef<RoleRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Vai trò",
        meta: { filterPlaceholder: "Lọc tên vai trò…" },
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setSelectedRoleId(row.original.id)}
            className="min-w-0 text-left"
          >
            <div className="truncate font-medium">{row.original.name}</div>
            <div className="truncate text-xs font-mono text-muted-foreground">
              {row.original.code}
            </div>
          </button>
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
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg"
              onClick={() => openEditDialog(row.original)}
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
              onClick={() => setDeleteTarget(row.original)}
              disabled={!canManageRoles}
            >
              <Trash2 className="size-3.5" />
              Xóa tạm
            </Button>
          </div>
        ),
      },
    ],
    [canManageRoles],
  );

  const trashColumns = useMemo<ColumnDef<RoleRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Vai trò",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs font-mono text-muted-foreground">{row.original.code}</div>
          </div>
        ),
      },
      {
        accessorKey: "deletedAt",
        header: "Xóa lúc",
        cell: ({ row }) => (
          <TypographyPSmallMuted>
            {row.original.deletedAt ? new Date(row.original.deletedAt).toLocaleString("vi-VN") : "—"}
          </TypographyPSmallMuted>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        enableColumnFilter: false,
        meta: { disableColumnFilter: true },
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg"
              onClick={() => setRestoreTarget(row.original)}
              disabled={!canManageRoles}
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
              disabled={!canManageRoles}
            >
              <Trash2 className="size-3.5" />
              Xóa hẳn
            </Button>
          </div>
        ),
      },
    ],
    [canManageRoles],
  );

  if (!session) return null;

  if (!canReadRbac) {
    return (
      <div className={ADMIN_PAGE_FORM_COLUMN_CLASS}>
        <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
          <Shield className={ADMIN_PAGE_TITLE_ICON_SM_CLASS} aria-hidden />
          Phân quyền
        </TypographyH1>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <CardTitle className="text-base">Không có quyền truy cập</CardTitle>
              <CardDescription className="mt-1">
                Cần quyền <span className="font-mono text-xs">rbac.read</span>.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <PageSection max="full" className="mx-auto min-w-0 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            <Shield className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
            Phân quyền
          </TypographyH1>
          <TypographyPLargeMuted className={ADMIN_PAGE_SUBTITLE_CLASS}>
            Quản lý vai trò bằng bảng dùng chung, đầy đủ luồng tạo/sửa/xóa/khôi phục/xóa hẳn.
          </TypographyPLargeMuted>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-11 rounded-lg" onClick={() => void invalidateRoles()}>
            <RefreshCw className={(listQuery.isFetching || trashQuery.isFetching) ? "size-4 animate-spin" : "size-4"} />
            Làm mới
          </Button>
          {canManageRoles ? (
            <Button type="button" className="h-11 rounded-lg" onClick={openCreateDialog}>
              <Plus className="size-4" />
              Tạo role
            </Button>
          ) : null}
        </div>
      </div>

      <Tabs value={tab} onValueChange={(value) => value === "list" || value === "trash" ? setTab(value) : null}>
        <TabsList className="h-auto min-h-9 flex-wrap gap-1 rounded-lg p-1">
          <TabsTrigger value="list" className="rounded-lg">Danh sách</TabsTrigger>
          <TabsTrigger value="trash" className="rounded-lg">
            Thùng rác
            {(trashQuery.data?.total ?? 0) > 0 ? (
              <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-[10px]">
                {trashQuery.data?.total}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4 space-y-4">
          <AdminDataTable<RoleRow>
            data={listItems}
            getRowId={(row) => row.id}
            columns={columns}
            isLoading={listQuery.isLoading || permissionCatalog.isLoading}
            emptyLabel="Chưa có vai trò."
            manualFiltering
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            globalFilterPlaceholder="Tìm theo tên, mã role..."
            rowSelectionEnabled
            selectedRowIds={selectedRowIds}
            onSelectedRowIdsChange={setSelectedRowIds}
            bulkActions={
              canManageRoles
                ? [
                    {
                      id: "bulk-delete",
                      label: "Xóa tạm đã chọn",
                      variant: "outline",
                      className: "border-destructive/40 text-destructive",
                      onAction: async (rows) => {
                        await bulkMutation.mutateAsync({ action: "delete", ids: rows.map((row) => row.id) });
                        toast.success("Đã xóa tạm các role đã chọn (chuyển vào thùng rác)");
                      },
                    },
                  ]
                : []
            }
            footer={
              <AdminTablePaginationFooter
                page={page}
                pageSize={pageSize}
                total={listQuery.data?.total ?? 0}
                isLoading={listQuery.isLoading}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                emptySummary="Không có vai trò"
                itemLabel="vai trò"
              />
            }
          />

        </TabsContent>

        <TabsContent value="trash" className="mt-4">
          <AdminDataTable<RoleRow>
            data={trashItems}
            getRowId={(row) => row.id}
            columns={trashColumns}
            isLoading={trashQuery.isLoading}
            emptyLabel="Thùng rác trống."
            manualFiltering
            globalFilter={trashGlobalFilter}
            onGlobalFilterChange={setTrashGlobalFilter}
            globalFilterPlaceholder="Tìm trong thùng rác..."
            rowSelectionEnabled
            selectedRowIds={trashSelectedRowIds}
            onSelectedRowIdsChange={setTrashSelectedRowIds}
            bulkActions={
              canManageRoles
                ? [
                    {
                      id: "bulk-restore",
                      label: "Khôi phục đã chọn",
                      onAction: async (rows) => {
                        await bulkMutation.mutateAsync({ action: "restore", ids: rows.map((row) => row.id) });
                        toast.success("Đã khôi phục các role đã chọn");
                      },
                    },
                    {
                      id: "bulk-purge",
                      label: "Xóa hẳn đã chọn",
                      variant: "outline",
                      className: "border-destructive/40 text-destructive",
                      onAction: async (rows) => {
                        await bulkMutation.mutateAsync({ action: "hard-delete", ids: rows.map((row) => row.id) });
                        toast.success("Đã xóa vĩnh viễn các role đã chọn");
                      },
                    },
                  ]
                : []
            }
            footer={
              <AdminTablePaginationFooter
                page={trashPage}
                pageSize={trashPageSize}
                total={trashQuery.data?.total ?? 0}
                isLoading={trashQuery.isLoading}
                onPageChange={setTrashPage}
                onPageSizeChange={setTrashPageSize}
                emptySummary="Không có vai trò trong thùng rác"
                itemLabel="vai trò"
              />
            }
          />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={ADMIN_DIALOG_CONTENT_LG_CLASS}>
          <DialogHeader>
            <DialogTitle>{form.id ? "Cập nhật role" : "Tạo role mới"}</DialogTitle>
            <DialogDescription>
              Thiết lập thông tin vai trò và chọn permission phù hợp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Mã vai trò</Label>
                <Input
                  value={form.code}
                  placeholder="content_editor"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, code: roleCodeify(event.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Tên hiển thị</Label>
                <Input
                  value={form.name}
                  placeholder="Biên tập nội dung"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                      code: current.code || roleCodeify(event.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Mô tả rõ vai trò này phục vụ bộ phận nào..."
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <div className="text-sm font-semibold">Kích hoạt ngay</div>
                <TypographyPSmallMuted>
                  Nếu tắt, role tạo ra ở trạng thái không hoạt động.
                </TypographyPSmallMuted>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Bắt đầu từ mẫu</Label>
              <div className="flex flex-wrap gap-2">
                {ROLE_PRESETS.map((preset) => (
                  <Button
                    key={preset.code}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs"
                    title={preset.permissions.length === 0 ? "Role này không cần permission — quyền truy cập dựa trên tên role" : `Chọn ${preset.permissions.length} permission`}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        code: current.code || preset.code,
                        name: current.name || preset.name,
                        description: current.description || preset.description,
                        permissions: [...new Set([...current.permissions, ...preset.permissions])],
                      }))
                    }
                  >
                    {preset.label}
                    {preset.permissions.length > 0 && (
                      <span className="ml-1 rounded bg-primary/10 px-1 text-[10px] text-primary">
                        {preset.permissions.length}
                      </span>
                    )}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-lg text-xs text-muted-foreground"
                  onClick={() => setForm((current) => ({ ...current, permissions: [] }))}
                >
                  Bỏ chọn tất cả
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Permission ({form.permissions.length}/{permissions.length})</Label>
              <Input
                value={permissionSearch}
                onChange={(event) => setPermissionSearch(event.target.value)}
                placeholder="Tìm permission..."
              />
              <ScrollArea className="h-[220px] rounded-lg border border-border/60 bg-muted/10">
                <div className="space-y-4 p-3">
                  {permissionGroups.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Không có permission khớp tìm kiếm.
                    </p>
                  ) : (
                    permissionGroups.map((group) => {
                      const selectedInGroup = group.items.filter((p) =>
                        form.permissions.includes(p.code),
                      ).length;
                      return (
                        <section
                          key={group.key}
                          className="overflow-hidden rounded-lg border border-border/50 bg-background/70 shadow-sm"
                          aria-labelledby={`perm-group-${group.key}`}
                        >
                          <header
                            id={`perm-group-${group.key}`}
                            className="flex items-center justify-between gap-3 border-b border-border/50 bg-muted/25 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-mono text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {group.key}
                              </p>
                              <p className="truncate text-sm font-semibold text-foreground">{group.label}</p>
                            </div>
                            <span className="shrink-0 rounded-md border border-border/60 bg-background/90 px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                              {selectedInGroup}/{group.items.length}
                            </span>
                          </header>
                          <div className="grid gap-2 p-2 sm:grid-cols-2">
                            {group.items.map((permission) => (
                              <label
                                key={permission.code}
                                className="flex items-start gap-2 rounded-lg border border-border/60 bg-background/90 p-2"
                              >
                                <Checkbox
                                  checked={form.permissions.includes(permission.code)}
                                  onCheckedChange={(checked) =>
                                    setForm((current) => ({
                                      ...current,
                                      permissions:
                                        checked === true
                                          ? [...new Set([...current.permissions, permission.code])]
                                          : current.permissions.filter((item) => item !== permission.code),
                                    }))
                                  }
                                />
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium">
                                    {permissionLabelVi(permission.code)}
                                  </span>
                                  <span className="block font-mono text-xs text-muted-foreground">
                                    {permission.code}
                                  </span>
                                </span>
                              </label>
                            ))}
                          </div>
                        </section>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="mr-auto rounded-lg" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              type="button"
              className="rounded-lg"
              onClick={() => void handleSave()}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {form.id ? "Lưu thay đổi" : "Tạo role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminConfirmActionDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa role?"
        description={
          deleteTarget ? `Role "${deleteTarget.name}" sẽ được xóa tạm và chuyển vào thùng rác.` : undefined
        }
        icon={<Trash2 className="size-4 text-destructive" />}
        confirmLabel="Xóa tạm"
        confirmDestructive
        confirmLoading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
          toast.success(`Đã xóa role "${deleteTarget.name}"`);
          setDeleteTarget(null);
        }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
      />

      <AdminConfirmActionDialog
        open={restoreTarget != null}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
        title="Khôi phục role?"
        description={
          restoreTarget ? `Role "${restoreTarget.name}" sẽ quay lại danh sách hoạt động.` : undefined
        }
        icon={<ArchiveRestore className="size-4 text-primary" />}
        confirmLabel="Khôi phục"
        confirmLoading={restoreMutation.isPending}
        onConfirm={async () => {
          if (!restoreTarget) return;
          await restoreMutation.mutateAsync(restoreTarget.id);
          toast.success(`Đã khôi phục role "${restoreTarget.name}"`);
          setRestoreTarget(null);
        }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
      />

      <AdminConfirmActionDialog
        open={purgeTarget != null}
        onOpenChange={(open) => !open && setPurgeTarget(null)}
        title="Xóa vĩnh viễn role?"
        description={
          purgeTarget ? `Role "${purgeTarget.name}" sẽ bị xóa vĩnh viễn và không thể hoàn tác.` : undefined
        }
        icon={<Trash2 className="size-4 text-destructive" />}
        confirmLabel="Xóa vĩnh viễn"
        confirmDestructive
        confirmLoading={purgeMutation.isPending}
        onConfirm={async () => {
          if (!purgeTarget) return;
          await purgeMutation.mutateAsync(purgeTarget.id);
          toast.success(`Đã xóa vĩnh viễn role "${purgeTarget.name}"`);
          setPurgeTarget(null);
        }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
      />
    </PageSection>
  );
}

