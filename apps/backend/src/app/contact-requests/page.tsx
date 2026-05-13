"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  RowSelectionState,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  CheckCircle2,
  CircleDot,
  Eye,
  Headset,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  UserCircle,
  X,
} from "lucide-react";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
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
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { PageSection } from "@ui/components/layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { Switch } from "@ui/components/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@ui/components/tabs";
import { Textarea } from "@ui/components/textarea";
import {
  TypographyH1,
  TypographyPLargeMuted,
  TypographyPSmall,
  TypographyPSmallMuted,
} from "@ui/components/typography";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminTablePaginationFooter } from "@/components/admin-table-pagination-footer";
import { AdminConfirmActionDialog } from "@/components/admin-confirm-action-dialog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
import {
  ADMIN_ALERT_DIALOG_CONTENT_CLASS,
  ADMIN_DIALOG_CONTENT_LG_CLASS,
  ADMIN_PAGE_FORM_COLUMN_CLASS,
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_TITLE_ICON_SM_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";

type ContactStatus = "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type ContactPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type ContactRequestRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  content: string;
  status: ContactStatus;
  priority: ContactPriority;
  isRead: boolean;
  assignedToName: string | null;
  assignedToId: string | null;
  assignedTo: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type AssigneeOption = {
  id: string;
  name: string | null;
  email: string;
};

type PagedResult<T> = {
  items: T[];
  total: number;
};

type ContactRequestConfirmAction =
  | { kind: "delete"; row: ContactRequestRow }
  | { kind: "restore"; row: ContactRequestRow }
  | { kind: "purge"; row: ContactRequestRow };

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  error?: string | null;
  data?: T;
};

type ContactApiShape = {
  data: ContactRequestRow[];
  pagination?: { total?: number };
};

type UsersApiShape = {
  data: Array<{
    id: string | number;
    email?: string;
    name?: string | null;
    fullName?: string | null;
  }>;
  pagination?: { total?: number };
};

type ContactFormState = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  content: string;
  status: ContactStatus;
  priority: ContactPriority;
  isRead: boolean;
  assignedToId: string;
};

const UNASSIGNED_VALUE = "__unassigned__";

const EMPTY_FORM: ContactFormState = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  content: "",
  status: "NEW",
  priority: "MEDIUM",
  isRead: false,
  assignedToId: UNASSIGNED_VALUE,
};

const STATUS_OPTIONS: Array<{ value: ContactStatus; label: string }> = [
  { value: "NEW", label: "Mới" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "RESOLVED", label: "Đã xử lý" },
  { value: "CLOSED", label: "Đã đóng" },
];

const PRIORITY_OPTIONS: Array<{ value: ContactPriority; label: string }> = [
  { value: "LOW", label: "Thấp" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HIGH", label: "Cao" },
  { value: "URGENT", label: "Khẩn cấp" },
];

function unwrapEnvelope<T>(payload: unknown): T {
  if (!payload || typeof payload !== "object") return payload as T;
  const envelope = payload as ApiEnvelope<T>;
  if (envelope.success === false) {
    throw new Error(envelope.message || envelope.error || "Yeu cau that bai");
  }
  return "data" in envelope ? (envelope.data as T) : (payload as T);
}

function normalizePaged(payload: unknown): PagedResult<ContactRequestRow> {
  const data = unwrapEnvelope<ContactApiShape | ContactRequestRow[]>(payload);
  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }
  if (data && typeof data === "object" && Array.isArray(data.data)) {
    return {
      items: data.data,
      total:
        typeof data.pagination?.total === "number"
          ? data.pagination.total
          : data.data.length,
    };
  }
  return { items: [], total: 0 };
}

function normalizeAssignees(payload: unknown): AssigneeOption[] {
  const data = unwrapEnvelope<UsersApiShape | UsersApiShape["data"]>(payload);
  const rows =
    Array.isArray(data) ? data : data && typeof data === "object" ? data.data : [];
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => ({
      id: String(row.id),
      email: String(row.email ?? ""),
      name:
        typeof row.fullName === "string"
          ? row.fullName
          : typeof row.name === "string"
            ? row.name
            : null,
    }))
    .filter((row) => row.email.trim() !== "");
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}

