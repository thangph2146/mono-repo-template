"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  RowSelectionState,
} from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Badge } from "@ui/components/badge";
import { Switch } from "@ui/components/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ui/components/dialog";
import { PageSection } from "@ui/components/layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import {
  Archive,
  ArchiveRestore,
  FilterX,
  Info,
  Loader2,
  Plus,
  Pencil,
  RefreshCw,
  Tags,
  Trash2,
  AlertCircle,
  Layers,
} from "lucide-react";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminTablePaginationFooter } from "@/components/admin-table-pagination-footer";
import { AdminConfirmActionDialog } from "@/components/admin-confirm-action-dialog";
import { type Category, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
import {
  useCategoriesAdmin,
  useCreateCategory,
  useDeleteCategory,
  usePurgeTrashedCategory,
  useRestoreCategory,
  useTrashedCategories,
  useUpdateCategory,
  queryKeys,
} from "@/hooks/queries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@/lib/api";
import {
  CATEGORY_ICON_OPTIONS,
  resolveCategoryIcon,
} from "@/lib/category-icons";
import { cn } from "@ui/lib/utils";
import {
  ADMIN_ALERT_DIALOG_CONTENT_CLASS,
  ADMIN_DIALOG_CONTENT_CATEGORY_CLASS,
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";

interface FormState {
  id?: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  parentId: string;
}

const ROOT_PARENT_VALUE = "__root__";
const CATEGORY_TREE_LIMIT = 1000;

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  description: "",
  icon: "Package2",
  sortOrder: 0,
  isActive: true,
  parentId: ROOT_PARENT_VALUE,
};

const slugify = (input: string): string =>
  input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type CategoryRow = Category & { subRows?: CategoryRow[] };

function sortCategoriesByName<T extends Pick<Category, "name">>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

function buildCategoryTree(rows: Category[]): CategoryRow[] {
  const byId = new Map<string, CategoryRow>();

  for (const row of rows) {
    byId.set(row.id, {
      ...row,
      subRows: [],
    });
  }

  const roots: CategoryRow[] = [];
  for (const row of byId.values()) {
    const parentId = row.parentId ?? null;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId)?.subRows?.push(row);
      continue;
    }
    roots.push(row);
  }

  const sortTree = (items: CategoryRow[]): CategoryRow[] =>
    sortCategoriesByName(items).map((item) => ({
      ...item,
      subRows: sortTree(item.subRows ?? []),
    }));

  return sortTree(roots);
}

function buildDescendantMap(rows: CategoryRow[]): Map<string, Set<string>> {
  const descendants = new Map<string, Set<string>>();

  const walk = (row: CategoryRow): Set<string> => {
    const ids = new Set<string>();
    for (const child of row.subRows ?? []) {
      ids.add(child.id);
      for (const nestedId of walk(child)) ids.add(nestedId);
    }
    descendants.set(row.id, ids);
    return ids;
  };

  for (const row of rows) walk(row);
  return descendants;
}

