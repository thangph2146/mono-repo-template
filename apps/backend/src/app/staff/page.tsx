"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  ArchiveRestore,
  Check,
  Download,
  FilterX,
  Loader2,
  Shield,
  UserPlus,
  Users,
  Layers,
  Trash2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ui/components/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@ui/components/alert-dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/components/table";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminTablePaginationFooter } from "@/components/admin-table-pagination-footer";
import { ApiError, type RbacRole, type User } from "@/lib/api";
import { downloadCsvFile } from "@/lib/export-csv";
import { downloadXlsxFile } from "@/lib/export-xlsx";
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
} from "@/hooks/queries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

function roleHasPermission(role: RbacRole, permCode: string): boolean {
  if (role.permissions.includes("*")) return true;
  return role.permissions.includes(permCode);
}

export default function StaffAndRbacPage() {
  const { user: session } = useAuth();
  const canManageUsers =
    session != null && canUserAccess(session, PERMISSION_CODES.USERS_MANAGE);
  const canReadRbac =
    session != null && canUserAccess(session, PERMISSION_CODES.RBAC_READ);

  const rbacQuery = useRbacCatalog({
    enabled: Boolean(session) && (canManageUsers || canReadRbac),
  });
  const [staffSubTab, setStaffSubTab] = useState<"list" | "trash">("list");
  const [staffPage, setStaffPage] = useState(1);
  const [staffPageSize, setStaffPageSize] = useState(25);
  const [trashPage, setTrashPage] = useState(1);
  const [trashPageSize, setTrashPageSize] = useState(25);
  const [trashSearch, setTrashSearch] = useState("");
  const debouncedTrashSearch = useDebouncedValue(trashSearch, 250);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    setStaffPage(1);
  }, [debouncedSearch, staffPageSize]);

  useEffect(() => {
    setTrashPage(1);
  }, [debouncedTrashSearch, staffSubTab, trashPageSize]);

  const staffListParams = useMemo(
    () => ({
      q: debouncedSearch.trim() || undefined,
      page: staffPage,
      limit: staffPageSize,
    }),
    [debouncedSearch, staffPage, staffPageSize],
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
  const permissions = rbacQuery.data?.permissions ?? [];

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

  const openEdit = (u: User) => {
    setFormEmail(u.email);
    setFormPassword("");
    setFormFullName(u.fullName);
    setFormActive(u.isActive);
    setFormRoles(u.roles.map((r) => r.code));
    setEditUser(u);
  };

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

  const filteredUsers = useMemo(() => {
    return staffListItems.filter((u) => {
      if (roleFilter === "all") return true;
      if (roleFilter === "none") return u.roles.length === 0;
      return u.roles.some((r) => r.code === roleFilter);
    });
  }, [staffListItems, roleFilter]);

  const trashedUsers = trashedStaffQuery.data?.items ?? [];
  const trashStaffTotal = trashedStaffQuery.data?.total ?? 0;

  const clearTrashStaffFilters = useCallback((): void => {
    setTrashSearch("");
    setTrashPage(1);
  }, []);

  const trashedUserColumns: ColumnDef<User>[] = [
    {
      accessorKey: "email",
      header: "Email",
      enableColumnFilter: false,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{String(getValue())}</span>
      ),
    },
    {
      accessorKey: "fullName",
      header: "Họ tên",
      enableColumnFilter: false,
      cell: ({ getValue }) => (
        <span className="font-medium">{String(getValue())}</span>
      ),
    },
    {
      accessorKey: "deletedAt",
      header: "Xóa lúc",
      enableColumnFilter: false,
      cell: ({ getValue }) => {
        const v = getValue() as string | null | undefined;
        return (
          <span className="text-xs text-muted-foreground">
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
            <ArchiveRestore className="size-3.5" />
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
            <Trash2 className="size-3.5" />
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

  const defaultTab = canManageUsers ? "people" : "rbac";
  const showTabs = canManageUsers && canReadRbac;

  const busy =
    createUser.isPending ||
    updateUser.isPending ||
    deleteUser.isPending ||
    restoreUser.isPending ||
    purgeTrashedUser.isPending ||
    rbacQuery.isFetching;

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
    if (deleteTarget.id === session?.id) {
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
    if (purgeTarget.id === session?.id) {
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

  if (!canManageUsers && !canReadRbac) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Nhân sự & phân quyền</h1>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <CardTitle className="text-base">Không có quyền truy cập</CardTitle>
              <CardDescription className="mt-1">
                Cần quyền{" "}
                <span className="font-mono text-xs">users.manage</span> hoặc{" "}
                <span className="font-mono text-xs">rbac.read</span>. Liên hệ quản
                trị để được gán vai trò phù hợp.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const matrixBody = (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="size-5 text-primary" />
          Ma trận vai trò → quyền
        </CardTitle>
        <CardDescription>
          Dữ liệu chỉ đọc từ hệ thống. Gán quyền thực tế bằng cách gán vai trò cho
          từng tài khoản (hợp quyền = union các role).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rbacQuery.isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
            <Loader2 className="size-4 animate-spin" />
            Đang tải RBAC…
          </div>
        ) : rbacQuery.isError ? (
          <p className="text-sm text-destructive">
            {rbacQuery.error instanceof Error
              ? rbacQuery.error.message
              : "Lỗi tải dữ liệu"}
          </p>
        ) : (
          <div className="w-full overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="sticky left-0 z-[1] bg-muted/90 backdrop-blur min-w-[140px] font-semibold">
                    Vai trò
                  </TableHead>
                  {permissions.map((p) => (
                    <TableHead
                      key={p.code}
                      className="text-center align-bottom min-w-[100px] max-w-[140px] px-1"
                      title={p.description ?? p.code}
                    >
                      <span className="block text-[10px] leading-tight font-mono text-muted-foreground truncate">
                        {p.code}
                      </span>
                      <span className="block text-xs font-medium leading-snug mt-1 line-clamp-2">
                        {p.name}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.code}>
                    <TableCell className="sticky left-0 z-[1] bg-background font-medium">
                      <div>{role.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">
                        {role.code}
                      </div>
                    </TableCell>
                    {permissions.map((p) => {
                      const on = roleHasPermission(role, p.code);
                      return (
                        <TableCell key={p.code} className="text-center p-1">
                          {on ? (
                            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                              <Check className="size-4" aria-label="Có" />
                            </span>
                          ) : (
                            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground/30">
                              —
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const clearStaffFilters = (): void => {
    setSearch("");
    setRoleFilter("all");
    setStaffPage(1);
  };

  const getStaffExportGrid = (): { headers: string[]; rows: string[][] } => {
    const headers = ["Họ tên", "Email", "Vai trò", "Trạng thái"];
    const rows = filteredUsers.map((u) => [
      u.fullName,
      u.email,
      u.roles.length === 0
        ? ""
        : u.roles.map((r) => r.name).join("; "),
      u.isActive ? "Đang hoạt động" : "Khoá",
    ]);
    return { headers, rows };
  };

  const exportStaffListCsv = (): void => {
    const { headers, rows } = getStaffExportGrid();
    downloadCsvFile("nhan-su.csv", headers, rows);
  };

  const exportStaffListXlsx = (): void => {
    const { headers, rows } = getStaffExportGrid();
    void downloadXlsxFile("nhan-su.xlsx", headers, rows, "Nhân sự");
  };

  const peoplePanel = (
    <div className="space-y-4">


      <Tabs
        value={staffSubTab}
        onValueChange={(v) => {
          if (v === "list" || v === "trash") setStaffSubTab(v);
        }}
        className="space-y-4"
      >
        <div className="flex flex-wrap justify-between items-center">
          <TabsList className="h-auto min-h-9 flex-wrap gap-1 rounded-xl p-1">
            <TabsTrigger value="list" className="gap-2 rounded-lg">
              <Layers className="size-4" />
              Danh sách
            </TabsTrigger>
            <TabsTrigger value="trash" className="gap-2 rounded-lg">
              <ArchiveRestore className="size-4" />
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
          <Button
            type="button"
            onClick={openCreate}
            className="gap-2 rounded-xl"
            disabled={busy || roles.length === 0}
          >
            <UserPlus className="size-4" />
            Thêm nhân sự
          </Button>
        </div>


        <TabsContent value="list" className="mt-0 space-y-4">
          <Card className="border-border shadow-sm px-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
              <div className="min-w-[min(100%,18rem)] flex-1 space-y-2">
                <Label htmlFor="staff-search">Tìm nhanh (API)</Label>
                <Input
                  id="staff-search"
                  placeholder="Email hoặc tên nhân viên"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Xuất file
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5 rounded-lg"
                      disabled={filteredUsers.length === 0}
                      onClick={exportStaffListCsv}
                      title="CSV: phân cột bằng ; (Excel VN), UTF-16 LE"
                    >
                      <Download className="size-4" />
                      CSV
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5 rounded-lg"
                      disabled={filteredUsers.length === 0}
                      onClick={exportStaffListXlsx}
                      title="Excel: cột rộng theo nội dung"
                    >
                      <Download className="size-4" />
                      Excel
                    </Button>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 rounded-lg"
                  onClick={clearStaffFilters}
                >
                  <FilterX className="size-4" />
                  Xóa bộ lọc
                </Button>
              </div>

            </div>
            <div className="space-y-2">
              <Label>Lọc vai trò (trang hiện tại)</Label>
              <Select
                value={roleFilter}
                onValueChange={(v) => setRoleFilter(v ?? "all")}
              >
                <SelectTrigger className="w-[200px] rounded-xl">
                  <SelectValue placeholder="Vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="none">Chưa gán vai trò</SelectItem>
                  {roles.map((r) => (
                    <SelectItem key={r.code} value={r.code}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="border-border shadow-sm">
            <CardContent className="p-0">
              {usersQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Đang tải danh sách…
                </div>
              ) : usersQuery.isError ? (
                <p className="p-6 text-sm text-destructive">
                  {usersQuery.error instanceof Error
                    ? usersQuery.error.message
                    : "Lỗi tải danh sách"}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nhân sự</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead className="w-[100px]">Trạng thái</TableHead>
                      <TableHead className="w-[140px] text-right">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="font-medium">{u.fullName}</div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {u.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {u.roles.length === 0 ? (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            ) : (
                              u.roles.map((r) => (
                                <Badge
                                  key={r.code}
                                  variant={
                                    isSuperAdminRoleCode(r.code)
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs font-normal"
                                >
                                  {r.name}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.isActive ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-200 text-emerald-700"
                            >
                              Hoạt động
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground"
                            >
                              Khoá
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="space-x-2 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 rounded-lg"
                            onClick={() => openEdit(u)}
                            disabled={busy}
                          >
                            Sửa
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget(u)}
                            disabled={busy || u.id === session.id}
                            title={
                              u.id === session.id
                                ? "Không xoá tài khoản đang đăng nhập"
                                : "Xoá tạm"
                            }
                          >
                            <Trash2 className="size-3.5" /> Xóa
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
            {staffListPaginationFooter}
          </div>

          {filteredUsers.length === 0 && !usersQuery.isLoading && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Không có bản ghi khớp bộ lọc.
            </p>
          )}
        </TabsContent>

        <TabsContent value="trash" className="mt-0 space-y-4">
          {trashedStaffQuery.isError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 py-12 text-center">
              <p className="text-lg font-bold text-destructive">
                Không tải được thùng rác
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {trashedStaffQuery.error instanceof Error
                  ? trashedStaffQuery.error.message
                  : "Lỗi tải thùng rác"}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Tài khoản trong thùng rác không đăng nhập được.
              </p>
              <AdminDataTable<User>
                data={trashedUsers}
                columns={trashedUserColumns}
                isLoading={trashedStaffQuery.isLoading}
                emptyLabel="Thùng rác trống hoặc không khớp tìm kiếm."
                defaultExpandedAll={false}
                manualFiltering
                globalFilter={trashSearch}
                onGlobalFilterChange={setTrashSearch}
                globalFilterPlaceholder="Tìm theo email, họ tên, SĐT (API)…"
                filterToolbarExtra={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 rounded-lg"
                    onClick={clearTrashStaffFilters}
                  >
                    <FilterX className="size-4" />
                    Xóa bộ lọc
                  </Button>
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
    <div className="space-y-3 max-h-[220px] overflow-y-auto rounded-xl border border-border p-3">
      {roles.length === 0 ? (
        <p className="text-xs text-muted-foreground">Chưa tải được danh sách vai trò.</p>
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
    <div className="space-y-6 mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="size-8 text-primary shrink-0" />
          Nhân sự & phân quyền
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base max-w-3xl">
          Quản lý tài khoản nội bộ, gán vai trò và xem ma trận quyền theo role.
          Quyền thực tế của mỗi người là hợp (union) của tất cả role được gán.
        </p>
      </div>

      {showTabs ? (
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="rounded-xl">
            <TabsTrigger value="people" className="rounded-lg gap-2">
              <Users className="size-4" />
              Danh sách nhân sự
            </TabsTrigger>
            <TabsTrigger value="rbac" className="rounded-lg gap-2">
              <Shield className="size-4" />
              Vai trò & quyền
            </TabsTrigger>
          </TabsList>
          <TabsContent value="people" className="mt-0 space-y-4">
            {peoplePanel}
          </TabsContent>
          <TabsContent value="rbac" className="mt-0">
            {matrixBody}
          </TabsContent>
        </Tabs>
      ) : canManageUsers ? (
        peoplePanel
      ) : (
        matrixBody
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Thêm nhân sự</DialogTitle>
            <DialogDescription>
              Tạo tài khoản mới và gán một hoặc nhiều vai trò. Có thể chỉnh sửa sau.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="c-email">Email đăng nhập</Label>
              <Input
                id="c-email"
                type="email"
                autoComplete="off"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-name">Họ và tên</Label>
              <Input
                id="c-name"
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-pw">Mật khẩu ban đầu</Label>
              <Input
                id="c-pw"
                type="password"
                autoComplete="new-password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Kích hoạt</p>
                <p className="text-xs text-muted-foreground">
                  Tắt để tạo tài khoản ở trạng thái khoá
                </p>
              </div>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>
            <div className="space-y-2">
              <Label>Vai trò</Label>
              {roleChecklist}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateOpen(false)}
            >
              Huỷ
            </Button>
            <Button
              type="button"
              onClick={() => void handleCreate()}
              disabled={createUser.isPending}
              className="gap-2"
            >
              {createUser.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
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
        <DialogContent className="sm:max-w-3xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Sửa nhân sự</DialogTitle>
            <DialogDescription>
              Email cố định. Có thể đặt lại mật khẩu (để trống nếu giữ nguyên).
            </DialogDescription>
          </DialogHeader>
          {editUser && (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={formEmail} disabled className="bg-muted/50 font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-name">Họ và tên</Label>
                  <Input
                    id="e-name"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-pw">Mật khẩu mới (tuỳ chọn)</Label>
                  <Input
                    id="e-pw"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Để trống = không đổi"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Tài khoản hoạt động</p>
                    <p className="text-xs text-muted-foreground">
                      Khoá sẽ chặn đăng nhập
                    </p>
                  </div>
                  <Switch checked={formActive} onCheckedChange={setFormActive} />
                </div>
                <div className="space-y-2">
                  <Label>Vai trò (thay thế toàn bộ khi lưu)</Label>
                  {roleChecklist}
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditUser(null);
                    resetForm();
                  }}
                >
                  Huỷ
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleUpdate()}
                  disabled={updateUser.isPending}
                  className="gap-2"
                >
                  {updateUser.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Lưu thay đổi
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-[450px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Đưa tài khoản vào thùng rác?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  <strong>{deleteTarget.fullName}</strong> ({deleteTarget.email}
                  ) sẽ không đăng nhập được. Có thể khôi phục trong tab Thùng rác.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Xóa tạm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={purgeTarget != null}
        onOpenChange={(o) => {
          if (!o) setPurgeTarget(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-[450px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa vĩnh viễn tài khoản?</AlertDialogTitle>
            <AlertDialogDescription>
              {purgeTarget ? (
                <>
                  Tài khoản <strong>{purgeTarget.fullName}</strong> (
                  {purgeTarget.email}) sẽ bị xoá khỏi cơ sở dữ liệu. Các đơn hàng
                  liên quan sẽ được gỡ liên kết khách / shipper. Không thể hoàn tác.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void handlePurgeTrashedUser();
              }}
              disabled={purgeTrashedUser.isPending}
            >
              {purgeTrashedUser.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Xóa vĩnh viễn"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={restoreTarget != null}
        onOpenChange={(o) => {
          if (!o) setRestoreTarget(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-[450px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Khôi phục tài khoản?</AlertDialogTitle>
            <AlertDialogDescription>
              {restoreTarget ? (
                <>
                  Đưa <strong>{restoreTarget.fullName}</strong> (
                  {restoreTarget.email}) trở lại hoạt động.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl"
              onClick={(e) => {
                e.preventDefault();
                void handleRestoreUser();
              }}
              disabled={restoreUser.isPending}
            >
              {restoreUser.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Khôi phục"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