function statusLabel(value: ContactStatus): string {
  return STATUS_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function priorityLabel(value: ContactPriority): string {
  return PRIORITY_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function statusBadgeClass(value: ContactStatus): string {
  switch (value) {
    case "NEW":
      return "border-sky-200 text-sky-700";
    case "IN_PROGRESS":
      return "border-amber-200 text-amber-700";
    case "RESOLVED":
      return "border-emerald-200 text-emerald-700";
    case "CLOSED":
      return "border-slate-200 text-slate-700";
  }
}

function priorityBadgeClass(value: ContactPriority): string {
  switch (value) {
    case "LOW":
      return "border-slate-200 text-slate-700";
    case "MEDIUM":
      return "border-sky-200 text-sky-700";
    case "HIGH":
      return "border-orange-200 text-orange-700";
    case "URGENT":
      return "border-destructive/30 text-destructive";
  }
}

function buildContactFilterQuery(columnFilters: ColumnFiltersState): Record<string, string> {
  const query: Record<string, string> = {};
  for (const filter of columnFilters) {
    const value = String(filter.value ?? "").trim();
    if (!value) continue;
    if (filter.id === "name") query.name = value;
    else if (filter.id === "phone") query.phone = value;
    else if (filter.id === "subject") query.subject = value;
    else if (filter.id === "status") query.status = value;
    else if (filter.id === "priority") query.priority = value;
    else if (filter.id === "isRead") query.isRead = value === "read" ? "true" : "false";
  }
  return query;
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Headset;
}) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardContent className="flex items-start gap-4 p-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ContactRequestsPage() {
  const queryClient = useQueryClient();
  const { user: session } = useAuth();
  const canRead =
    session != null &&
    (canUserAccess(session, PERMISSION_CODES.CONTACT_REQUESTS_VIEW) ||
      canUserAccess(session, PERMISSION_CODES.CONTACT_REQUESTS_MANAGE) ||
      canUserAccess(session, PERMISSION_CODES.CONTACT_REQUESTS_UPDATE));
  const canWrite =
    session != null &&
    (canUserAccess(session, PERMISSION_CODES.CONTACT_REQUESTS_UPDATE) ||
      canUserAccess(session, PERMISSION_CODES.CONTACT_REQUESTS_MANAGE));
  const canDelete =
    session != null &&
    (canUserAccess(session, PERMISSION_CODES.CONTACT_REQUESTS_DELETE) ||
      canUserAccess(session, PERMISSION_CODES.CONTACT_REQUESTS_MANAGE));
  const canRestore =
    session != null &&
    (canUserAccess(session, PERMISSION_CODES.CONTACT_REQUESTS_RESTORE) ||
      canUserAccess(session, PERMISSION_CODES.CONTACT_REQUESTS_MANAGE));
  const canAssign =
    session != null &&
    (canUserAccess(session, PERMISSION_CODES.CONTACT_REQUESTS_ASSIGN) ||
      canUserAccess(session, PERMISSION_CODES.CONTACT_REQUESTS_MANAGE));
  const canLoadAssignees =
    session != null && canUserAccess(session, PERMISSION_CODES.USERS_MANAGE);

  const [mainTab, setMainTab] = useState<"list" | "trash">("list");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [trashPage, setTrashPage] = useState(1);
  const [trashPageSize, setTrashPageSize] = useState(15);
  const [globalFilter, setGlobalFilter] = useState("");
  const [trashGlobalFilter, setTrashGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | ContactStatus
  >("all");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState<ContactFormState>(EMPTY_FORM);
  const [confirmAction, setConfirmAction] = useState<ContactRequestConfirmAction | null>(
    null,
  );
  const [listContactSelection, setListContactSelection] = useState<RowSelectionState>({});
  const [trashContactSelection, setTrashContactSelection] = useState<RowSelectionState>({});

  const debouncedGlobalFilter = useDebouncedValue(globalFilter, 300);
  const debouncedTrashGlobalFilter = useDebouncedValue(trashGlobalFilter, 300);

  useEffect(() => {
    setPage(1);
  }, [columnFilters, debouncedGlobalFilter, pageSize, statusFilter]);

  useEffect(() => {
    setTrashPage(1);
  }, [debouncedTrashGlobalFilter, trashPageSize]);

  useEffect(() => {
    setListContactSelection({});
    setTrashContactSelection({});
  }, [mainTab]);

  const listQuery = useQuery({
    queryKey: [
      "contact-requests",
      "list",
      page,
      pageSize,
      debouncedGlobalFilter,
      statusFilter,
      columnFilters,
    ],
    queryFn: async (): Promise<PagedResult<ContactRequestRow>> =>
      normalizePaged(
        await api.http.get("/admin/contact-requests", {
          query: {
            page,
            limit: pageSize,
            search: debouncedGlobalFilter.trim() || undefined,
            status: statusFilter === "all" ? "active" : statusFilter,
            ...Object.fromEntries(
              Object.entries(buildContactFilterQuery(columnFilters)).map(([key, value]) => [
                `filter[${key}]`,
                value,
              ]),
            ),
          },
        }),
      ),
    enabled: Boolean(session) && canRead && mainTab === "list",
  });

  const trashQuery = useQuery({
    queryKey: [
      "contact-requests",
      "trash",
      trashPage,
      trashPageSize,
      debouncedTrashGlobalFilter,
    ],
    queryFn: async (): Promise<PagedResult<ContactRequestRow>> =>
      normalizePaged(
        await api.http.get("/admin/contact-requests", {
          query: {
            page: trashPage,
            limit: trashPageSize,
            search: debouncedTrashGlobalFilter.trim() || undefined,
            status: "deleted",
          },
        }),
      ),
    enabled: Boolean(session) && canRead && mainTab === "trash",
  });

  const assigneesQuery = useQuery({
    queryKey: ["contact-requests", "assignees"],
    queryFn: async (): Promise<AssigneeOption[]> => {
      try {
        return normalizeAssignees(
          await api.http.get("/admin/users", {
            query: { page: 1, limit: 100 },
          }),
        );
      } catch {
        return [];
      }
    },
    enabled: Boolean(session) && canAssign && canLoadAssignees,
  });

  const invalidateLists = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["contact-requests", "list"] }),
      queryClient.invalidateQueries({ queryKey: ["contact-requests", "trash"] }),
    ]);
  }, [queryClient]);

  const updateMutation = useMutation({
    mutationFn: async (input: ContactFormState) =>
      unwrapEnvelope<ContactRequestRow>(
        await api.http.put(`/admin/contact-requests/${input.id}`, {
          name: input.name,
          email: input.email,
          phone: input.phone.trim() || null,
          subject: input.subject,
          content: input.content,
          status: input.status,
          priority: input.priority,
          isRead: input.isRead,
          assignedToId:
            input.assignedToId === UNASSIGNED_VALUE ? null : input.assignedToId,
        }),
      ),
    onSuccess: async () => {
      await invalidateLists();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.http.delete(`/admin/contact-requests/${id}`),
    onSuccess: async () => {
      await invalidateLists();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) =>
      unwrapEnvelope<ContactRequestRow>(
        await api.http.post(`/admin/contact-requests/${id}/restore`),
      ),
    onSuccess: async () => {
      await invalidateLists();
    },
  });

  const purgeMutation = useMutation({
    mutationFn: async (id: string) =>
      api.http.delete(`/admin/contact-requests/${id}/hard-delete`),
    onSuccess: async () => {
      await invalidateLists();
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async (input: {
      action: "delete" | "restore" | "hard-delete";
      ids: string[];
    }) => api.http.post("/admin/contact-requests/bulk", input),
    onSuccess: async () => {
      await invalidateLists();
    },
  });

  const listItems = useMemo(
    () => listQuery.data?.items ?? [],
    [listQuery.data?.items],
  );
  const listTotal = listQuery.data?.total ?? 0;
  const trashItems = useMemo(
    () => trashQuery.data?.items ?? [],
    [trashQuery.data?.items],
  );
  const trashTotal = trashQuery.data?.total ?? 0;
  const assigneeOptions = useMemo(
    () => assigneesQuery.data ?? [],
    [assigneesQuery.data],
  );

  const unreadCount = useMemo(
    () => listItems.filter((item) => !item.isRead).length,
    [listItems],
  );
  const urgentCount = useMemo(
    () => listItems.filter((item) => item.priority === "URGENT").length,
    [listItems],
  );
  const assignedCount = useMemo(
    () => listItems.filter((item) => item.assignedToId != null).length,
    [listItems],
  );

  const openDetail = useCallback((row: ContactRequestRow) => {
    setForm({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone ?? "",
      subject: row.subject,
      content: row.content,
      status: row.status,
      priority: row.priority,
      isRead: row.isRead,
      assignedToId: row.assignedToId ?? UNASSIGNED_VALUE,
    });
    setDetailOpen(true);
  }, []);

  const resetDialog = useCallback(() => {
    setForm(EMPTY_FORM);
    setDetailOpen(false);
  }, []);

  const handleSave = async (): Promise<void> => {
    if (!form.id) return;
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.content.trim()) {
      toast.error("Vui lòng nhập đủ họ tên, email, chủ đề và nội dung");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        content: form.content.trim(),
      });
      toast.success("Đã cập nhật liên hệ hỗ trợ");
      resetDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được liên hệ");
    }
  };

  const handleConfirmAction = useCallback(async (): Promise<void> => {
    if (!confirmAction) return;
    const { kind, row } = confirmAction;
    try {
      if (kind === "delete") {
        await deleteMutation.mutateAsync(row.id);
        toast.success(`Đã đưa "${row.subject}" vào thùng rác`);
      } else if (kind === "restore") {
        await restoreMutation.mutateAsync(row.id);
        toast.success(`Đã khôi phục "${row.subject}"`);
      } else {
        await purgeMutation.mutateAsync(row.id);
        toast.success(`Đã xóa vĩnh viễn "${row.subject}"`);
      }
      setConfirmAction(null);
    } catch (error) {
      const fallback =
        kind === "delete"
          ? "Không xóa được liên hệ"
          : kind === "restore"
            ? "Không khôi phục được liên hệ"
            : "Không xóa vĩnh viễn được liên hệ";
      toast.error(error instanceof Error ? error.message : fallback);
    }
  }, [confirmAction, deleteMutation, purgeMutation, restoreMutation]);

  const clearListFilters = useCallback(() => {
    setGlobalFilter("");
    setStatusFilter("all");
    setColumnFilters([]);
    setPage(1);
  }, []);

  const handleColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>(
    (updater) => {
      setColumnFilters((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      );
    },
    [],
  );

  const clearTrashFilters = useCallback(() => {
    setTrashGlobalFilter("");
    setTrashPage(1);
  }, []);

  const columns = useMemo<ColumnDef<ContactRequestRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Người gửi",
        meta: { filterPlaceholder: "Lọc theo tên…" },
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <UserCircle className="size-4 shrink-0 text-primary/80" />
              <span className="truncate font-medium">{row.original.name}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 min-w-0 text-xs text-muted-foreground">
              <Mail className="size-3.5 shrink-0" />
              <span className="truncate">{row.original.email}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: "Liên hệ",
        meta: { filterPlaceholder: "Lọc số điện thoại…" },
        cell: ({ row }) =>
          row.original.phone ? (
            <span className="flex items-center gap-2 font-mono text-xs">
              <Phone className="size-3.5 shrink-0 text-muted-foreground" />
              {row.original.phone}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "subject",
        header: "Chủ đề",
        meta: { filterPlaceholder: "Lọc chủ đề…" },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.subject}</p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {row.original.content}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => (
          <Badge variant="outline" className={statusBadgeClass(row.original.status)}>
            {statusLabel(row.original.status)}
          </Badge>
        ),
        meta: {
          filterVariant: "select",
          selectOptions: STATUS_OPTIONS.map((item) => ({
            value: item.value,
            label: item.label,
          })),
        },
      },
      {
        accessorKey: "priority",
        header: "Ưu tiên",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={priorityBadgeClass(row.original.priority)}
          >
            {priorityLabel(row.original.priority)}
          </Badge>
        ),
        meta: {
          filterVariant: "select",
          selectOptions: PRIORITY_OPTIONS.map((item) => ({
            value: item.value,
            label: item.label,
          })),
        },
      },
      {
        id: "assignedToName",
        accessorFn: (row) => row.assignedToName ?? "",
        header: "Phụ trách",
        enableColumnFilter: false,
        cell: ({ row }) =>
          row.original.assignedTo ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {row.original.assignedTo.name?.trim() || row.original.assignedTo.email}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {row.original.assignedTo.email}
              </p>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Chưa phân công</span>
          ),
      },
      {
        accessorKey: "createdAt",
        header: "Gửi lúc",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "isRead",
        accessorFn: (row) => (row.isRead ? "read" : "unread"),
        header: "Đọc",
        cell: ({ row }) =>
          row.original.isRead ? (
            <Badge variant="secondary" className="gap-1 rounded-lg">
              <CheckCircle2 className="size-3.5" />
              Đã đọc
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 rounded-lg text-primary">
              <CircleDot className="size-3.5" />
              Chưa đọc
            </Badge>
          ),
        meta: {
          filterVariant: "select",
          selectOptions: [
            { value: "read", label: "Đã đọc" },
            { value: "unread", label: "Chưa đọc" },
          ],
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        enableColumnFilter: false,
        meta: { disableColumnFilter: true },
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg"
              onClick={() => openDetail(row.original)}
            >
              <Eye className="size-3.5" />
              {canWrite ? "Xử lý" : "Xem"}
            </Button>
            {canDelete ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmAction({ kind: "delete", row: row.original })}
              >
                <Trash2 className="size-3.5" />
                Xóa tạm
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canDelete, canWrite, openDetail],
  );

  const trashColumns = useMemo<ColumnDef<ContactRequestRow>[]>(
    () => [
      {
        accessorKey: "subject",
        header: "Liên hệ",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.subject}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {row.original.name} · {row.original.email}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => (
          <Badge variant="outline" className={statusBadgeClass(row.original.status)}>
            {statusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        accessorKey: "deletedAt",
        header: "Xóa lúc",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDateTime(row.original.deletedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        enableColumnFilter: false,
        meta: { disableColumnFilter: true },
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-1">
            {canRestore ? (
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
            ) : null}
            {canDelete ? (
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
            ) : null}
          </div>
        ),
      },
    ],
    [canDelete, canRestore],
  );

  const listPaginationFooter = (
    <AdminTablePaginationFooter
      page={page}
      pageSize={pageSize}
      total={listTotal}
      isLoading={listQuery.isLoading}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      emptySummary="Không có liên hệ hỗ trợ"
      itemLabel="liên hệ"
    />
  );

  const trashPaginationFooter = (
    <AdminTablePaginationFooter
      page={trashPage}
      pageSize={trashPageSize}
      total={trashTotal}
      isLoading={trashQuery.isLoading}
      onPageChange={setTrashPage}
      onPageSizeChange={setTrashPageSize}
      emptySummary="Thùng rác trống"
      itemLabel="liên hệ"
    />
  );

  if (!session) {
    return null;
  }

  if (!canRead) {
    return (
      <div className={ADMIN_PAGE_FORM_COLUMN_CLASS}>
        <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
          <Headset className={ADMIN_PAGE_TITLE_ICON_SM_CLASS} aria-hidden />
          Liên hệ hỗ trợ
        </TypographyH1>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <CardTitle className="text-base">Không có quyền truy cập</CardTitle>
              <CardDescription className="mt-1">
                Cần quyền{" "}
                <span className="font-mono text-xs">
                  contact_requests:view
                </span>{" "}
                hoặc quyền quản lý tương đương.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <PageSection max="full" className="mx-auto min-w-0 space-y-6">
      <div>
        <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
          <Headset className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
          Liên hệ hỗ trợ
        </TypographyH1>
        <TypographyPLargeMuted className={ADMIN_PAGE_SUBTITLE_CLASS}>
          Quản lý các yêu cầu liên hệ hỗ trợ từ hệ thống, theo dõi trạng thái xử lý,
          mức độ ưu tiên và người phụ trách.
        </TypographyPLargeMuted>
      </div>

      <Tabs
        value={mainTab}
        onValueChange={(value) => {
          if (value === "list" || value === "trash") setMainTab(value);
        }}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="h-auto min-h-9 flex-wrap gap-1 rounded-lg p-1">
            <TabsTrigger value="list" className="gap-2 rounded-lg">
              <ShieldCheck className="size-4" />
              Đang xử lý
            </TabsTrigger>
            <TabsTrigger value="trash" className="gap-2 rounded-lg">
              <ArchiveRestore className="size-4" />
              Thùng rác
              {trashTotal > 0 ? (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {trashTotal}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 gap-2 rounded-lg"
              onClick={() =>
                void (mainTab === "list" ? listQuery.refetch() : trashQuery.refetch())
              }
            >
              <RefreshCw
                className={`size-4 ${
                  (mainTab === "list" ? listQuery.isFetching : trashQuery.isFetching)
                    ? "animate-spin"
                    : ""
                }`}
              />
              Làm mới
            </Button>
          </div>
        </div>

        <TabsContent value="list" className="mt-0 space-y-4">
          {listQuery.isError ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 py-12 text-center">
              <AlertCircle className="mx-auto mb-2 size-10 text-destructive" />
              <TypographyPSmall className="text-lg font-bold text-destructive">
                Không tải được danh sách liên hệ hỗ trợ
              </TypographyPSmall>
              <TypographyPLargeMuted className="mt-1 text-sm">
                {listQuery.error instanceof Error
                  ? listQuery.error.message
                  : "Lỗi không xác định"}
              </TypographyPLargeMuted>
            </div>
          ) : (
            <AdminDataTable<ContactRequestRow>
              data={listItems}
              getRowId={(row) => row.id}
              columns={columns}
              isLoading={listQuery.isLoading}
              emptyLabel="Không có liên hệ hỗ trợ khớp bộ lọc."
              manualFiltering
              columnFilters={columnFilters}
              onColumnFiltersChange={handleColumnFiltersChange}
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
              globalFilterPlaceholder="Tìm theo người gửi, email, SĐT, chủ đề..."
              rowSelectionEnabled={canDelete}
              selectedRowIds={listContactSelection}
              onSelectedRowIdsChange={setListContactSelection}
              bulkActions={
                canDelete
                  ? [
                      {
                        id: "bulk-contact-delete",
                        label: "Xóa tạm đã chọn",
                        variant: "outline",
                        className: "border-destructive/40 text-destructive",
                        onAction: async (rows) => {
                          const ids = rows.map((r) => r.id);
                          if (!ids.length) return;
                          await bulkMutation.mutateAsync({ action: "delete", ids });
                          toast.success(`Đã đưa ${ids.length} yêu cầu vào thùng rác`);
                        },
                      },
                    ]
                  : []
              }
              filterToolbarExtra={
                <div className="flex flex-wrap items-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 rounded-lg"
                    onClick={clearListFilters}
                  >
                    <X className="size-4" />
                    Xóa bộ lọc
                  </Button>
                </div>
              }
              csvExport={{ fileName: "lien-he-ho-tro.csv" }}
              footer={listPaginationFooter}
            />
          )}
        </TabsContent>

        <TabsContent value="trash" className="mt-0 space-y-4">
          {trashQuery.isError ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 py-12 text-center">
              <AlertCircle className="mx-auto mb-2 size-10 text-destructive" />
              <TypographyPSmall className="text-lg font-bold text-destructive">
                Không tải được thùng rác liên hệ hỗ trợ
              </TypographyPSmall>
              <TypographyPLargeMuted className="mt-1 text-sm">
                {trashQuery.error instanceof Error
                  ? trashQuery.error.message
                  : "Lỗi không xác định"}
              </TypographyPLargeMuted>
            </div>
          ) : (
            <AdminDataTable<ContactRequestRow>
              data={trashItems}
              getRowId={(row) => row.id}
              columns={trashColumns}
              isLoading={trashQuery.isLoading}
              emptyLabel="Thùng rác trống hoặc không khớp tìm kiếm."
              manualFiltering
              globalFilter={trashGlobalFilter}
              onGlobalFilterChange={setTrashGlobalFilter}
              globalFilterPlaceholder="Tìm trong thùng rác..."
              rowSelectionEnabled={canRestore || canDelete}
              selectedRowIds={trashContactSelection}
              onSelectedRowIdsChange={setTrashContactSelection}
              bulkActions={[
                ...(canRestore
                  ? [
                      {
                        id: "bulk-contact-restore",
                        label: "Khôi phục đã chọn",
                        onAction: async (rows: ContactRequestRow[]) => {
                          const ids = rows.map((r) => r.id);
                          if (!ids.length) return;
                          await bulkMutation.mutateAsync({ action: "restore", ids });
                          toast.success(`Đã khôi phục ${ids.length} yêu cầu`);
                        },
                      },
                    ]
                  : []),
                ...(canDelete
                  ? [
                      {
                        id: "bulk-contact-purge",
                        label: "Xóa vĩnh viễn đã chọn",
                        variant: "outline" as const,
                        className: "border-destructive/40 text-destructive",
                        onAction: async (rows: ContactRequestRow[]) => {
                          const ids = rows.map((r) => r.id);
                          if (!ids.length) return;
                          await bulkMutation.mutateAsync({ action: "hard-delete", ids });
                          toast.success(`Đã xóa vĩnh viễn ${ids.length} yêu cầu`);
                        },
                      },
                    ]
                  : []),
              ]}
              filterToolbarExtra={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 rounded-lg"
                  onClick={clearTrashFilters}
                >
                  <X className="size-4" />
                  Xóa bộ lọc
                </Button>
              }
              csvExport={{ fileName: "lien-he-ho-tro-thung-rac.csv" }}
              footer={trashPaginationFooter}
            />
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          if (!open) resetDialog();
        }}
      >
        <DialogContent className={ADMIN_DIALOG_CONTENT_LG_CLASS}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-extrabold">
              <Headset className="size-7 shrink-0 text-primary" />
              Chi tiết liên hệ hỗ trợ
            </DialogTitle>
            <DialogDescription>
              Rà soát thông tin người gửi và cập nhật quy trình xử lý theo bản ghi
              `contact_requests`.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cr-name">Người gửi</Label>
              <Input
                id="cr-name"
                value={form.name}
                disabled={!canWrite || updateMutation.isPending}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cr-email">Email</Label>
              <Input
                id="cr-email"
                type="email"
                value={form.email}
                disabled={!canWrite || updateMutation.isPending}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cr-phone">Số điện thoại</Label>
              <Input
                id="cr-phone"
                value={form.phone}
                disabled={!canWrite || updateMutation.isPending}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Người phụ trách</Label>
              {canAssign && canLoadAssignees ? (
                <Select
                  value={form.assignedToId}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      assignedToId: value ?? UNASSIGNED_VALUE,
                    }))
                  }
                  disabled={updateMutation.isPending || assigneesQuery.isLoading}
                >
                  <SelectTrigger className="w-full rounded-lg">
                    <SelectValue placeholder="Chọn người phụ trách" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED_VALUE}>Chưa phân công</SelectItem>
                    {assigneeOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name?.trim() || option.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={
                    assigneeOptions.find((option) => option.id === form.assignedToId)
                      ?.name ||
                    assigneeOptions.find((option) => option.id === form.assignedToId)
                      ?.email ||
                    (form.assignedToId === UNASSIGNED_VALUE ? "Chưa phân công" : "")
                  }
                  disabled
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    status: value as ContactStatus,
                  }))
                }
                disabled={!canWrite || updateMutation.isPending}
              >
                <SelectTrigger className="w-full rounded-lg">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ưu tiên</Label>
              <Select
                value={form.priority}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    priority: value as ContactPriority,
                  }))
                }
                disabled={!canWrite || updateMutation.isPending}
              >
                <SelectTrigger className="w-full rounded-lg">
                  <SelectValue placeholder="Chọn mức ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cr-subject">Chủ đề</Label>
              <Input
                id="cr-subject"
                value={form.subject}
                disabled={!canWrite || updateMutation.isPending}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    subject: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cr-content">Nội dung</Label>
              <Textarea
                id="cr-content"
                rows={7}
                value={form.content}
                disabled={!canWrite || updateMutation.isPending}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 md:col-span-2">
              <div className="min-w-0">
                <TypographyPSmall className="text-sm font-semibold">
                  Đánh dấu đã đọc
                </TypographyPSmall>
                <TypographyPSmallMuted>
                  Bật khi yêu cầu đã được tiếp nhận và mở xem.
                </TypographyPSmallMuted>
              </div>
              <Switch
                checked={form.isRead}
                disabled={!canWrite || updateMutation.isPending}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, isRead: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2 rounded-lg"
              onClick={resetDialog}
            >
              <X className="size-4" />
              Đóng
            </Button>
            {canWrite ? (
              <Button
                type="button"
                className="gap-2 rounded-lg font-bold"
                onClick={() => void handleSave()}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Lưu thay đổi
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminConfirmActionDialog
        open={confirmAction != null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        footerClassName="gap-2"
        icon={
          confirmAction?.kind === "delete" ? (
            <Archive className="size-5 shrink-0 text-destructive" />
          ) : confirmAction?.kind === "restore" ? (
            <ArchiveRestore className="size-5 shrink-0 text-primary" />
          ) : confirmAction?.kind === "purge" ? (
            <Trash2 className="size-5 shrink-0 text-destructive" />
          ) : null
        }
        title={
          confirmAction?.kind === "delete"
            ? "Đưa liên hệ vào thùng rác?"
            : confirmAction?.kind === "restore"
              ? "Khôi phục liên hệ?"
              : confirmAction?.kind === "purge"
                ? "Xóa vĩnh viễn liên hệ?"
                : ""
        }
        description={
          confirmAction?.kind === "delete"
            ? `"${confirmAction.row.subject}" sẽ bị xóa tạm. Có thể khôi phục từ tab Thùng rác.`
            : confirmAction?.kind === "restore"
              ? `Khôi phục "${confirmAction.row.subject}" về danh sách đang xử lý.`
              : confirmAction?.kind === "purge"
                ? `"${confirmAction.row.subject}" sẽ bị xóa khỏi cơ sở dữ liệu và không thể hoàn tác.`
                : null
        }
        confirmLabel={
          confirmAction?.kind === "delete"
            ? "Xóa tạm"
            : confirmAction?.kind === "restore"
              ? "Khôi phục"
              : confirmAction?.kind === "purge"
                ? "Xóa vĩnh viễn"
                : "Xác nhận"
        }
        confirmDestructive={
          confirmAction?.kind === "delete" || confirmAction?.kind === "purge"
        }
        confirmDisabled={
          deleteMutation.isPending || restoreMutation.isPending || purgeMutation.isPending
        }
        confirmLoading={
          confirmAction?.kind === "delete"
            ? deleteMutation.isPending
            : confirmAction?.kind === "restore"
              ? restoreMutation.isPending
              : confirmAction?.kind === "purge"
                ? purgeMutation.isPending
                : false
        }
        onConfirm={() => {
          void handleConfirmAction();
        }}
      />
    </PageSection>
  );
}
