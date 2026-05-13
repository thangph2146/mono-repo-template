"use client";

import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  RowSelectionState,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  CheckCircle2,
  CalendarClock,
  FilterX,
  Info,
  KeyRound,
  ListFilter,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Save,
  ShieldHalf,
  UserCircle,
  UserMinus,
  UserPlus,
  Users,
  Layers,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Badge } from "@ui/components/badge";
import { Switch } from "@ui/components/switch";
import { Checkbox } from "@ui/components/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { PageSection } from "@ui/components/layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@ui/components/tabs";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminTablePaginationFooter } from "@/components/admin-table-pagination-footer";
import { AdminConfirmActionDialog } from "@/components/admin-confirm-action-dialog";
import { ApiError, type User } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import {
  canUserAccess,
  isSuperAdminRoleCode,
  PERMISSION_CODES,
} from "@workspace/api-client";
import {
  useCreateStaffUser,
  useDeleteStaffUser,
  usePurgeTrashedStaffUser,
  useRbacCatalog,
  useRestoreStaffUser,
  useStaffUserList,
  useTrashedStaffUsers,
  useUpdateStaffUser,
  queryKeys,
} from "@/hooks/queries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@/lib/api";
import { cn } from "@ui/lib/utils";
import {
  ADMIN_ALERT_DIALOG_CONTENT_CLASS,
  ADMIN_DIALOG_CONTENT_LG_CLASS,
  ADMIN_DIALOG_CONTENT_MD_CLASS,
  ADMIN_PAGE_FORM_COLUMN_CLASS,
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_FORM_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_TITLE_ICON_SM_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";

function buildUsersFilterQuery(columnFilters: ColumnFiltersState): Record<string, string> {
  const query: Record<string, string> = {};
  for (const filter of columnFilters) {
    const value = String(filter.value ?? "").trim();
    if (!value) continue;
    if (filter.id === "fullName") query.name = value;
    else if (filter.id === "email") query.email = value;
    else if (filter.id === "isActive") query.isActive = value;
  }
  return query;
}

export default function StaffPage() {
  const queryClient = useQueryClient();
  const { user: session } = useAuth();
  const canManageUsers =
    session != null && canUserAccess(session, PERMISSION_CODES.USERS_MANAGE);

  const rbacQuery = useRbacCatalog({
    enabled: Boolean(session) && canManageUsers,
  });
  const [staffSubTab, setStaffSubTab] = useState<"list" | "trash">("list");
  const [listStaffSelection, setListStaffSelection] = useState<RowSelectionState>({});
  const [trashStaffSelection, setTrashStaffSelection] = useState<RowSelectionState>({});
  const [staffPage, setStaffPage] = useState(1);
  const [staffPageSize, setStaffPageSize] = useState(25);
  const [trashPage, setTrashPage] = useState(1);
  const [trashPageSize, setTrashPageSize] = useState(25);
  const [trashSearch, setTrashSearch] = useState("");
  const debouncedTrashSearch = useDebouncedValue(trashSearch, 250);

  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedGlobalFilter = useDebouncedValue(globalFilter, 250);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    setStaffPage(1);
  }, [debouncedGlobalFilter, staffPageSize]);

  useEffect(() => {
    setStaffPage(1);
  }, [roleFilter]);

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
    [columnFilters, debouncedGlobalFilter, staffPage, staffPageSize],
  );

  const trashListParams = useMemo(
    () => ({
      page: trashPage,
      limit: trashPageSize,
      q: debouncedTrashSearch.trim() || undefined,
    }),
    [trashPage, trashPageSize, debouncedTrashSearch],
  );

  const usersQuery = useStaffUserList({
    enabled: Boolean(session) && canManageUsers && staffSubTab === "list",
    listParams: staffListParams,
  });

  const trashedStaffQuery = useTrashedStaffUsers({
    enabled: Boolean(session) && canManageUsers && staffSubTab === "trash",
    listParams: trashListParams,
  });

  const createUser = useCreateStaffUser();
  const updateUser = useUpdateStaffUser();
  const deleteUser = useDeleteStaffUser();
  const restoreUser = useRestoreStaffUser();
  const purgeTrashedUser = usePurgeTrashedStaffUser();

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

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<User | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<User | null>(null);

  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formFullName, setFormFullName] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formRoles, setFormRoles] = useState<string[]>([]);

  const roles = rbacQuery.data?.roles ?? [];
  const resetForm = () => {
    setFormEmail("");
    setFormPassword("");
    setFormFullName("");
    setFormActive(true);
    setFormRoles([]);
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = useCallback((u: User) => {
    setFormEmail(u.email);
    setFormPassword("");
    setFormFullName(u.fullName);
    setFormActive(u.isActive);
    setFormRoles(u.roles.map((r) => r.code));
    setEditUser(u);
  }, []);

  const toggleRole = (code: string, checked: boolean) => {
    setFormRoles((prev) => {
      if (checked) return [...new Set([...prev, code])];
      return prev.filter((c) => c !== code);
    });
  };

  const staffListItems = useMemo(
    () => usersQuery.data?.items ?? [],
    [usersQuery.data?.items],
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

  const busy =
    createUser.isPending ||
    updateUser.isPending ||
    deleteUser.isPending ||
    restoreUser.isPending ||
    purgeTrashedUser.isPending ||
    bulkStaffMutation.isPending ||
    rbacQuery.isFetching;

  const clearTrashStaffFilters = useCallback((): void => {
    setTrashSearch("");
    setTrashPage(1);
  }, []);

  const handleStaffColumnFiltersChange =
    useCallback<OnChangeFn<ColumnFiltersState>>((updater) => {
      setColumnFilters((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      );
    }, []);

  const clearStaffFilters = useCallback((): void => {
    setGlobalFilter("");
    setRoleFilter("all");
    setColumnFilters([]);
    setStaffPage(1);
  }, []);

  const trashedUserColumns: ColumnDef<User>[] = [
    {
      accessorKey: "email",
      header: "Email",
      enableColumnFilter: false,
      cell: ({ getValue }) => (
        <span className="flex items-center gap-2 font-mono text-xs min-w-0">
          <Mail className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate">{String(getValue())}</span>
        </span>
      ),
    },
    {
      accessorKey: "fullName",
      header: "Họ tên",
      enableColumnFilter: false,
      cell: ({ getValue }) => (
        <span className="flex items-center gap-2 min-w-0">
          <UserCircle
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="font-medium truncate">{String(getValue())}</span>
        </span>
      ),
    },
    {
      accessorKey: "deletedAt",
      header: "Xóa lúc",
      enableColumnFilter: false,
      cell: ({ getValue }) => {
        const v = getValue() as string | null | undefined;
        return (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5 shrink-0" aria-hidden />
            {v ? new Date(v).toLocaleString("vi-VN") : "—"}
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
            onClick={() => setRestoreTarget(row.original)}
            disabled={restoreUser.isPending || purgeTrashedUser.isPending}
          >
            <ArchiveRestore className="size-3.5" aria-hidden />
            Khôi phục
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => setPurgeTarget(row.original)}
            disabled={restoreUser.isPending || purgeTrashedUser.isPending}
          >
            <Trash2 className="size-3.5" aria-hidden />
            Xóa hẳn
          </Button>
        </div>
      ),
    },
  ];

  const trashStaffPaginationFooter = (
    <AdminTablePaginationFooter
      page={trashPage}
      pageSize={trashPageSize}
      total={trashStaffTotal}
      isLoading={trashedStaffQuery.isLoading}
      onPageChange={setTrashPage}
      onPageSizeChange={setTrashPageSize}
      emptySummary="Không có tài khoản trong thùng rác"
      itemLabel="tài khoản"
    />
  );

  const staffListPaginationFooter = (
    <AdminTablePaginationFooter
      page={staffPage}
      pageSize={staffPageSize}
      total={staffTotal}
      isLoading={usersQuery.isLoading}
      onPageChange={setStaffPage}
      onPageSizeChange={setStaffPageSize}
      emptySummary="Không có nhân sự"
      itemLabel="tài khoản"
    />
  );

  const staffColumns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Họ tên",
        meta: { filterPlaceholder: "Lọc họ tên…" },
        cell: ({ row }) => (
          <span className="flex items-center gap-2 min-w-0">
            <UserCircle
              className="size-4 shrink-0 text-primary/80"
              aria-hidden
            />
            <span className="font-medium truncate">{row.original.fullName}</span>
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ getValue }) => (
          <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground min-w-0">
            <Mail className="size-3.5 shrink-0 opacity-80" aria-hidden />
            <span className="truncate">{String(getValue())}</span>
          </span>
        ),
        meta: { filterPlaceholder: "Lọc email…" },
      },
      {
        accessorKey: "phone",
        header: "SĐT",
        cell: ({ getValue }) => {
          const v = getValue() as string | null | undefined;
          return v ? (
            <span className="flex items-center gap-2 font-mono text-xs tabular-nums">
              <Phone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              {v}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="size-3.5 opacity-40" aria-hidden />
              —
            </span>
          );
        },
        meta: { filterPlaceholder: "Lọc SĐT…" },
      },
      {
        id: "roles",
        accessorFn: (u) =>
          u.roles.length === 0 ? "" : u.roles.map((r) => r.name).join("; "),
        header: "Vai trò",
        cell: ({ row }) => {
          const u = row.original;
          if (u.roles.length === 0) {
            return (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldHalf className="size-3.5 shrink-0 opacity-60" aria-hidden />
                —
              </span>
            );
          }
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              <ShieldHalf
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div className="flex flex-wrap gap-1">
                {u.roles.map((r) => (
                  <Badge
                    key={r.code}
                    variant={
                      isSuperAdminRoleCode(r.code) ? "default" : "secondary"
                    }
                    className="text-xs font-normal"
                  >
                    {r.name}
                  </Badge>
                ))}
              </div>
            </div>
          );
        },
        meta: { filterPlaceholder: "Lọc theo tên vai trò…" },
      },
      {
        id: "isActive",
        accessorFn: (u) => (u.isActive ? "true" : "false"),
        header: "Trạng thái",
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge
              variant="outline"
              className="gap-1 border-emerald-200 pr-2 text-emerald-700"
            >
              <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
              Hoạt động
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-muted-foreground gap-1 pr-2"
            >
              <Lock className="size-3.5 shrink-0" aria-hidden />
              Khoá
            </Badge>
          ),
        filterFn: (row, id, v) => {
          if (v == null || v === "") return true;
          return row.getValue(id) === v;
        },
        meta: {
          filterVariant: "select",
          filterLabel: "Trạng thái",
          selectOptions: [
            { value: "true", label: "Hoạt động" },
            { value: "false", label: "Khoá" },
          ],
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        enableColumnFilter: false,
        enableSorting: false,
        meta: { disableColumnFilter: true },
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex flex-wrap justify-end gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 rounded-lg"
                onClick={() => openEdit(u)}
                disabled={busy}
              >
                <Pencil className="size-3.5" aria-hidden />
                Sửa
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteTarget(u)}
                disabled={busy || String(u.id) === String(session?.id ?? "")}
                title={
                  String(u.id) === String(session?.id ?? "")
                    ? "Không xoá tài khoản đang đăng nhập"
                    : "Xoá tạm"
                }
              >
                <Trash2 className="size-3.5" aria-hidden /> Xóa tạm
              </Button>
            </div>
          );
        },
      },
    ],
    [session?.id, busy, openEdit],
  );

  const handleCreate = async () => {
    const email = formEmail.trim();
    const fullName = formFullName.trim();
    const password = formPassword.trim();
    if (!email || !fullName) {
      toast.error("Nhập email và họ tên");
      return;
    }
    if (password.length < 6) {
      toast.error("Mật khẩu tối thiểu 6 ký tự");
      return;
    }
    try {
      await createUser.mutateAsync({
        email,
        fullName,
        password,
        isActive: formActive,
        roleCodes: formRoles.length ? formRoles : undefined,
      });
      toast.success("Đã tạo tài khoản");
      setCreateOpen(false);
      resetForm();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Không tạo được user");
    }
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    const fullName = formFullName.trim();
    if (!fullName) {
      toast.error("Nhập họ tên");
      return;
    }
    const payload: {
      fullName: string;
      isActive: boolean;
      roleCodes: string[];
      password?: string;
    } = {
      fullName,
      isActive: formActive,
      roleCodes: formRoles,
    };
    const pw = formPassword.trim();
    if (pw.length > 0) {
      if (pw.length < 6) {
        toast.error("Mật khẩu mới tối thiểu 6 ký tự");
        return;
      }
      payload.password = pw;
    }
    try {
      await updateUser.mutateAsync({ id: editUser.id, input: payload });
      toast.success("Đã cập nhật nhân sự");
      setEditUser(null);
      resetForm();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Không lưu được");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (String(deleteTarget.id) === String(session?.id ?? "")) {
      toast.error("Không thể xoá chính tài khoản đang đăng nhập");
      setDeleteTarget(null);
      return;
    }
    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      toast.success("Đã đưa tài khoản vào thùng rác");
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Không xoá được");
    }
  };

  const handleRestoreUser = async (): Promise<void> => {
    if (!restoreTarget) return;
    try {
      await restoreUser.mutateAsync(restoreTarget.id);
      toast.success(`Đã khôi phục ${restoreTarget.email}`);
      setRestoreTarget(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Không khôi phục được");
    }
  };

  const handlePurgeTrashedUser = async (): Promise<void> => {
    if (!purgeTarget) return;
    if (String(purgeTarget.id) === String(session?.id ?? "")) {
      toast.error("Không thể xoá vĩnh viễn chính tài khoản đang đăng nhập");
      setPurgeTarget(null);
      return;
    }
    try {
      await purgeTrashedUser.mutateAsync(purgeTarget.id);
      toast.success(`Đã xóa vĩnh viễn ${purgeTarget.email}`);
      setPurgeTarget(null);
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : "Không xóa vĩnh viễn được",
      );
    }
  };

  if (!session) {
    return null;
  }

  if (!canManageUsers) {
    return (
      <div className={ADMIN_PAGE_FORM_COLUMN_CLASS}>
        <h1 className={ADMIN_PAGE_TITLE_FORM_CLASS}>
          <Users className={ADMIN_PAGE_TITLE_ICON_SM_CLASS} aria-hidden />
          Nhân sự
        </h1>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <CardTitle className="text-base">Không có quyền truy cập</CardTitle>
              <CardDescription className="mt-1">
                Cần quyền <span className="font-mono text-xs">users.manage</span>.
                Liên hệ quản trị để được gán vai trò phù hợp.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const peoplePanel = (
    <div className="space-y-4">


      <Tabs
        value={staffSubTab}
        onValueChange={(v) => {
          if (v === "list" || v === "trash") setStaffSubTab(v);
        }}
        className="space-y-4"
      >
        <div className="flex flex-wrap justify-between items-center gap-3">
          <TabsList className="h-auto min-h-9 flex-wrap gap-1 rounded-lg p-1">
            <TabsTrigger value="list" className="gap-2 rounded-lg">
              <Layers className="size-4 shrink-0" aria-hidden />
              Danh sách
            </TabsTrigger>
            <TabsTrigger value="trash" className="gap-2 rounded-lg">
              <ArchiveRestore className="size-4 shrink-0" aria-hidden />
              Thùng rác
              {trashedStaffQuery.data != null && trashedStaffQuery.data.total > 0 ? (
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
              className="flex h-11 items-center gap-2 rounded-lg border-outline-variant px-4 font-semibold hover:bg-muted"
              onClick={() => void usersQuery.refetch()}
            >
              <RefreshCw
                className={cn(
                  "size-4",
                  usersQuery.isFetching && "animate-spin",
                )}
                aria-hidden
              />
              Làm mới
            </Button>
            <Button
              type="button"
              onClick={openCreate}
              className="flex h-11 items-center gap-2 rounded-lg px-5 font-bold shadow-md"
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
              className="size-4 shrink-0 text-primary/80 mt-0.5"
              aria-hidden
            />
            <span>
              Tìm nhanh gọi API phân trang. Chọn vai trò trong thanh công cụ bảng để
              lọc nhanh trên <span className="font-semibold">trang hiện tại</span>; lọc
              theo cột áp dụng thêm trên các dòng đã tải. Chọn số tài khoản/trang ở
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
            <AdminDataTable<User>
              data={roleFilteredUsers}
              getRowId={(row) => String(row.id)}
              columns={staffColumns}
              isLoading={usersQuery.isLoading}
              emptyLabel="Không có tài khoản khớp tìm kiếm API hoặc bộ lọc vai trò / cột."
              defaultExpandedAll={false}
              manualFiltering
              columnFilters={columnFilters}
              onColumnFiltersChange={handleStaffColumnFiltersChange}
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
              globalFilterPlaceholder="Tìm theo email, họ tên (API)…"
              rowSelectionEnabled={canManageUsers}
              selectedRowIds={listStaffSelection}
              onSelectedRowIdsChange={setListStaffSelection}
              canSelectRow={(row) => String(row.original.id) !== String(session?.id ?? "")}
              bulkActions={[
                {
                  id: "bulk-staff-delete",
                  label: "Xóa tạm đã chọn",
                  variant: "outline",
                  className: "border-destructive/40 text-destructive",
                  onAction: async (rows) => {
                    const ids = rows
                      .filter((u) => String(u.id) !== String(session?.id ?? ""))
                      .map((u) => String(u.id));
                    if (!ids.length) return;
                    await bulkStaffMutation.mutateAsync({ action: "delete", ids });
                    toast.success(`Đã đưa ${ids.length} tài khoản vào thùng rác`);
                  },
                },
              ]}
              filterToolbarExtra={
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex items-end gap-2">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground"
                      title="Lọc theo vai trò"
                    >
                      <ListFilter className="size-4" aria-hidden />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Vai trò (trang hiện tại)
                      </span>
                      <Select
                        value={roleFilter}
                        onValueChange={(v) => setRoleFilter(v ?? "all")}
                      >
                        <SelectTrigger className="h-9 min-w-[12rem] rounded-lg">
                          <SelectValue placeholder="Vai trò" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            <span className="flex items-center gap-2">
                              <Users className="size-3.5 opacity-70" aria-hidden />
                              Tất cả
                            </span>
                          </SelectItem>
                          <SelectItem value="none">
                            <span className="flex items-center gap-2">
                              <UserMinus className="size-3.5 opacity-70" aria-hidden />
                              Chưa gán vai trò
                            </span>
                          </SelectItem>
                          {roles.map((r) => (
                            <SelectItem key={r.code} value={r.code}>
                              <span className="flex items-center gap-2">
                                <ShieldHalf
                                  className="size-3.5 shrink-0 opacity-70"
                                  aria-hidden
                                />
                                {r.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 rounded-lg"
                    onClick={clearStaffFilters}
                  >
                    <FilterX className="size-4" aria-hidden />
                    Xóa bộ lọc
                  </Button>
                </div>
              }
              csvExport={{ fileName: "nhan-su.csv" }}
              footer={staffListPaginationFooter}
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
                  className="size-4 shrink-0 text-primary/80 mt-0.5"
                  aria-hidden
                />
                <span>
                  Tài khoản trong thùng rác không đăng nhập được.
                </span>
              </p>
              <AdminDataTable<User>
                data={trashedUsers}
                getRowId={(row) => String(row.id)}
                columns={trashedUserColumns}
                isLoading={trashedStaffQuery.isLoading}
                emptyLabel="Thùng rác trống hoặc không khớp tìm kiếm."
                defaultExpandedAll={false}
                manualFiltering
                globalFilter={trashSearch}
                onGlobalFilterChange={setTrashSearch}
                globalFilterPlaceholder="Tìm theo email, họ tên, SĐT (API)…"
                rowSelectionEnabled={canManageUsers}
                selectedRowIds={trashStaffSelection}
                onSelectedRowIdsChange={setTrashStaffSelection}
                bulkActions={[
                  {
                    id: "bulk-staff-restore",
                    label: "Khôi phục đã chọn",
                    onAction: async (rows) => {
                      const ids = rows.map((u) => String(u.id));
                      if (!ids.length) return;
                      await bulkStaffMutation.mutateAsync({ action: "restore", ids });
                      toast.success(`Đã khôi phục ${ids.length} tài khoản`);
                    },
                  },
                  {
                    id: "bulk-staff-purge",
                    label: "Xóa vĩnh viễn đã chọn",
                    variant: "outline",
                    className: "border-destructive/40 text-destructive",
                    onAction: async (rows) => {
                      const ids = rows.map((u) => String(u.id));
                      if (!ids.length) return;
                      await bulkStaffMutation.mutateAsync({ action: "hard-delete", ids });
                      toast.success(`Đã xóa vĩnh viễn ${ids.length} tài khoản`);
                    },
                  },
                ]}
                filterToolbarExtra={
                  <div className="flex flex-wrap items-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5 rounded-lg"
                      onClick={() => void trashedStaffQuery.refetch()}
                    >
                      <RefreshCw
                        className={cn(
                          "size-4",
                          trashedStaffQuery.isFetching && "animate-spin",
                        )}
                        aria-hidden
                      />
                      Làm mới
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5 rounded-lg"
                      onClick={clearTrashStaffFilters}
                    >
                      <FilterX className="size-4" aria-hidden />
                      Xóa bộ lọc
                    </Button>
                  </div>
                }
                csvExport={{ fileName: "nhan-su-thung-rac.csv" }}
                footer={trashStaffPaginationFooter}
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  const roleChecklist = (
    <div className="space-y-3 max-h-[220px] overflow-y-auto rounded-lg border border-border p-3">
      {roles.length === 0 ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="size-3.5 shrink-0 opacity-70" aria-hidden />
          Chưa tải được danh sách vai trò.
        </p>
      ) : (
        roles.map((r) => (
          <label
            key={r.code}
            className="flex items-start gap-3 cursor-pointer rounded-lg p-2 hover:bg-muted/60"
          >
            <Checkbox
              checked={formRoles.includes(r.code)}
              onCheckedChange={(v) => toggleRole(r.code, v === true)}
              className="mt-0.5"
            />
            <ShieldHalf
              className="mt-0.5 size-4 shrink-0 text-primary/70"
              aria-hidden
            />
            <span>
              <span className="text-sm font-medium block">{r.name}</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {r.code}
              </span>
            </span>
          </label>
        ))
      )}
    </div>
  );

  return (
    <PageSection max="full" className="mx-auto min-w-0 space-y-6">
      <div>
        <h1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
          <Users className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
          Nhân sự
        </h1>
        <p className={cn(ADMIN_PAGE_SUBTITLE_CLASS, "sm:text-base")}>
          Quản lý tài khoản nội bộ, gán vai trò và theo dõi trạng thái hoạt động
          của từng nhân sự trong hệ thống.
        </p>
      </div>

      {peoplePanel}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className={ADMIN_DIALOG_CONTENT_MD_CLASS}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-extrabold">
              <UserPlus className="size-7 shrink-0 text-primary" aria-hidden />
              Thêm nhân sự
            </DialogTitle>
            <DialogDescription>
              Tạo tài khoản mới và gán một hoặc nhiều vai trò. Có thể chỉnh sửa sau.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="c-email" className="flex items-center gap-2">
                <Mail className="size-3.5 text-muted-foreground" aria-hidden />
                Email đăng nhập
              </Label>
              <Input
                id="c-email"
                type="email"
                autoComplete="off"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-name" className="flex items-center gap-2">
                <UserCircle className="size-3.5 text-muted-foreground" aria-hidden />
                Họ và tên
              </Label>
              <Input
                id="c-name"
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-pw" className="flex items-center gap-2">
                <KeyRound className="size-3.5 text-muted-foreground" aria-hidden />
                Mật khẩu ban đầu
              </Label>
              <Input
                id="c-pw"
                type="password"
                autoComplete="new-password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 rounded-lg bg-muted p-1.5 shrink-0">
                  {formActive ? (
                    <CheckCircle2
                      className="size-4 text-emerald-600"
                      aria-hidden
                    />
                  ) : (
                    <Lock className="size-4 text-muted-foreground" aria-hidden />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Kích hoạt</p>
                  <p className="text-xs text-muted-foreground">
                    Tắt để tạo tài khoản ở trạng thái khoá
                  </p>
                </div>
              </div>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ShieldHalf className="size-3.5 text-muted-foreground" aria-hidden />
                Vai trò
              </Label>
              {roleChecklist}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2 rounded-lg"
              onClick={() => setCreateOpen(false)}
            >
              <X className="size-4" aria-hidden />
              Huỷ
            </Button>
            <Button
              type="button"
              onClick={() => void handleCreate()}
              disabled={createUser.isPending}
              className="gap-2 rounded-lg font-bold"
            >
              {createUser.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Save className="size-4" aria-hidden />
              )}
              Tạo tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editUser != null}
        onOpenChange={(o) => {
          if (!o) {
            setEditUser(null);
            resetForm();
          }
        }}
      >
        <DialogContent className={ADMIN_DIALOG_CONTENT_LG_CLASS}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-extrabold">
              <Pencil className="size-7 shrink-0 text-primary" aria-hidden />
              Sửa nhân sự
            </DialogTitle>
            <DialogDescription>
              Email cố định. Có thể đặt lại mật khẩu (để trống nếu giữ nguyên).
            </DialogDescription>
          </DialogHeader>
          {editUser && (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="size-3.5 text-muted-foreground" aria-hidden />
                    Email
                  </Label>
                  <Input value={formEmail} disabled className="bg-muted/50 font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-name" className="flex items-center gap-2">
                    <UserCircle className="size-3.5 text-muted-foreground" aria-hidden />
                    Họ và tên
                  </Label>
                  <Input
                    id="e-name"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-pw" className="flex items-center gap-2">
                    <KeyRound className="size-3.5 text-muted-foreground" aria-hidden />
                    Mật khẩu mới (tuỳ chọn)
                  </Label>
                  <Input
                    id="e-pw"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Để trống = không đổi"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 rounded-lg bg-muted p-1.5 shrink-0">
                      {formActive ? (
                        <CheckCircle2
                          className="size-4 text-emerald-600"
                          aria-hidden
                        />
                      ) : (
                        <Lock className="size-4 text-muted-foreground" aria-hidden />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Tài khoản hoạt động</p>
                      <p className="text-xs text-muted-foreground">
                        Khoá sẽ chặn đăng nhập
                      </p>
                    </div>
                  </div>
                  <Switch checked={formActive} onCheckedChange={setFormActive} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ShieldHalf className="size-3.5 text-muted-foreground" aria-hidden />
                    Vai trò (thay thế toàn bộ khi lưu)
                  </Label>
                  {roleChecklist}
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 rounded-lg"
                  onClick={() => {
                    setEditUser(null);
                    resetForm();
                  }}
                >
                  <X className="size-4" aria-hidden />
                  Huỷ
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleUpdate()}
                  disabled={updateUser.isPending}
                  className="gap-2 rounded-lg font-bold"
                >
                  {updateUser.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Save className="size-4" aria-hidden />
                  )}
                  Lưu thay đổi
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AdminConfirmActionDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        footerClassName="gap-2"
        icon={<Archive className="size-5 shrink-0 text-destructive" aria-hidden />}
        title="Đưa tài khoản vào thùng rác?"
        description={
          deleteTarget ? (
            <>
              <strong>{deleteTarget.fullName}</strong> ({deleteTarget.email}) sẽ không đăng nhập
              được. Có thể khôi phục trong tab Thùng rác.
            </>
          ) : null
        }
        confirmLabel="Xóa tạm"
        confirmDestructive
        confirmDisabled={deleteUser.isPending}
        confirmLoading={deleteUser.isPending}
        onConfirm={() => {
          void handleDelete();
        }}
      />

      <AdminConfirmActionDialog
        open={purgeTarget != null}
        onOpenChange={(open) => {
          if (!open) setPurgeTarget(null);
        }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        footerClassName="gap-2"
        icon={<Trash2 className="size-5 shrink-0 text-destructive" aria-hidden />}
        title="Xóa vĩnh viễn tài khoản?"
        description={
          purgeTarget ? (
            <>
              Tài khoản <strong>{purgeTarget.fullName}</strong> ({purgeTarget.email}) sẽ bị xoá khỏi
              cơ sở dữ liệu. Các đơn hàng liên quan sẽ được gỡ liên kết khách / shipper. Không thể
              hoàn tác.
            </>
          ) : null
        }
        confirmLabel="Xóa vĩnh viễn"
        confirmDestructive
        confirmDisabled={purgeTrashedUser.isPending}
        confirmLoading={purgeTrashedUser.isPending}
        onConfirm={() => {
          void handlePurgeTrashedUser();
        }}
      />

      <AdminConfirmActionDialog
        open={restoreTarget != null}
        onOpenChange={(open) => {
          if (!open) setRestoreTarget(null);
        }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        footerClassName="gap-2"
        icon={<ArchiveRestore className="size-5 shrink-0 text-primary" aria-hidden />}
        title="Khôi phục tài khoản?"
        description={
          restoreTarget ? (
            <>
              Đưa <strong>{restoreTarget.fullName}</strong> ({restoreTarget.email}) trở lại hoạt
              động.
            </>
          ) : null
        }
        confirmLabel="Khôi phục"
        confirmDisabled={restoreUser.isPending}
        confirmLoading={restoreUser.isPending}
        onConfirm={() => {
          void handleRestoreUser();
        }}
      />
    </PageSection>
  );
}
