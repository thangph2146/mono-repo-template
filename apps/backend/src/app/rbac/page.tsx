"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  UserCircle,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/components/table";
import { Textarea } from "@ui/components/textarea";
import { canUserAccess, isSuperAdminRoleCode, PERMISSION_CODES } from "@workspace/api-client";
import { api } from "@/lib/api";
import { useRbacCatalog } from "@/hooks/queries";
import { useAuth } from "@/providers/auth-provider";
import { permissionLabelVi } from "@/lib/permission-labels";
import {
  ADMIN_DIALOG_CONTENT_LG_CLASS,
  ADMIN_PAGE_FORM_COLUMN_CLASS,
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_FORM_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_TITLE_ICON_SM_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";

type CreateRoleInput = {
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  permissions: string[];
};

type CreateRoleResponse = {
  id?: string | number;
  name?: string;
  displayName?: string;
  description?: string | null;
  permissions?: unknown;
  isActive?: boolean;
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  error?: string | null;
  data?: T;
};

function roleHasPermission(role: { permissions: string[] }, permCode: string): boolean {
  if (role.permissions.includes("*")) return true;
  return role.permissions.includes(permCode);
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

function unwrapEnvelope<T>(payload: unknown): T {
  if (!payload || typeof payload !== "object") return payload as T;
  const envelope = payload as ApiEnvelope<T>;
  if (envelope.success === false) {
    throw new Error(envelope.message || envelope.error || "Yeu cau that bai");
  }
  return "data" in envelope ? (envelope.data as T) : (payload as T);
}

function groupPermissions(
  permissionCodes: string[],
  descriptions?: Record<string, string | null>,
): Array<{ resource: string; label: string; codes: Array<{ code: string; label: string; description: string | null }> }> {
  const grouped = new Map<
    string,
    Array<{ code: string; label: string; description: string | null }>
  >();

  for (const code of permissionCodes) {
    const [resource] = code.split(":");
    const bucket = grouped.get(resource) ?? [];
    bucket.push({
      code,
      label: permissionLabelVi(code),
      description: descriptions?.[code] ?? null,
    });
    grouped.set(resource, bucket);
  }

  return [...grouped.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([resource, codes]) => ({
      resource,
      label: resource
        .split(/[_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
      codes: codes.sort((a, b) => a.code.localeCompare(b.code)),
    }));
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Shield;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardContent className="flex items-start gap-4 p-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RbacPage() {
  const queryClient = useQueryClient();
  const { user: session } = useAuth();
  const canReadRbac =
    session != null && canUserAccess(session, PERMISSION_CODES.RBAC_READ);
  const canCreateRole =
    session != null &&
    (session.roles.some((role) => isSuperAdminRoleCode(role.name)) ||
      session.permissions.includes("roles:create") ||
      session.permissions.includes("roles:manage"));

  const rbacQuery = useRbacCatalog({
    enabled: Boolean(session) && canReadRbac,
  });

  const [selectedRoleCode, setSelectedRoleCode] = useState<string>("");
  const [roleSearch, setRoleSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createPermissionSearch, setCreatePermissionSearch] = useState("");
  const [form, setForm] = useState<CreateRoleInput>({
    name: "",
    displayName: "",
    description: "",
    isActive: true,
    permissions: [],
  });

  const createRole = useMutation({
    mutationFn: async (input: CreateRoleInput) =>
      unwrapEnvelope<CreateRoleResponse>(
        await api.http.post("/admin/roles", {
          name: input.name,
          displayName: input.displayName,
          description: input.description || null,
          isActive: input.isActive,
          permissions: input.permissions,
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rbac", "catalog"] });
    },
  });

  const roles = rbacQuery.data?.roles ?? [];
  const permissions = rbacQuery.data?.permissions ?? [];
  const permissionDescriptions = useMemo(
    () =>
      Object.fromEntries(
        permissions.map((permission) => [permission.code, permission.description ?? null]),
      ),
    [permissions],
  );

  useEffect(() => {
    if (!roles.length) {
      setSelectedRoleCode("");
      return;
    }
    if (!selectedRoleCode || !roles.some((role) => role.code === selectedRoleCode)) {
      setSelectedRoleCode(roles[0].code);
    }
  }, [roles, selectedRoleCode]);

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((role) =>
      [role.name, role.code, role.description ?? ""].some((value) =>
        value.toLowerCase().includes(q),
      ),
    );
  }, [roles, roleSearch]);

  const filteredPermissions = useMemo(() => {
    const q = permissionSearch.trim().toLowerCase();
    if (!q) return permissions;
    return permissions.filter((permission) =>
      [permission.code, permissionLabelVi(permission.code), permission.description ?? ""].some((value) =>
        value.toLowerCase().includes(q),
      ),
    );
  }, [permissions, permissionSearch]);

  const selectedRole =
    roles.find((role) => role.code === selectedRoleCode) ?? filteredRoles[0] ?? null;

  const selectedRolePermissionGroups = useMemo(
    () =>
      selectedRole
        ? groupPermissions(selectedRole.permissions, permissionDescriptions)
        : [],
    [permissionDescriptions, selectedRole],
  );

  const createPermissionGroups = useMemo(() => {
    const q = createPermissionSearch.trim().toLowerCase();
    const visibleCodes = permissions
      .filter((permission) =>
        !q
          ? true
          : [permission.code, permissionLabelVi(permission.code), permission.description ?? ""].some(
              (value) => value.toLowerCase().includes(q),
            ),
      )
      .map((permission) => permission.code);
    return groupPermissions(visibleCodes, permissionDescriptions);
  }, [createPermissionSearch, permissionDescriptions, permissions]);

  if (!session) {
    return null;
  }

  if (!canReadRbac) {
    return (
      <div className={ADMIN_PAGE_FORM_COLUMN_CLASS}>
        <h1 className={ADMIN_PAGE_TITLE_FORM_CLASS}>
          <Shield className={ADMIN_PAGE_TITLE_ICON_SM_CLASS} aria-hidden />
          Phân quyền
        </h1>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <CardTitle className="text-base">Không có quyền truy cập</CardTitle>
              <CardDescription className="mt-1">
                Cần quyền <span className="font-mono text-xs">rbac.read</span>.
                Liên hệ quản trị để được gán vai trò phù hợp.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setForm({
      name: "",
      displayName: "",
      description: "",
      isActive: true,
      permissions: [],
    });
    setCreatePermissionSearch("");
    setCreateOpen(true);
  };

  const handleTogglePermission = (code: string, checked: boolean) => {
    setForm((current) => ({
      ...current,
      permissions: checked
        ? [...new Set([...current.permissions, code])]
        : current.permissions.filter((item) => item !== code),
    }));
  };

  const handleCreateRole = async () => {
    const name = roleCodeify(form.name || form.displayName);
    const displayName = form.displayName.trim();

    if (!name) {
      toast.error("Vui lòng nhập mã vai trò hợp lệ");
      return;
    }
    if (!displayName) {
      toast.error("Vui lòng nhập tên hiển thị");
      return;
    }
    if (form.permissions.length === 0) {
      toast.error("Chọn ít nhất một quyền cho role mới");
      return;
    }

    try {
      const created = await createRole.mutateAsync({
        ...form,
        name,
        displayName,
        description: form.description.trim(),
      });
      toast.success(
        `Đã tạo role ${created.displayName ?? displayName}`,
      );
      setCreateOpen(false);
      setSelectedRoleCode(created.name ?? name);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không tạo được role mới",
      );
    }
  };

  return (
    <PageSection max="full" className="mx-auto min-w-0 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            <Shield className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
            Phân quyền
          </h1>
          <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
            Quản trị vai trò và ma trận quyền của hệ thống. Chọn một role để xem
            quyền hiệu lực, sau đó đối chiếu nhanh với toàn bộ permission runtime.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-lg px-4"
            onClick={() => void rbacQuery.refetch()}
          >
            <RefreshCw className={rbacQuery.isFetching ? "size-4 animate-spin" : "size-4"} />
            Làm mới
          </Button>
          {canCreateRole ? (
            <Button
              type="button"
              className="h-11 rounded-lg px-5 font-semibold"
              onClick={handleOpenCreate}
            >
              <Plus className="size-4" />
              Tạo role mới
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Shield}
          label="Tổng số vai trò"
          value={String(roles.length)}
          hint="Số role đang có trong hệ thống"
        />
        <StatCard
          icon={Sparkles}
          label="Permission runtime"
          value={String(permissions.length)}
          hint="Số quyền đang được cấu hình từ dữ liệu runtime"
        />
        <StatCard
          icon={Users}
          label="Role đang chọn"
          value={selectedRole ? String(selectedRole.permissions.length) : "0"}
          hint={
            selectedRole
              ? `${selectedRole.name} có ${selectedRole.permissions.length} quyền`
              : "Chưa có role nào được chọn"
          }
        />
      </div>

      {rbacQuery.isLoading ? (
        <Card className="border-border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
            <span className="flex items-center gap-2 font-medium">
              <Shield className="size-4 opacity-60" aria-hidden />
              Đang tải dữ liệu phân quyền…
            </span>
          </CardContent>
        </Card>
      ) : rbacQuery.isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-10 text-center">
            <AlertCircle className="mx-auto mb-2 size-9 text-destructive" aria-hidden />
            <p className="text-sm font-semibold text-destructive">
              {rbacQuery.error instanceof Error ? rbacQuery.error.message : "Lỗi tải dữ liệu"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="space-y-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="size-5 text-primary" />
                    Danh sách role
                  </CardTitle>
                  <CardDescription>
                    Chọn nhanh một role để xem mô tả và tập quyền đang có.
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    placeholder="Tìm theo tên, mã role..."
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[420px] rounded-lg">
                  <div className="space-y-2 pr-3">
                    {filteredRoles.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                        Không có role nào khớp bộ lọc hiện tại.
                      </div>
                    ) : (
                      filteredRoles.map((role) => {
                        const active = role.code === selectedRole?.code;
                        return (
                          <button
                            key={role.code}
                            type="button"
                            onClick={() => setSelectedRoleCode(role.code)}
                            className={
                              active
                                ? "w-full rounded-lg border border-primary/30 bg-primary/8 p-4 text-left shadow-sm transition-all"
                                : "w-full rounded-lg border border-border/60 bg-background/60 p-4 text-left transition-all hover:border-primary/20 hover:bg-primary/5"
                            }
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {role.name}
                                </p>
                                <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                                  {role.code}
                                </p>
                              </div>
                              <Badge variant={active ? "default" : "secondary"} className="shrink-0 text-[10px]">
                                {role.permissions.length} quyền
                              </Badge>
                            </div>
                            {role.description ? (
                              <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                {role.description}
                              </p>
                            ) : (
                              <p className="mt-3 text-xs text-muted-foreground">
                                Chưa có mô tả cho role này.
                              </p>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="size-5 text-primary" />
                      {selectedRole ? selectedRole.name : "Chi tiết role"}
                    </CardTitle>
                    <CardDescription>
                      {selectedRole
                        ? "Tổng hợp mô tả và danh sách quyền hiệu lực của role đang chọn."
                        : "Chọn một role ở danh sách bên trái để xem chi tiết."}
                    </CardDescription>
                  </div>
                  {selectedRole ? (
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="rounded-lg px-3 py-1 text-[11px] font-mono">
                        {selectedRole.code}
                      </Badge>
                      <Badge className="rounded-lg px-3 py-1 text-[11px]">
                        {selectedRole.permissions.length} quyền
                      </Badge>
                    </div>
                  ) : null}
                </div>
                {selectedRole ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-muted/15 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Mô tả role
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground">
                        {selectedRole.description?.trim() || "Chưa có mô tả. Nên bổ sung để đội vận hành hiểu rõ vai trò này dùng trong tình huống nào."}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/15 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Gợi ý sử dụng
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground">
                        Dùng trang này để đối chiếu nhanh role với permission. Việc gán role
                        cho từng tài khoản được thực hiện ở trang `Nhân sự`.
                      </p>
                    </div>
                  </div>
                ) : null}
              </CardHeader>
              <CardContent>
                {!selectedRole ? (
                  <div className="rounded-lg border border-dashed border-border/70 bg-muted/15 p-8 text-center text-sm text-muted-foreground">
                    Chưa có role nào để hiển thị.
                  </div>
                ) : (
                  <ScrollArea className="h-[420px] rounded-lg border border-border/60 bg-muted/10">
                    <div className="space-y-5 p-4 pr-6">
                      {selectedRolePermissionGroups.map((group) => (
                        <div key={group.resource} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">
                              {group.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {group.codes.length} quyền
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {group.codes.map((permission) => (
                              <div
                                key={permission.code}
                                className="rounded-lg border border-border/60 bg-background/85 px-3 py-2"
                                title={permission.description ?? permission.code}
                              >
                                <p className="text-xs font-medium text-foreground">
                                  {permission.label}
                                </p>
                                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                                  {permission.code}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="size-5 text-primary" />
                    Ma trận vai trò → quyền
                  </CardTitle>
                  <CardDescription>
                    Đối chiếu nhanh role nào đang có permission nào. Có thể lọc theo mã hoặc nhãn quyền.
                  </CardDescription>
                </div>
                <div className="relative w-full max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={permissionSearch}
                    onChange={(e) => setPermissionSearch(e.target.value)}
                    placeholder="Lọc permission trong bảng..."
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full rounded-lg border border-border/60">
                <div className="min-w-max">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="sticky left-0 z-[2] min-w-[220px] bg-muted/90 font-semibold backdrop-blur">
                          <span className="flex items-center gap-2">
                            <Shield className="size-4 shrink-0 text-primary" aria-hidden />
                            Vai trò
                          </span>
                        </TableHead>
                        {filteredPermissions.map((permission) => (
                          <TableHead
                            key={permission.code}
                            className="min-w-[140px] max-w-[160px] px-2 text-center align-bottom"
                            title={permission.description ?? permission.code}
                          >
                            <span className="block text-xs font-medium leading-snug">
                              {permissionLabelVi(permission.code)}
                            </span>
                            <span className="mt-1 block truncate font-mono text-[10px] leading-tight text-muted-foreground">
                              {permission.code}
                            </span>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRoles.map((role) => (
                        <TableRow
                          key={role.code}
                          className={role.code === selectedRole?.code ? "bg-primary/5" : undefined}
                        >
                          <TableCell className="sticky left-0 z-[1] bg-background font-medium">
                            <button
                              type="button"
                              onClick={() => setSelectedRoleCode(role.code)}
                              className="flex w-full items-start gap-2 text-left"
                            >
                              <UserCircle
                                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                                aria-hidden
                              />
                              <div>
                                <div>{role.name}</div>
                                <div className="text-[10px] font-mono text-muted-foreground">
                                  {role.code}
                                </div>
                              </div>
                            </button>
                          </TableCell>
                          {filteredPermissions.map((permission) => {
                            const on = roleHasPermission(role, permission.code);
                            return (
                              <TableCell key={permission.code} className="p-1 text-center">
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
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className={ADMIN_DIALOG_CONTENT_LG_CLASS}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold">Tạo role mới</DialogTitle>
            <DialogDescription>
              Tạo role và chọn các permission runtime đang có trong hệ thống để gán ngay từ đầu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role-name">Mã vai trò</Label>
                <Input
                  id="role-name"
                  value={form.name}
                  placeholder="vd: content_editor"
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      name: roleCodeify(e.target.value),
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Dùng trong kỹ thuật và mapping với tài khoản.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-display-name">Tên hiển thị</Label>
                <Input
                  id="role-display-name"
                  value={form.displayName}
                  placeholder="Biên tập nội dung"
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      displayName: e.target.value,
                      name: current.name || roleCodeify(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-description">Mô tả</Label>
              <Textarea
                id="role-description"
                value={form.description}
                placeholder="Mô tả rõ role này dùng cho bộ phận nào, được phép thao tác gì..."
                onChange={(e) =>
                  setForm((current) => ({ ...current, description: e.target.value }))
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Kích hoạt ngay</p>
                <p className="text-xs text-muted-foreground">
                  Nếu tắt, role được tạo nhưng ở trạng thái không hoạt động.
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, isActive: checked }))
                }
              />
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Label className="text-sm font-semibold">Permission</Label>
                  <p className="text-xs text-muted-foreground">
                    Đã chọn {form.permissions.length} / {permissions.length} quyền
                  </p>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={createPermissionSearch}
                    onChange={(e) => setCreatePermissionSearch(e.target.value)}
                    placeholder="Tìm permission..."
                    className="pl-9"
                  />
                </div>
              </div>

              <ScrollArea className="h-[320px] rounded-lg border border-border/60 bg-muted/10">
                <div className="space-y-5 p-4 pr-6">
                  {createPermissionGroups.map((group) => (
                    <div key={group.resource} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="rounded-lg px-2.5 py-1 text-[10px] uppercase tracking-wide">
                          {group.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {group.codes.length} quyền
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {group.codes.map((permission) => (
                          <label
                            key={permission.code}
                            className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/80 p-3 transition-colors hover:border-primary/20 hover:bg-primary/5"
                          >
                            <Checkbox
                              checked={form.permissions.includes(permission.code)}
                              onCheckedChange={(checked) =>
                                handleTogglePermission(permission.code, checked === true)
                              }
                              className="mt-0.5"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-foreground">
                                {permission.label}
                              </span>
                              <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
                                {permission.code}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="mr-auto rounded-lg"
              onClick={() => setCreateOpen(false)}
              disabled={createRole.isPending}
            >
              Hủy
            </Button>
            <Button
              type="button"
              className="rounded-lg font-bold"
              onClick={() => void handleCreateRole()}
              disabled={createRole.isPending}
            >
              {createRole.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Tạo role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageSection>
  );
}
