"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { PageSection } from "@ui/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import {
  AlertCircle,
  ArchiveRestore,
  Hash,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminTablePaginationFooter } from "@/components/admin-table-pagination-footer";
import { AdminConfirmActionDialog } from "@/components/admin-confirm-action-dialog";
import { api } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuth } from "@/providers/auth-provider";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
import {
  ADMIN_ALERT_DIALOG_CONTENT_CLASS,
  ADMIN_DIALOG_CONTENT_CATEGORY_CLASS,
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";

type TagRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type TagTreeRow = TagRow & {
  isGroup?: boolean;
  itemCount?: number;
  subRows?: TagTreeRow[];
};

type PagedResult<T> = { items: T[]; total: number };
type ApiEnvelope<T> = { success?: boolean; message?: string; error?: string | null; data?: T };
type TagsApiShape = { data: TagRow[]; pagination?: { total?: number } };

type FormState = {
  id?: string;
  name: string;
  slug: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (!payload || typeof payload !== "object") return payload as T;
  const envelope = payload as ApiEnvelope<T>;
  if (envelope.success === false) {
    throw new Error(envelope.message || envelope.error || "Yeu cau that bai");
  }
  return "data" in envelope ? (envelope.data as T) : (payload as T);
}

function normalizePaged(payload: unknown): PagedResult<TagRow> {
  const data = unwrapEnvelope<TagsApiShape | TagRow[]>(payload);
  if (Array.isArray(data)) return { items: data, total: data.length };
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

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .join(" ");
}

function sortTagsByName<T extends Pick<TagRow, "name">>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

function chooseTagGroupSlug(
  row: TagRow,
  prefixCounts: Map<string, number>,
): string | null {
  const segments = row.slug.split("-").filter(Boolean);
  const maxPrefixLength = Math.min(3, segments.length - 1);

  for (let length = maxPrefixLength; length >= 2; length -= 1) {
    const prefix = segments.slice(0, length).join("-");
    if ((prefixCounts.get(prefix) ?? 0) >= 2) {
      return prefix;
    }
  }

  if (segments.length > 1) {
    const rootPrefix = segments[0] ?? "";
    if ((prefixCounts.get(rootPrefix) ?? 0) >= 3) {
      return rootPrefix;
    }
  }

  return null;
}

function buildTagTree(rows: TagRow[]): TagTreeRow[] {
  const prefixCounts = new Map<string, number>();

  for (const row of rows) {
    const segments = row.slug.split("-").filter(Boolean);
    const maxPrefixLength = Math.min(3, segments.length - 1);
    for (let length = 1; length <= maxPrefixLength; length += 1) {
      const prefix = segments.slice(0, length).join("-");
      prefixCounts.set(prefix, (prefixCounts.get(prefix) ?? 0) + 1);
    }
  }

  const grouped = new Map<string, TagRow[]>();
  const standalone: TagTreeRow[] = [];

  for (const row of rows) {
    const groupSlug = chooseTagGroupSlug(row, prefixCounts);
    if (!groupSlug) {
      standalone.push({ ...row });
      continue;
    }
    const bucket = grouped.get(groupSlug) ?? [];
    bucket.push(row);
    grouped.set(groupSlug, bucket);
  }

  const groupRows = Array.from(grouped.entries())
    .sort(([a], [b]) => humanizeSlug(a).localeCompare(humanizeSlug(b), "vi"))
    .map(([groupSlug, groupItems]) => ({
      id: `group:${groupSlug}`,
      name: humanizeSlug(groupSlug),
      slug: groupSlug,
      createdAt: "",
      updatedAt: "",
      deletedAt: null,
      isGroup: true,
      itemCount: groupItems.length,
      subRows: sortTagsByName(groupItems).map((item) => ({ ...item })),
    }));

  return [...groupRows, ...sortTagsByName(standalone)];
}

async function fetchAllActiveTags(): Promise<TagRow[]> {
  const limit = 100;
  const items: TagRow[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (items.length < total) {
    const result = normalizePaged(
      await api.http.get("/admin/tags", {
        query: {
          page,
          limit,
          status: "active",
        },
      }),
    );
    items.push(...result.items);
    total = result.total;
    if (result.items.length === 0) break;
    page += 1;
  }

  return items;
}

export default function TagsPage() {
  const queryClient = useQueryClient();
  const { user: session } = useAuth();
  const canRead =
    session != null &&
    (canUserAccess(session, PERMISSION_CODES.TAGS_VIEW) ||
      canUserAccess(session, PERMISSION_CODES.TAGS_MANAGE));
  const canWrite =
    session != null &&
    (canUserAccess(session, PERMISSION_CODES.TAGS_UPDATE) ||
      canUserAccess(session, PERMISSION_CODES.TAGS_CREATE) ||
      canUserAccess(session, PERMISSION_CODES.TAGS_MANAGE));
  const canDelete =
    session != null &&
    (canUserAccess(session, PERMISSION_CODES.TAGS_DELETE) ||
      canUserAccess(session, PERMISSION_CODES.TAGS_MANAGE));
  const [mainTab, setMainTab] = useState<"list" | "trash">("list");
  const [globalFilter, setGlobalFilter] = useState("");
  const [trashPage, setTrashPage] = useState(1);
  const [trashPageSize, setTrashPageSize] = useState(15);
  const [trashGlobalFilter, setTrashGlobalFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<TagRow | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<TagRow | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<TagRow | null>(null);
  const [listTagSelection, setListTagSelection] = useState<RowSelectionState>({});
  const [trashTagSelection, setTrashTagSelection] = useState<RowSelectionState>({});
  const debouncedTrashQ = useDebouncedValue(trashGlobalFilter, 350);

  const listQuery = useQuery({
    queryKey: ["media", "tags", "tree"],
    queryFn: fetchAllActiveTags,
    enabled: canRead,
  });

  const trashQuery = useQuery({
    queryKey: ["media", "tags", "trash", trashPage, trashPageSize, debouncedTrashQ],
    enabled: canRead && mainTab === "trash",
    queryFn: async (): Promise<PagedResult<TagRow>> =>
      normalizePaged(
        await api.http.get("/admin/tags", {
          query: {
            page: trashPage,
            limit: trashPageSize,
            search: debouncedTrashQ.trim() || undefined,
            status: "deleted",
          },
        }),
      ),
  });

  const reload = useCallback(async () => {
    await Promise.all([listQuery.refetch(), trashQuery.refetch()]);
  }, [listQuery, trashQuery]);

  const invalidateAll = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["media", "tags"] });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: async (input: Omit<FormState, "id">) =>
      unwrapEnvelope<TagRow>(await api.http.post("/admin/tags", input)),
    onSuccess: invalidateAll,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Omit<FormState, "id"> }) =>
      unwrapEnvelope<TagRow>(await api.http.put(`/admin/tags/${id}`, input)),
    onSuccess: invalidateAll,
  });

  const deleteMutation = useMutation({
    /** Cùng luồng bulk soft-delete, tránh edge case routing DELETE. */
    mutationFn: async (id: string) =>
      api.http.post("/admin/tags/bulk", {
        action: "delete",
        ids: [String(id).trim()],
      }),
    onSuccess: invalidateAll,
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) =>
      unwrapEnvelope<TagRow>(await api.http.post(`/admin/tags/${id}/restore`)),
    onSuccess: invalidateAll,
  });

  const purgeMutation = useMutation({
    mutationFn: async (id: string) => api.http.delete(`/admin/tags/${id}/hard-delete`),
    onSuccess: invalidateAll,
  });

  const bulkMutation = useMutation({
    mutationFn: async (input: {
      action: "delete" | "restore" | "hard-delete";
      ids: string[];
    }) => api.http.post("/admin/tags/bulk", input),
    onSuccess: invalidateAll,
  });

  useEffect(() => {
    setTrashPage(1);
  }, [debouncedTrashQ, trashPageSize]);

  useEffect(() => {
    setListTagSelection({});
    setTrashTagSelection({});
  }, [mainTab]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (row: TagRow) => {
    setForm({
      id: row.id,
      name: row.name,
      slug: row.slug,
    });
    setDialogOpen(true);
  };

  const submitting = createMutation.isPending || updateMutation.isPending;

  const handleDelete = useCallback(async (row: TagRow) => {
    await toast.promise(deleteMutation.mutateAsync(row.id), {
      loading: `Đang xóa tạm «${row.name}»...`,
      success: `Đã đưa «${row.name}» vào thùng rác`,
      error: (error: unknown) =>
        error instanceof Error ? error.message : "Không xóa được thẻ",
    });
  }, [deleteMutation]);

  const handleRestore = useCallback(async (row: TagRow) => {
    await toast.promise(restoreMutation.mutateAsync(row.id), {
      loading: `Đang khôi phục «${row.name}»...`,
      success: `Đã khôi phục «${row.name}»`,
      error: (error: unknown) =>
        error instanceof Error ? error.message : "Không khôi phục được thẻ",
    });
  }, [restoreMutation]);

  const handlePurge = useCallback(async (row: TagRow) => {
    await toast.promise(purgeMutation.mutateAsync(row.id), {
      loading: `Đang xóa vĩnh viễn «${row.name}»...`,
      success: `Đã xóa vĩnh viễn «${row.name}»`,
      error: (error: unknown) =>
        error instanceof Error ? error.message : "Không xóa hẳn được thẻ",
    });
  }, [purgeMutation]);

  const handleSave = async () => {
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
    };
    if (!payload.name) {
      toast.error("Vui lòng nhập tên thẻ");
      return;
    }
    try {
      if (form.id) {
        await updateMutation.mutateAsync({ id: form.id, input: payload });
        toast.success(`Đã cập nhật thẻ "${payload.name}"`);
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(`Đã tạo thẻ "${payload.name}"`);
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được thẻ");
    }
  };

  const treeRows = useMemo<TagTreeRow[]>(
    () => buildTagTree(listQuery.data ?? []),
    [listQuery.data],
  );

  const columns = useMemo<ColumnDef<TagTreeRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Tên / nhóm",
        cell: ({ row, getValue }) =>
          row.original.isGroup ? (
            <div className="flex items-center gap-2">
              <span className="font-medium capitalize">{String(getValue())}</span>
              <Badge variant="outline" className="text-[10px]">
                {row.original.itemCount} thẻ
              </Badge>
            </div>
          ) : (
            <span className="font-medium">{String(getValue())}</span>
          ),
      },
      {
        accessorKey: "slug",
        header: "Slug",
        cell: ({ row, getValue }) => (
          <span className="font-mono text-xs">
            {row.original.isGroup ? `nhom:${String(getValue())}` : String(getValue())}
          </span>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Cập nhật / quy mô",
        cell: ({ row, getValue }) =>
          row.original.isGroup ? (
            <span className="text-xs text-muted-foreground">
              Nhóm theo tiền tố slug
            </span>
          ) : (
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
        cell: ({ row }) =>
          row.original.isGroup ? null : (
            <div className="flex flex-wrap gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 rounded-lg"
                onClick={() => openEdit(row.original)}
                disabled={!canWrite}
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
                disabled={!canDelete}
              >
                <Trash2 className="size-3.5" />
                Xóa tạm
              </Button>
            </div>
          ),
      },
    ],
    [canDelete, canWrite],
  );

  const trashColumns = useMemo<ColumnDef<TagRow>[]>(
    () => [
      { accessorKey: "name", header: "Tên" },
      {
        accessorKey: "deletedAt",
        header: "Xóa lúc",
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg"
              onClick={() => setRestoreTarget(row.original)}
              disabled={!canDelete}
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
              disabled={!canDelete}
            >
              <Trash2 className="size-3.5" />
              Xóa hẳn
            </Button>
          </div>
        ),
      },
    ],
    [canDelete],
  );

  if (!canRead) {
    return (
      <PageSection max="full" className="min-w-0 space-y-6">
        <div className="rounded-lg border border-outline-variant bg-surface-container p-6">
          <h2 className="text-lg font-semibold">Không có quyền truy cập</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Bạn cần quyền <code>tags:view</code> hoặc <code>tags:manage</code> để xem trang này.
          </p>
        </div>
      </PageSection>
    );
  }

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            <Hash className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
            Thẻ
          </h1>
          <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
            Quản lý thẻ dùng chung để gắn cho bài viết và nội dung truyền thông
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex h-12 items-center gap-2 rounded-lg border-outline-variant px-4 font-semibold hover:bg-muted"
            onClick={() => void reload()}
          >
            <RefreshCw
              className={listQuery.isFetching || trashQuery.isFetching ? "size-5 animate-spin" : "size-5"}
            />
            Làm mới
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button
                  onClick={openCreate}
                  className="flex h-12 items-center gap-2 rounded-lg px-6 font-bold shadow-md"
                  disabled={!canWrite}
                />
              }
            >
              <Plus className="size-5" />
              Thêm thẻ
            </DialogTrigger>
            <DialogContent className={ADMIN_DIALOG_CONTENT_CATEGORY_CLASS}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-extrabold">
                  {form.id ? "Chỉnh sửa thẻ" : "Tạo thẻ mới"}
                </DialogTitle>
                <DialogDescription>
                  Slug được tự động sinh từ tên, phù hợp cho URL hoặc bộ lọc nội dung.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="tag-name">Tên thẻ</Label>
                  <Input
                    id="tag-name"
                    value={form.name}
                    placeholder="VD: Học bổng"
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((current) => ({
                        ...current,
                        name,
                        slug: current.id ? current.slug : slugify(name),
                      }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tag-slug">Slug</Label>
                  <Input
                    id="tag-slug"
                    value={form.slug}
                    placeholder="hoc-bong"
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        slug: slugify(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="mr-auto rounded-lg"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  className="rounded-lg font-bold"
                  onClick={() => void handleSave()}
                  disabled={!canWrite || submitting}
                >
                  {submitting ? "Đang lưu..." : "Lưu"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={(v) => v === "list" || v === "trash" ? setMainTab(v) : null}>
        <TabsList className="h-auto min-h-9 flex-wrap gap-1 rounded-lg p-1">
          <TabsTrigger value="list" className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Danh sách
          </TabsTrigger>
          <TabsTrigger value="trash" className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Thùng rác
            {(trashQuery.data?.total ?? 0) > 0 ? (
              <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-[10px] tabular-nums">
                {trashQuery.data?.total}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4 space-y-4">
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Bảng tree của thẻ đang nhóm theo tiền tố slug gần nhất để dễ duyệt nội dung.
              API hiện chưa có quan hệ cha-con thật cho `tag`, nên các nhóm này chỉ là lớp hiển thị.
            </p>
          </div>
          {listQuery.error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="font-semibold">Không tải được danh sách thẻ</p>
                  <p className="mt-1 text-sm opacity-90">{listQuery.error.message}</p>
                </div>
              </div>
            </div>
          ) : null}

          <AdminDataTable<TagTreeRow>
            data={treeRows}
            getRowId={(row) => row.id}
            columns={columns}
            isLoading={listQuery.isLoading}
            emptyLabel='Chưa có thẻ — bấm "Thêm thẻ".'
            getSubRows={(row) => row.subRows}
            defaultExpandedAll
            getGlobalFilterText={(row) => `${row.name} ${row.slug}`}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            globalFilterPlaceholder="Tìm theo tên nhóm, tên thẻ hoặc slug..."
            csvExport={{ fileName: "the-dang-hoat-dong.csv" }}
            rowSelectionEnabled={canDelete}
            selectedRowIds={listTagSelection}
            onSelectedRowIdsChange={setListTagSelection}
            canSelectRow={(row) => !row.original.isGroup}
            bulkActions={
              canDelete
                ? [
                    {
                      id: "bulk-tag-delete",
                      label: "Xóa tạm đã chọn",
                      variant: "outline",
                      className: "border-destructive/40 text-destructive",
                      onAction: async (rows) => {
                        const ids = rows.filter((r) => !r.isGroup).map((r) => r.id);
                        if (!ids.length) return;
                        await bulkMutation.mutateAsync({ action: "delete", ids });
                        toast.success(`Đã đưa ${ids.length} thẻ vào thùng rác`);
                      },
                    },
                  ]
                : []
            }
          />
        </TabsContent>

        <TabsContent value="trash" className="mt-4 space-y-4">
          <AdminDataTable<TagRow>
            data={trashQuery.data?.items ?? []}
            getRowId={(row) => row.id}
            columns={trashColumns}
            isLoading={trashQuery.isLoading}
            emptyLabel="Thùng rác trống."
            manualFiltering
            globalFilter={trashGlobalFilter}
            onGlobalFilterChange={setTrashGlobalFilter}
            globalFilterPlaceholder="Tìm trong thùng rác..."
            csvExport={{ fileName: "the-thung-rac.csv" }}
            rowSelectionEnabled={canDelete}
            selectedRowIds={trashTagSelection}
            onSelectedRowIdsChange={setTrashTagSelection}
            bulkActions={
              canDelete
                ? [
                    {
                      id: "bulk-tag-restore",
                      label: "Khôi phục đã chọn",
                      onAction: async (rows) => {
                        const ids = rows.map((r) => r.id);
                        if (!ids.length) return;
                        await bulkMutation.mutateAsync({ action: "restore", ids });
                        toast.success(`Đã khôi phục ${ids.length} thẻ`);
                      },
                    },
                    {
                      id: "bulk-tag-purge",
                      label: "Xóa vĩnh viễn đã chọn",
                      variant: "outline",
                      className: "border-destructive/40 text-destructive",
                      onAction: async (rows) => {
                        const ids = rows.map((r) => r.id);
                        if (!ids.length) return;
                        await bulkMutation.mutateAsync({ action: "hard-delete", ids });
                        toast.success(`Đã xóa vĩnh viễn ${ids.length} thẻ`);
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
                emptySummary="Không có thẻ trong thùng rác"
                itemLabel="thẻ"
              />
            }
          />
        </TabsContent>
      </Tabs>

      <AdminConfirmActionDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        icon={<Trash2 className="size-5 shrink-0 text-destructive" />}
        title="Đưa thẻ vào thùng rác?"
        description={
          deleteTarget ? (
            <>
              Thẻ <strong className="text-foreground">{deleteTarget.name}</strong> (slug{" "}
              <span className="font-mono">{deleteTarget.slug}</span>) sẽ được ẩn khỏi danh sách
              đang dùng.
            </>
          ) : null
        }
        confirmLabel="Xóa tạm"
        confirmDestructive
        onConfirm={() => {
          if (!deleteTarget) return;
          void handleDelete(deleteTarget).finally(() => setDeleteTarget(null));
        }}
      />

      <AdminConfirmActionDialog
        open={restoreTarget != null}
        onOpenChange={(open) => {
          if (!open) setRestoreTarget(null);
        }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        icon={<ArchiveRestore className="size-5 shrink-0 text-primary" />}
        title="Khôi phục thẻ?"
        description={
          restoreTarget ? (
            <>
              Đưa thẻ <strong className="text-foreground">{restoreTarget.name}</strong> trở lại danh
              sách hoạt động.
            </>
          ) : null
        }
        confirmLabel="Khôi phục"
        onConfirm={() => {
          if (!restoreTarget) return;
          void handleRestore(restoreTarget).finally(() => setRestoreTarget(null));
        }}
      />

      <AdminConfirmActionDialog
        open={purgeTarget != null}
        onOpenChange={(open) => {
          if (!open) setPurgeTarget(null);
        }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        titleClassName="flex items-center gap-2 text-left text-destructive"
        icon={<Trash2 className="size-5 shrink-0" />}
        title="Xóa vĩnh viễn thẻ?"
        description={
          purgeTarget ? (
            <>
              Thẻ <strong className="text-foreground">{purgeTarget.name}</strong> sẽ bị xóa khỏi hệ
              thống và không thể hoàn tác.
            </>
          ) : null
        }
        confirmLabel="Xóa vĩnh viễn"
        confirmDestructive
        onConfirm={() => {
          if (!purgeTarget) return;
          void handlePurge(purgeTarget).finally(() => setPurgeTarget(null));
        }}
      />
    </PageSection>
  );
}
