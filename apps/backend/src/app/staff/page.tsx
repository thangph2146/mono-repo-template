"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnFiltersState, OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import {
  AlertCircle,
  ArchiveRestore,
  Info,
  Layers,
  RefreshCw,
  UserPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { PageSection } from "@ui/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { TypographyH1, TypographyH3 } from "@ui/components/typography";
import { ADMIN_PAGE_SUBTITLE_CLASS, ADMIN_PAGE_TITLE_ICON_CLASS, ADMIN_PAGE_TITLE_PRIMARY_CLASS } from "@ui/lib/layout-shell";
import { cn } from "@ui/lib/utils";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { queryKeys, useRbacCatalog, useStaffUserList, useTrashedStaffUsers } from "@/hooks/queries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import {
  buildUsersFilterQuery,
  StaffBulkConfirmDialog,
  StaffConfirmDialog,
  StaffTable,
  StaffTrashTable,
  type StaffRow,
} from "./_component";

function StaffPageInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: session } = useAuth();
  const canManageUsers =
    session != null && canUserAccess(session, PERMISSION_CODES.USERS_MANAGE);

  const rbacQuery = useRbacCatalog({
    enabled: Boolean(session) && canManageUsers,
  });

  const [staffSubTab, setStaffSubTab] = useState<"list" | "trash">("list");
  const [listStaffSelection, setListStaffSelection] =
    useState<RowSelectionState>({});
  const [trashStaffSelection, setTrashStaffSelection] =
    useState<RowSelectionState>({});
  const [staffPage, setStaffPage] = useState(1);
  const [staffPageSize, setStaffPageSize] = useState(25);
  const [trashPage, setTrashPage] = useState(1);
  const [trashPageSize, setTrashPageSize] = useState(25);
  const [trashSearch, setTrashSearch] = useState("");
  const debouncedTrashSearch = useDebouncedValue(trashSearch, 250);

  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedGlobalFilter = useDebouncedValue(globalFilter, 250);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [trashColumnFilters, setTrashColumnFilters] = useState<ColumnFiltersState>([]);

  const [deleteTarget, setDeleteTarget] = useState<StaffRow | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<StaffRow | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<StaffRow | null>(null);
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<string[] | null>(null);
  const [bulkRestoreTarget, setBulkRestoreTarget] = useState<string[] | null>(null);
  const [bulkPurgeTarget, setBulkPurgeTarget] = useState<string[] | null>(null);

  useEffect(() => {
    setStaffPage(1);
  }, [debouncedGlobalFilter, staffPageSize]);

  useEffect(() => {
    setTrashPage(1);
  }, [debouncedTrashSearch, staffSubTab, trashPageSize]);

  useEffect(() => {
    setListStaffSelection({});
    setTrashStaffSelection({});
  }, [staffSubTab]);

  const staffListParams = useMemo(
    () => ({
      q: debouncedGlobalFilter.trim() || undefined,
      page: staffPage,
      limit: staffPageSize,
      filters: buildUsersFilterQuery(columnFilters),
    }),
    [columnFilters, debouncedGlobalFilter, staffPage, staffPageSize]
  );

  const trashListParams = useMemo(
    () => ({
      page: trashPage,
      limit: trashPageSize,
      q: debouncedTrashSearch.trim() || undefined,
      filters: buildUsersFilterQuery(trashColumnFilters),
    }),
    [trashPage, trashPageSize, debouncedTrashSearch, trashColumnFilters]
  );

  const usersQuery = useStaffUserList({
    enabled: Boolean(session) && canManageUsers && staffSubTab === "list",
    listParams: staffListParams,
  });

  const trashedStaffQuery = useTrashedStaffUsers({
    enabled: Boolean(session) && canManageUsers && staffSubTab === "trash",
    listParams: trashListParams,
  });

  const bulkStaffMutation = useMutation({
    mutationFn: async (input: {
      action: "delete" | "restore" | "hard-delete";
      ids: string[];
    }) => api.http.post("/admin/users/bulk", input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.staffUserList() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.usersTrashed() }),
      ]);
    },
  });

  const roles = rbacQuery.data?.roles ?? [];
  const roleFilter = useMemo(() => {
    const value = columnFilters.find((filter) => filter.id === "roles")?.value;
    const normalized = String(value ?? "").trim();
    return normalized || "all";
  }, [columnFilters]);
  const staffListItems = useMemo(
    () => usersQuery.data?.items ?? [],
    [usersQuery.data?.items]
  );
  const staffTotal = usersQuery.data?.total ?? 0;

  const roleFilteredUsers = useMemo(() => {
    return staffListItems.filter((u) => {
      if (roleFilter === "all") return true;
      if (roleFilter === "none") return u.roles.length === 0;
      return u.roles.some((r) => r.code === roleFilter);
    });
  }, [staffListItems, roleFilter]);

  const trashedUsers = trashedStaffQuery.data?.items ?? [];
  const trashStaffTotal = trashedStaffQuery.data?.total ?? 0;

  const busy = bulkStaffMutation.isPending || rbacQuery.isFetching;

  const clearTrashStaffFilters = useCallback((): void => {
    setTrashSearch("");
    setTrashColumnFilters([]);
    setTrashPage(1);
  }, []);

  const handleStaffColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>(
    (updater) => {
      setColumnFilters((prev) =>
        typeof updater === "function" ? updater(prev) : updater
      );
    },
    []
  );

  const clearStaffFilters = useCallback((): void => {
    setGlobalFilter("");
    setColumnFilters([]);
    setStaffPage(1);
  }, []);

  const handleView = useCallback((user: StaffRow) => {
    router.push(`/staff/${user.id}`);
  }, [router]);

  const handleEdit = useCallback((user: StaffRow) => {
    router.push(`/staff/${user.id}/edit`);
  }, [router]);

  const handleDelete = useCallback((user: StaffRow) => {
    setDeleteTarget(user);
  }, []);

  const handleRestore = useCallback((user: StaffRow) => {
    setRestoreTarget(user);
  }, []);

  const handlePurge = useCallback((user: StaffRow) => {
    setPurgeTarget(user);
  }, []);

  const handleBulkDelete = useCallback((ids: string[]) => {
    setBulkDeleteTarget(ids);
  }, []);

  const handleBulkRestore = useCallback((ids: string[]) => {
    setBulkRestoreTarget(ids);
  }, []);

  const handleBulkPurge = useCallback((ids: string[]) => {
    setBulkPurgeTarget(ids);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    if (String(deleteTarget.id) === String(session?.id ?? "")) {
      toast.error("Không thể xoá chính tài khoản đang đăng nhập");
      setDeleteTarget(null);
      return;
    }
    await bulkStaffMutation.mutateAsync({ action: "delete", ids: [String(deleteTarget.id)] });
    toast.success("Đã đưa tài khoản vào thùng rác");
    setDeleteTarget(null);
  }, [deleteTarget, session?.id, bulkStaffMutation]);

  const handleRestoreConfirm = useCallback(async () => {
    if (!restoreTarget) return;
    await bulkStaffMutation.mutateAsync({ action: "restore", ids: [String(restoreTarget.id)] });
    toast.success(`Đã khôi phục ${restoreTarget.email}`);
    setRestoreTarget(null);
  }, [restoreTarget, bulkStaffMutation]);

  const handlePurgeConfirm = useCallback(async () => {
    if (!purgeTarget) return;
    if (String(purgeTarget.id) === String(session?.id ?? "")) {
      toast.error("Không thể xoá vĩnh viễn chính tài khoản đang đăng nhập");
      setPurgeTarget(null);
      return;
    }
    await bulkStaffMutation.mutateAsync({ action: "hard-delete", ids: [String(purgeTarget.id)] });
    toast.success(`Đã xóa vĩnh viễn ${purgeTarget.email}`);
    setPurgeTarget(null);
  }, [purgeTarget, session?.id, bulkStaffMutation]);

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (!bulkDeleteTarget || bulkDeleteTarget.length === 0) return;
    await bulkStaffMutation.mutateAsync({ action: "delete", ids: bulkDeleteTarget });
    toast.success(`Đã đưa ${bulkDeleteTarget.length} tài khoản vào thùng rác`);
    setBulkDeleteTarget(null);
    setListStaffSelection({});
  }, [bulkDeleteTarget, bulkStaffMutation]);

  const handleBulkRestoreConfirm = useCallback(async () => {
    if (!bulkRestoreTarget || bulkRestoreTarget.length === 0) return;
    await bulkStaffMutation.mutateAsync({ action: "restore", ids: bulkRestoreTarget });
    toast.success(`Đã khôi phục ${bulkRestoreTarget.length} tài khoản`);
    setBulkRestoreTarget(null);
    setTrashStaffSelection({});
  }, [bulkRestoreTarget, bulkStaffMutation]);

  const handleBulkPurgeConfirm = useCallback(async () => {
    if (!bulkPurgeTarget || bulkPurgeTarget.length === 0) return;
    if (bulkPurgeTarget.includes(String(session?.id ?? ""))) {
      toast.error("Không thể xoá vĩnh viễn chính tài khoản đang đăng nhập");
      setBulkPurgeTarget(null);
      return;
    }
    await bulkStaffMutation.mutateAsync({ action: "hard-delete", ids: bulkPurgeTarget });
    toast.success(`Đã xóa vĩnh viễn ${bulkPurgeTarget.length} tài khoản`);
    setBulkPurgeTarget(null);
    setTrashStaffSelection({});
  }, [bulkPurgeTarget, session?.id, bulkStaffMutation]);

  if (!session) {
    return null;
  }

  if (!canManageUsers) {
    return (
      <div className="mx-auto min-w-0 max-w-full space-y-6">
        <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
          <Users className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
          Nhân sự
        </TypographyH1>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5">
          <div className="flex flex-row items-start gap-3 p-6">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <TypographyH3 className="text-base font-bold">Không có quyền truy cập</TypographyH3>
              <p className="mt-1 text-sm text-muted-foreground">
                Cần quyền <span className="font-mono text-xs">users.manage</span>. Liên hệ quản trị để được gán vai trò phù hợp.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div>
        <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
          <Users className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
          Nhân sự
        </TypographyH1>
        <p className={cn(ADMIN_PAGE_SUBTITLE_CLASS, "sm:text-base")}>
          Quản lý tài khoản nội bộ, gán vai trò và theo dõi trạng thái hoạt động
          của từng nhân sự trong hệ thống.
        </p>
      </div>

      <div className="space-y-4">
        <Tabs
          value={staffSubTab}
          onValueChange={(v) => {
            if (v === "list" || v === "trash") setStaffSubTab(v);
          }}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList className="h-auto min-h-9 flex-wrap gap-1 rounded-lg p-1">
              <TabsTrigger value="list" className="gap-2 rounded-lg">
                <Layers className="size-4 shrink-0" aria-hidden />
                Danh sách
              </TabsTrigger>
              <TabsTrigger value="trash" className="gap-2 rounded-lg">
                <ArchiveRestore className="size-4 shrink-0" aria-hidden />
                Thùng rác
                {trashedStaffQuery.data != null &&
                  trashedStaffQuery.data.total > 0 ? (
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px] tabular-nums"
                  >
                    {trashedStaffQuery.data.total}
                  </Badge>
                ) : null}
              </TabsTrigger>
            </TabsList>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void usersQuery.refetch()}
              >
                <RefreshCw
                  className={cn("size-4", usersQuery.isFetching && "animate-spin")}
                  aria-hidden
                />
                Làm mới
              </Button>
              <Button
                type="button"
                onClick={() => router.push("/staff/new")}
                disabled={busy || roles.length === 0}
              >
                <UserPlus className="size-4" aria-hidden />
                Thêm nhân sự
              </Button>
            </div>
          </div>

          <TabsContent value="list" className="mt-0 space-y-4">
            <p className="flex gap-2 text-sm text-muted-foreground">
              <Info
                className="mt-0.5 size-4 shrink-0 text-primary/80"
                aria-hidden
              />
              <span>
                Tìm nhanh gọi API phân trang. Chọn vai trò trong thanh công cụ
                bảng để lọc nhanh trên{" "}
                <span className="font-semibold">trang hiện tại</span>; lọc theo
                cột áp dụng thêm trên các dòng đã tải. Chọn số tài khoản/trang ở
                cuối bảng.
              </span>
            </p>

            {usersQuery.isError ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 py-12 text-center">
                <AlertCircle className="mx-auto mb-2 size-10 text-destructive" />
                <p className="text-lg font-bold text-destructive">
                  Không tải được danh sách nhân sự
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {usersQuery.error instanceof Error
                    ? usersQuery.error.message
                    : "Lỗi không xác định"}
                </p>
              </div>
            ) : null}

            {!usersQuery.isError ? (
              <StaffTable
                data={roleFilteredUsers}
                isLoading={usersQuery.isLoading}
                total={staffTotal}
                page={staffPage}
                pageSize={staffPageSize}
                onPageChange={setStaffPage}
                onPageSizeChange={setStaffPageSize}
                columnFilters={columnFilters}
                onColumnFiltersChange={handleStaffColumnFiltersChange}
                globalFilter={globalFilter}
                onGlobalFilterChange={setGlobalFilter}
                selectedRowIds={listStaffSelection}
                onSelectedRowIdsChange={setListStaffSelection}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                busy={busy}
                currentUserId={session?.id}
                onBulkDelete={handleBulkDelete}
                onClearFilters={clearStaffFilters}
                roleOptions={[
                  { value: "none", label: "Chưa gán vai trò" },
                  ...roles.map((r) => ({ value: r.code, label: r.name })),
                ]}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="trash" className="mt-0 space-y-4">
            {trashedStaffQuery.isError ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 py-12 text-center">
                <AlertCircle className="mx-auto mb-2 size-10 text-destructive" />
                <p className="text-lg font-bold text-destructive">
                  Không tải được thùng rác
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {trashedStaffQuery.error instanceof Error
                    ? trashedStaffQuery.error.message
                    : "Lỗi tải thùng rác"}
                </p>
              </div>
            ) : (
              <>
                <p className="flex gap-2 text-sm text-muted-foreground">
                  <ArchiveRestore
                    className="mt-0.5 size-4 shrink-0 text-primary/80"
                    aria-hidden
                  />
                  <span>Tài khoản trong thùng rác không đăng nhập được.</span>
                </p>
                <StaffTrashTable
                  data={trashedUsers}
                  isLoading={trashedStaffQuery.isLoading}
                  total={trashStaffTotal}
                  page={trashPage}
                  pageSize={trashPageSize}
                  onPageChange={setTrashPage}
                  onPageSizeChange={setTrashPageSize}
                  columnFilters={trashColumnFilters}
                  onColumnFiltersChange={setTrashColumnFilters}
                  globalFilter={trashSearch}
                  onGlobalFilterChange={setTrashSearch}
                  selectedRowIds={trashStaffSelection}
                  onSelectedRowIdsChange={setTrashStaffSelection}
                  onRestore={handleRestore}
                  onPurge={handlePurge}
                  busy={busy}
                  onBulkRestore={handleBulkRestore}
                  onBulkPurge={handleBulkPurge}
                  onClearFilters={clearTrashStaffFilters}
                  onRefresh={() => void trashedStaffQuery.refetch()}
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <StaffConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        action="delete"
        target={deleteTarget}
        onConfirm={handleDeleteConfirm}
        loading={bulkStaffMutation.isPending}
      />

      <StaffConfirmDialog
        open={purgeTarget != null}
        onOpenChange={(open) => {
          if (!open) setPurgeTarget(null);
        }}
        action="purge"
        target={purgeTarget}
        onConfirm={handlePurgeConfirm}
        loading={bulkStaffMutation.isPending}
      />

      <StaffConfirmDialog
        open={restoreTarget != null}
        onOpenChange={(open) => {
          if (!open) setRestoreTarget(null);
        }}
        action="restore"
        target={restoreTarget}
        onConfirm={handleRestoreConfirm}
        loading={bulkStaffMutation.isPending}
      />

      <StaffBulkConfirmDialog
        open={bulkDeleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setBulkDeleteTarget(null);
        }}
        action="delete"
        count={bulkDeleteTarget?.length ?? 0}
        onConfirm={handleBulkDeleteConfirm}
        loading={bulkStaffMutation.isPending}
      />

      <StaffBulkConfirmDialog
        open={bulkRestoreTarget != null}
        onOpenChange={(open) => {
          if (!open) setBulkRestoreTarget(null);
        }}
        action="restore"
        count={bulkRestoreTarget?.length ?? 0}
        onConfirm={handleBulkRestoreConfirm}
        loading={bulkStaffMutation.isPending}
      />

      <StaffBulkConfirmDialog
        open={bulkPurgeTarget != null}
        onOpenChange={(open) => {
          if (!open) setBulkPurgeTarget(null);
        }}
        action="purge"
        count={bulkPurgeTarget?.length ?? 0}
        onConfirm={handleBulkPurgeConfirm}
        loading={bulkStaffMutation.isPending}
      />
    </PageSection>
  );
}

export default function StaffPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin"]}>
      <StaffPageInner />
    </AdminPageGuard>
  );
}