function flattenCategoryOptions(
  rows: CategoryRow[],
  depth = 0,
): Array<{ id: string; name: string; depth: number }> {
  const options: Array<{ id: string; name: string; depth: number }> = [];
  for (const row of rows) {
    options.push({ id: row.id, name: row.name, depth });
    options.push(...flattenCategoryOptions(row.subRows ?? [], depth + 1));
  }
  return options;
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canWriteCategories = user
    ? canUserAccess(user, PERMISSION_CODES.CATEGORIES_WRITE)
    : false;
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const restoreMutation = useRestoreCategory();
  const purgeTrashedMutation = usePurgeTrashedCategory();

  const bulkCategoriesMutation = useMutation({
    mutationFn: async (input: {
      action: "delete" | "restore" | "hard-delete";
      ids: string[];
    }) => api.http.post("/admin/categories/bulk", input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.categories() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.categoriesTrashed() }),
      ]);
    },
  });

  const [mainTab, setMainTab] = useState<"list" | "trash">("list");
  const [listCategorySelection, setListCategorySelection] = useState<RowSelectionState>({});
  const [trashCategorySelection, setTrashCategorySelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [trashPage, setTrashPage] = useState(1);
  const [trashPageSize, setTrashPageSize] = useState(15);
  const [trashGlobalFilter, setTrashGlobalFilter] = useState("");
  const debouncedTrashQ = useDebouncedValue(trashGlobalFilter, 350);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const listParams = useMemo(
    () => ({
      page: 1,
      limit: CATEGORY_TREE_LIMIT,
      activeOnly: true,
    }),
    [],
  );

  useEffect(() => {
    setTrashPage(1);
  }, [debouncedTrashQ, mainTab, trashPageSize]);

  useEffect(() => {
    setListCategorySelection({});
    setTrashCategorySelection({});
  }, [mainTab]);

  const {
    data,
    isLoading: loading,
    error,
    refetch,
    isFetching,
  } = useCategoriesAdmin({
    listParams,
  });
  const categories = useMemo(() => data?.items ?? [], [data?.items]);

  const trashListParams = useMemo(
    () => ({
      page: trashPage,
      limit: trashPageSize,
      q: debouncedTrashQ.trim() || undefined,
    }),
    [trashPage, trashPageSize, debouncedTrashQ],
  );

  const {
    data: trashedData,
    isLoading: trashedLoading,
    error: trashedError,
    refetch: refetchTrashedCategories,
    isFetching: trashedCategoriesFetching,
  } = useTrashedCategories({
    enabled: mainTab === "trash" && canWriteCategories,
    listParams: trashListParams,
  });
  const trashedItems = trashedData?.items ?? [];
  const trashTotal = trashedData?.total ?? 0;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Category | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<Category | null>(null);
  const submitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!canWriteCategories && mainTab === "trash") setMainTab("list");
  }, [canWriteCategories, mainTab]);

  const tableRows = useMemo<CategoryRow[]>(
    () => buildCategoryTree(categories),
    [categories],
  );
  const descendantMap = useMemo(
    () => buildDescendantMap(tableRows),
    [tableRows],
  );
  const parentOptions = useMemo(() => {
    const excludedIds = form.id
      ? new Set([form.id, ...(descendantMap.get(form.id) ?? [])])
      : new Set<string>();

    return flattenCategoryOptions(tableRows).filter(
      (option) => !excludedIds.has(option.id),
    );
  }, [descendantMap, form.id, tableRows]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = useCallback((c: Category) => {
    setForm({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      icon: c.icon ?? "Package2",
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      parentId: c.parentId ?? ROOT_PARENT_VALUE,
    });
    setDialogOpen(true);
  }, []);

  const handleSave = async (): Promise<void> => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim() || null,
      icon: form.icon || null,
      sortOrder: Number.isFinite(form.sortOrder) ? form.sortOrder : 0,
      isActive: form.isActive,
      parentId:
        form.parentId === ROOT_PARENT_VALUE ? null : form.parentId,
    };
    if (form.id) {
      const invalidParentIds = descendantMap.get(form.id) ?? new Set<string>();
      if (payload.parentId === form.id || invalidParentIds.has(payload.parentId ?? "")) {
        toast.error("Không thể chọn danh mục con làm danh mục cha");
        return;
      }
    }
    try {
      if (form.id) {
        await updateMutation.mutateAsync({ id: form.id, input: payload });
        toast.success(`Đã cập nhật danh mục "${payload.name}"`);
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(`Đã tạo danh mục "${payload.name}"`);
      }
      setDialogOpen(false);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Đã xảy ra lỗi, vui lòng thử lại";
      toast.error(message);
    }
  };

  const requestDelete = useCallback((c: Category): void => {
    const childCount = c._count?.children ?? 0;
    if (childCount > 0) {
      toast.error(
        `Không thể xoá: "${c.name}" vẫn còn ${childCount} danh mục con`,
      );
      return;
    }
    const linkedPosts = c.postCount ?? 0;
    if (linkedPosts > 0) {
      toast.error(
        `Không thể xoá: còn ${linkedPosts} bài viết đang gắn với cây danh mục này`,
      );
      return;
    }
    setDeleteTarget(c);
  }, []);

  const confirmDelete = (): void => {
    if (!deleteTarget) return;
    const c = deleteTarget;
    toast.promise(
      deleteMutation.mutateAsync(c.id).then(() => setDeleteTarget(null)),
      {
        loading: `Đang xóa tạm «${c.name}»...`,
        success: `Đã đưa «${c.name}» vào thùng rác`,
        error: (err: unknown) =>
          err instanceof ApiError ? err.message : "Không xóa được danh mục",
      },
    );
  };

  const confirmRestore = (): void => {
    if (!restoreTarget) return;
    const c = restoreTarget;
    toast.promise(
      restoreMutation.mutateAsync(c.id).then(() => setRestoreTarget(null)),
      {
        loading: `Đang khôi phục «${c.name}»...`,
        success: `Đã khôi phục «${c.name}»`,
        error: (err: unknown) =>
          err instanceof ApiError ? err.message : "Không khôi phục được",
      },
    );
  };

  const confirmPurgeTrashed = (): void => {
    if (!purgeTarget) return;
    const c = purgeTarget;
    toast.promise(
      purgeTrashedMutation.mutateAsync(c.id).then(() => setPurgeTarget(null)),
      {
        loading: `Đang xóa vĩnh viễn «${c.name}»...`,
        success: `Đã xóa vĩnh viễn «${c.name}»`,
        error: (err: unknown) =>
          err instanceof ApiError ? err.message : "Không xóa vĩnh viễn được",
      },
    );
  };

  const clearAllFilters = useCallback((): void => {
    setColumnFilters([]);
    setGlobalFilter("");
  }, []);

  const clearTrashFilters = useCallback((): void => {
    setTrashGlobalFilter("");
    setTrashPage(1);
  }, []);

  const handleColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>(
    (updater) => {
      setColumnFilters((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      );
    },
    [],
  );

  const columns: ColumnDef<CategoryRow>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Tên",
        cell: ({ row, getValue }) => (
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium">{String(getValue())}</span>
            {row.depth === 0 ? (
              <Badge variant="outline" className="text-[10px]">
                Gốc
              </Badge>
            ) : null}
          </div>
        ),
        meta: { filterPlaceholder: "Lọc tên" },
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
        id: "parentName",
        accessorFn: (row) => row.parentName ?? "Gốc",
        header: "Danh mục cha",
        cell: ({ row }) =>
          row.original.parentName ? (
            row.original.parentName
          ) : (
            <span className="text-muted-foreground">Gốc</span>
          ),
        meta: { filterPlaceholder: "Lọc danh mục cha" },
      },
      {
        accessorKey: "description",
        header: "Mô tả",
        cell: ({ getValue }) => (getValue() as string | null) || "—",
        meta: { filterPlaceholder: "Lọc mô tả" },
      },
      {
        id: "childrenCount",
        accessorFn: (row) => row._count?.children ?? 0,
        header: "Nhánh con",
        cell: ({ row }) => row.original._count?.children ?? 0,
        filterFn: (row, id, v) => {
          if (v == null || v === "") return true;
          return Number(row.getValue(id)) === Number(v);
        },
        meta: { filterVariant: "number", filterPlaceholder: "Nhánh con = …" },
      },
      {
        accessorKey: "postCount",
        header: "Bài viết",
        filterFn: (row, id, v) => {
          if (v == null || v === "") return true;
          return Number(row.getValue(id)) === Number(v);
        },
        meta: { filterVariant: "number", filterPlaceholder: "Bài viết = …" },
      },
      {
        id: "isActive",
        accessorFn: (r) => (r.isActive ? "true" : "false"),
        header: "Trạng thái",
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge className="text-xs">Đang dùng</Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              Ẩn
            </Badge>
          ),
        filterFn: (row, id, v) => {
          if (v == null || v === "") return true;
          return row.getValue(id) === v;
        },
        meta: {
          filterVariant: "select",
          selectOptions: [
            { value: "true", label: "Đang dùng" },
            { value: "false", label: "Ẩn" },
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
                <Pencil className="w-4 h-4 mr-1" /> Sửa
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => requestDelete(c)}
                disabled={childCount > 0 || linkedPosts > 0}
              >
                <Trash2 className="w-4 h-4" /> Xóa tạm
              </Button>
            </div>
          );
        },
      },
    ],
    [canWriteCategories, openEdit, requestDelete],
  );

  const trashColumns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: "slug",
        header: "Slug",
        enableColumnFilter: false,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "Tên",
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
              disabled={
                restoreMutation.isPending || purgeTrashedMutation.isPending
              }
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
              disabled={
                restoreMutation.isPending || purgeTrashedMutation.isPending
              }
            >
              <Trash2 className="size-3.5" />
              Xóa hẳn
            </Button>
          </div>
        ),
      },
    ],
    [restoreMutation.isPending, purgeTrashedMutation.isPending],
  );

  const trashPaginationFooter = (
    <AdminTablePaginationFooter
      page={trashPage}
      pageSize={trashPageSize}
      total={trashTotal}
      isLoading={trashedLoading}
      onPageChange={setTrashPage}
      onPageSizeChange={setTrashPageSize}
      emptySummary="Không có mục trong thùng rác"
      itemLabel="danh mục"
    />
  );

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            <Tags className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
            Danh mục dùng chung
          </h1>
          <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
            Quản lý taxonomy dùng chung để gắn cho bài viết, thẻ và các nội dung truyền thông
          </p>
          {user && !canWriteCategories && (
            <p className="mt-2 text-sm font-medium text-amber-800 dark:text-amber-200/90">
              Chỉ xem: cần quyền{" "}
              <span className="font-mono">categories.write</span> để thêm/sửa/xoá.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex h-12 items-center gap-2 rounded-lg border-outline-variant px-4 font-semibold hover:bg-muted"
            onClick={() => {
              void refetch();
              void refetchTrashedCategories();
            }}
          >
            <RefreshCw
              className={cn(
                "size-5",
                (isFetching || trashedCategoriesFetching) && "animate-spin",
              )}
              aria-hidden
            />
            Làm mới
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            {canWriteCategories && (
              <DialogTrigger
                render={
                  <Button
                    onClick={openCreate}
                    className="flex h-12 items-center gap-2 rounded-lg px-6 font-bold shadow-md"
                  />
                }
              >
                <Plus className="size-5" aria-hidden /> Thêm danh mục
              </DialogTrigger>
            )}
          <DialogContent className={ADMIN_DIALOG_CONTENT_CATEGORY_CLASS}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold">
                {form.id ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
              </DialogTitle>
              <DialogDescription>
                Slug được tự động sinh từ tên. Cập nhật slug sẽ tự đồng bộ lại
                tham chiếu trên các nội dung liên quan.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cat-name">Tên hiển thị</Label>
                  <Input
                    id="cat-name"
                    placeholder="VD: Tin tuyển sinh"
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((f) => ({
                        ...f,
                        name,
                        slug: f.id ? f.slug : slugify(name),
                      }));
                    }}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cat-slug">Slug</Label>
                  <Input
                    id="cat-slug"
                    placeholder="do-uong"
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        slug: slugify(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Biểu tượng</Label>
                  <Select
                    value={form.icon}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, icon: v ?? "Package2" }))
                    }
                  >
                    <SelectTrigger className="w-full rounded-lg">
                      <SelectValue placeholder="Chọn biểu tượng" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_ICON_OPTIONS.map((name) => {
                        const Icon = resolveCategoryIcon(name);
                        return (
                          <SelectItem key={name} value={name}>
                            <div className="flex items-center gap-2">
                              <Icon className="size-4" /> {name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-order">Thứ tự</Label>
                  <Input
                    id="cat-order"
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        sortOrder: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cat-desc">Mô tả</Label>
                  <Input
                    id="cat-desc"
                    placeholder="Mô tả ngắn gọn"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Danh mục cha</Label>
                  <Select
                    value={form.parentId}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        parentId: value || ROOT_PARENT_VALUE,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full rounded-lg">
                      <SelectValue placeholder="Chọn danh mục cha" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ROOT_PARENT_VALUE}>
                        Cấp gốc
                      </SelectItem>
                      {parentOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {`${".. ".repeat(option.depth)}${option.name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Danh mục con sẽ hiển thị lùi cấp trong bảng tree.
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-outline-variant px-4 py-3 sm:col-span-2">
                  <div>
                    <p className="text-sm font-semibold">Đang hoạt động</p>
                    <p className="text-xs text-muted-foreground">
                      Khi tắt, danh mục sẽ ẩn khỏi các bộ chọn nội dung nhưng vẫn giữ lại tham chiếu cũ.
                    </p>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, isActive: v }))
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="mr-auto rounded-lg"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                className="rounded-lg font-bold"
                onClick={() => void handleSave()}
                disabled={submitting}
              >
                {submitting ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Tabs
        value={mainTab}
        onValueChange={(v) => {
          if (v === "list" || v === "trash") setMainTab(v);
        }}
        className="space-y-6"
      >
        <TabsList className="h-auto min-h-9 flex-wrap gap-1 rounded-lg p-1">
          <TabsTrigger
            value="list"
            className="flex items-center gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Layers className="size-4" aria-hidden />
            Danh sách
          </TabsTrigger>
          {canWriteCategories ? (
            <TabsTrigger
              value="trash"
              className="flex items-center gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <ArchiveRestore className="size-4" aria-hidden />
              Thùng rác
              {trashedData != null && trashedData.total > 0 ? (
                <Badge
                  variant="secondary"
                  className="px-1.5 py-0 text-[10px] tabular-nums"
                >
                  {trashedData.total}
                </Badge>
              ) : null}
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="list" className="mt-0 space-y-4">
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 shadow-sm">
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span className="text-muted-foreground">
                Danh sách active tải toàn bộ cây để hiển thị đúng quan hệ cha-con.
                Có thể tìm nhanh hoặc lọc cột trực tiếp trên bảng tree.
                {canWriteCategories ? (
                  <>
                    {" "}
                    Chỉ cho xóa tạm khi danh mục không còn nhánh con và không còn
                    bài viết gắn vào cây đó.
                  </>
                ) : null}
              </span>
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">Không tải được danh mục</p>
                  <p className="mt-1 text-sm opacity-90">{error.message}</p>
                </div>
              </div>
            </div>
          )}

          {!error && (
            <AdminDataTable<CategoryRow>
              data={tableRows}
              getRowId={(row) => row.id}
              columns={columns}
              isLoading={loading}
              emptyLabel={
                canWriteCategories
                  ? 'Chưa có danh mục — bấm "Thêm danh mục".'
                  : "Chưa có dữ liệu hoặc không khớp bộ lọc."
              }
              getSubRows={(row) => row.subRows}
              defaultExpandedAll
              columnFilters={columnFilters}
              onColumnFiltersChange={handleColumnFiltersChange}
              getGlobalFilterText={(row) =>
                [
                  row.name,
                  row.slug,
                  row.description ?? "",
                  row.parentName ?? "",
                ].join(" ")
              }
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
              globalFilterPlaceholder="Tìm theo tên, slug, mô tả hoặc danh mục cha…"
              rowSelectionEnabled={canWriteCategories}
              selectedRowIds={listCategorySelection}
              onSelectedRowIdsChange={setListCategorySelection}
              canSelectRow={(row) => {
                const c = row.original;
                const childCount = c._count?.children ?? 0;
                const linkedPosts = c.postCount ?? 0;
                return !(childCount > 0 || linkedPosts > 0);
              }}
              bulkActions={
                canWriteCategories
                  ? [
                      {
                        id: "bulk-category-delete",
                        label: "Xóa tạm đã chọn",
                        variant: "outline",
                        className: "border-destructive/40 text-destructive",
                        onAction: async (rows) => {
                          const ids = rows.map((r) => r.id);
                          if (!ids.length) return;
                          await bulkCategoriesMutation.mutateAsync({
                            action: "delete",
                            ids,
                          });
                          toast.success(`Đã đưa ${ids.length} danh mục vào thùng rác`);
                        },
                      },
                    ]
                  : []
              }
              filterToolbarExtra={
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 rounded-lg"
                    onClick={() => void refetch()}
                  >
                    <RefreshCw
                      className={cn("size-4", isFetching && "animate-spin")}
                      aria-hidden
                    />
                    Làm mới
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 rounded-lg"
                    onClick={clearAllFilters}
                  >
                    <FilterX className="size-4" aria-hidden />
                    Xóa bộ lọc
                  </Button>
                </div>
              }
              csvExport={{ fileName: "danh-muc-dang-hoat-dong.csv" }}
            />
          )}
        </TabsContent>

        {canWriteCategories ? (
          <TabsContent value="trash" className="mt-0 space-y-4">
            {trashedError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <div>
                    <p className="font-semibold">Không tải được thùng rác</p>
                    <p className="mt-1 text-sm opacity-90">
                      {trashedError.message}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>
                    Danh mục trong thùng rác sẽ bị ẩn khỏi bộ chọn truyền thông.
                  </span>
                </p>
                <AdminDataTable<Category>
                  data={trashedItems}
                  getRowId={(row) => row.id}
                  columns={trashColumns}
                  isLoading={trashedLoading}
                  emptyLabel="Thùng rác trống hoặc không khớp tìm kiếm."
                  defaultExpandedAll={false}
                  manualFiltering
                  globalFilter={trashGlobalFilter}
                  onGlobalFilterChange={setTrashGlobalFilter}
                  globalFilterPlaceholder="Tìm theo tên, slug, mô tả (API)…"
                  rowSelectionEnabled={canWriteCategories}
                  selectedRowIds={trashCategorySelection}
                  onSelectedRowIdsChange={setTrashCategorySelection}
                  bulkActions={[
                    {
                      id: "bulk-category-restore",
                      label: "Khôi phục đã chọn",
                      onAction: async (rows) => {
                        const ids = rows.map((r) => r.id);
                        if (!ids.length) return;
                        await bulkCategoriesMutation.mutateAsync({
                          action: "restore",
                          ids,
                        });
                        toast.success(`Đã khôi phục ${ids.length} danh mục`);
                      },
                    },
                    {
                      id: "bulk-category-purge",
                      label: "Xóa vĩnh viễn đã chọn",
                      variant: "outline",
                      className: "border-destructive/40 text-destructive",
                      onAction: async (rows) => {
                        const ids = rows.map((r) => r.id);
                        if (!ids.length) return;
                        await bulkCategoriesMutation.mutateAsync({
                          action: "hard-delete",
                          ids,
                        });
                        toast.success(`Đã xóa vĩnh viễn ${ids.length} danh mục`);
                      },
                    },
                  ]}
                  filterToolbarExtra={
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 rounded-lg"
                        onClick={() => void refetchTrashedCategories()}
                      >
                        <RefreshCw
                          className={cn(
                            "size-4",
                            trashedCategoriesFetching && "animate-spin",
                          )}
                          aria-hidden
                        />
                        Làm mới
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 rounded-lg"
                        onClick={clearTrashFilters}
                      >
                        <FilterX className="size-4" aria-hidden />
                        Xóa bộ lọc
                      </Button>
                    </div>
                  }
                  csvExport={{ fileName: "danh-muc-thung-rac.csv" }}
                  footer={trashPaginationFooter}
                />
              </>
            )}
          </TabsContent>
        ) : null}
      </Tabs>

      <AdminConfirmActionDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        icon={<Archive className="size-5 shrink-0 text-muted-foreground" aria-hidden />}
        title="Đưa danh mục vào thùng rác?"
        description={
          deleteTarget ? (
            <>
              <strong className="text-foreground">{deleteTarget.name}</strong> (slug{" "}
              <span className="font-mono">{deleteTarget.slug}</span>) sẽ ẩn khỏi hệ thống cho
              đến khi khôi phục.
            </>
          ) : null
        }
        confirmLabel="Xóa tạm"
        confirmDestructive
        confirmDisabled={deleteMutation.isPending}
        confirmLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />

      <AdminConfirmActionDialog
        open={purgeTarget != null}
        onOpenChange={(open) => {
          if (!open) setPurgeTarget(null);
        }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        titleClassName="flex items-center gap-2 text-left text-destructive"
        icon={<Trash2 className="size-5 shrink-0" aria-hidden />}
        title="Xóa vĩnh viễn danh mục?"
        description={
          purgeTarget ? (
            <>
              <strong className="text-foreground">{purgeTarget.name}</strong> (slug{" "}
              <span className="font-mono">{purgeTarget.slug}</span>) sẽ bị xoá khỏi cơ sở dữ liệu.
              Không thể hoàn tác. API từ chối nếu còn sản phẩm đang hoạt động dùng slug này.
            </>
          ) : null
        }
        confirmLabel="Xóa vĩnh viễn"
        confirmDestructive
        confirmDisabled={purgeTrashedMutation.isPending}
        confirmLoading={purgeTrashedMutation.isPending}
        onConfirm={confirmPurgeTrashed}
      />

      <AdminConfirmActionDialog
        open={restoreTarget != null}
        onOpenChange={(open) => {
          if (!open) setRestoreTarget(null);
        }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        icon={<ArchiveRestore className="size-5 shrink-0 text-primary" aria-hidden />}
        title="Khôi phục danh mục?"
        description={
          restoreTarget ? (
            <>
              Đưa <strong className="text-foreground">{restoreTarget.name}</strong> trở lại danh
              sách đang hoạt động.
            </>
          ) : null
        }
        confirmLabel="Khôi phục"
        confirmDisabled={restoreMutation.isPending}
        confirmLoading={restoreMutation.isPending}
        onConfirm={confirmRestore}
      />
    </PageSection>
  );
}
