"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef, ColumnFiltersState, OnChangeFn } from "@tanstack/react-table";
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
import { type Category, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
import {
  useCategoriesAdmin,
  useCategoryUsage,
  useCreateCategory,
  useDeleteCategory,
  usePurgeTrashedCategory,
  useRestoreCategory,
  useTrashedCategories,
  useUpdateCategory,
} from "@/hooks/queries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  CATEGORY_ICON_OPTIONS,
  resolveCategoryIcon,
} from "@/lib/category-icons";
import { cn } from "@ui/lib/utils";

interface FormState {
  id?: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  description: "",
  icon: "Package2",
  sortOrder: 0,
  isActive: true,
};

const slugify = (input: string): string =>
  input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type CategoryRow = Category & { productCount: number };

export default function CategoriesPage() {
  const { user } = useAuth();
  const canWriteCategories = user
    ? canUserAccess(user, PERMISSION_CODES.CATEGORIES_WRITE)
    : false;
  const { data: usageData } = useCategoryUsage();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const restoreMutation = useRestoreCategory();
  const purgeTrashedMutation = usePurgeTrashedCategory();

  const usageMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of usageData ?? []) map.set(u.slug, u.productCount);
    return map;
  }, [usageData]);

  const [mainTab, setMainTab] = useState<"list" | "trash">("list");
  const [page, setPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(15);
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedQ = useDebouncedValue(globalFilter, 350);
  const [trashPage, setTrashPage] = useState(1);
  const [trashPageSize, setTrashPageSize] = useState(15);
  const [trashGlobalFilter, setTrashGlobalFilter] = useState("");
  const debouncedTrashQ = useDebouncedValue(trashGlobalFilter, 350);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const listParams = useMemo(
    () => ({
      q: debouncedQ.trim() || undefined,
      page,
      limit: listPageSize,
    }),
    [debouncedQ, page, listPageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, listPageSize]);

  useEffect(() => {
    setTrashPage(1);
  }, [debouncedTrashQ, mainTab, trashPageSize]);

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
  const total = data?.total ?? 0;

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
    () =>
      categories.map((c) => ({
        ...c,
        productCount: usageMap.get(c.slug) ?? 0,
      })),
    [categories, usageMap],
  );

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
    };
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
    const inUse = usageMap.get(c.slug) ?? 0;
    if (inUse > 0) {
      toast.error(
        `Không thể xoá: còn ${inUse} sản phẩm đang sử dụng danh mục này`,
      );
      return;
    }
    setDeleteTarget(c);
  }, [usageMap]);

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
    setPage(1);
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
        meta: { filterPlaceholder: "Lọc tên" },
      },
      {
        accessorKey: "slug",
        header: "Slug",
        meta: { filterPlaceholder: "Lọc slug" },
      },
      {
        accessorKey: "description",
        header: "Mô tả",
        cell: ({ getValue }) => (getValue() as string | null) || "—",
        meta: { filterPlaceholder: "Lọc mô tả" },
      },
      {
        id: "icon",
        accessorFn: (r) => r.icon ?? "Package2",
        header: "Icon",
        cell: ({ row }) => {
          const I = resolveCategoryIcon(row.original.icon);
          return <I className="size-4 text-primary shrink-0" />;
        },
        filterFn: (row, id, v) => {
          if (v == null || v === "") return true;
          return String(row.getValue(id)) === String(v);
        },
        meta: {
          filterVariant: "select",
          filterLabel: "Icon (Lucide)",
          selectOptions: CATEGORY_ICON_OPTIONS.map((name) => ({
            value: name,
            label: name,
          })),
        },
      },
      {
        accessorKey: "sortOrder",
        header: "Thứ tự",
        filterFn: (row, id, v) => {
          if (v == null || v === "") return true;
          return Number(row.getValue(id)) === Number(v);
        },
        meta: { filterVariant: "number", filterPlaceholder: "Bằng…" },
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
        accessorKey: "productCount",
        header: "Số SP",
        filterFn: (row, id, v) => {
          if (v == null || v === "") return true;
          return Number(row.getValue(id)) === Number(v);
        },
        meta: { filterVariant: "number", filterPlaceholder: "Số SP = …" },
      },
      {
        id: "actions",
        header: "Thao tác",
        enableColumnFilter: false,
        enableSorting: false,
        meta: { disableColumnFilter: true },
        cell: ({ row }) => {
          const c = row.original;
          const usage = c.productCount;
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
                disabled={usage > 0}
              >
                <Trash2 className="w-4 h-4" /> Xóa
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

  const paginationFooter = (
    <AdminTablePaginationFooter
      page={page}
      pageSize={listPageSize}
      total={total}
      isLoading={loading}
      onPageChange={setPage}
      onPageSizeChange={setListPageSize}
      emptySummary="Không có danh mục"
      itemLabel="danh mục"
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-4xl font-extrabold text-foreground">
            <Tags className="size-9 shrink-0 text-primary" aria-hidden />
            Loại sản phẩm
          </h1>
          <p className="mt-1 font-medium text-on-surface-variant">
            Quản lý danh mục dùng chung cho cả storefront và quản trị viên
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
            className="flex h-12 items-center gap-2 rounded-xl border-outline-variant px-4 font-semibold hover:bg-muted"
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
                    className="flex h-12 items-center gap-2 rounded-xl px-6 font-bold shadow-md"
                  />
                }
              >
                <Plus className="size-5" aria-hidden /> Thêm danh mục
              </DialogTrigger>
            )}
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold">
                {form.id ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
              </DialogTitle>
              <DialogDescription>
                Slug được tự động sinh từ tên. Cập nhật slug sẽ tự đồng bộ lại
                tham chiếu trên các sản phẩm liên quan.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cat-name">Tên hiển thị</Label>
                  <Input
                    id="cat-name"
                    placeholder="VD: Đồ uống"
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
                    <SelectTrigger className="w-full rounded-xl">
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
                <div className="flex items-center justify-between rounded-xl border border-outline-variant px-4 py-3 sm:col-span-2">
                  <div>
                    <p className="text-sm font-semibold">Đang hoạt động</p>
                    <p className="text-xs text-on-surface-variant">
                      Khi tắt, danh mục sẽ ẩn khỏi storefront nhưng giữ lại
                      tham chiếu sản phẩm.
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
                className="mr-auto rounded-xl"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                className="rounded-xl font-bold"
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
        <TabsList className="h-auto min-h-9 flex-wrap gap-1 rounded-xl p-1">
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
          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 shadow-sm">
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span className="text-on-surface-variant">
                Tìm nhanh và lọc cột gọi API phân trang (chọn số dòng/trang ở cuối bảng).
                Cột «Số SP» lấy từ thống kê toàn hệ thống.
                {canWriteCategories ? (
                  <>
                    {" "}
                    Xóa là{" "}
                    <span className="font-semibold text-foreground">xóa tạm</span> (không
                    còn SP tham chiếu).
                  </>
                ) : null}
              </span>
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
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
              columns={columns}
              isLoading={loading}
              emptyLabel={
                canWriteCategories
                  ? 'Chưa có danh mục — bấm "Thêm danh mục".'
                  : "Chưa có dữ liệu hoặc không khớp bộ lọc."
              }
              defaultExpandedAll={false}
              manualFiltering
              columnFilters={columnFilters}
              onColumnFiltersChange={handleColumnFiltersChange}
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
              globalFilterPlaceholder="Tìm theo tên, slug, mô tả (API)…"
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
              footer={paginationFooter}
            />
          )}
        </TabsContent>

        {canWriteCategories ? (
          <TabsContent value="trash" className="mt-0 space-y-4">
            {trashedError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
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
                <p className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>
                    Danh mục trong thùng rác không hiển thị trên storefront.
                  </span>
                </p>
                <AdminDataTable<Category>
                  data={trashedItems}
                  columns={trashColumns}
                  isLoading={trashedLoading}
                  emptyLabel="Thùng rác trống hoặc không khớp tìm kiếm."
                  defaultExpandedAll={false}
                  manualFiltering
                  globalFilter={trashGlobalFilter}
                  onGlobalFilterChange={setTrashGlobalFilter}
                  globalFilterPlaceholder="Tìm theo tên, slug, mô tả (API)…"
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

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-[450px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-left">
              <Archive className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              Đưa danh mục vào thùng rác?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  <strong className="text-foreground">{deleteTarget.name}</strong>{" "}
                  (slug <span className="font-mono">{deleteTarget.slug}</span>) sẽ
                  ẩn khỏi hệ thống cho đến khi khôi phục.
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
                confirmDelete();
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
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
        <AlertDialogContent className="rounded-2xl sm:max-w-[450px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-left text-destructive">
              <Trash2 className="size-5 shrink-0" aria-hidden />
              Xóa vĩnh viễn danh mục?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {purgeTarget ? (
                <>
                  <strong className="text-foreground">{purgeTarget.name}</strong>{" "}
                  (slug <span className="font-mono">{purgeTarget.slug}</span>) sẽ bị
                  xoá khỏi cơ sở dữ liệu. Không thể hoàn tác. API từ chối nếu còn sản
                  phẩm đang hoạt động dùng slug này.
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
                confirmPurgeTrashed();
              }}
              disabled={purgeTrashedMutation.isPending}
            >
              {purgeTrashedMutation.isPending ? (
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
        <AlertDialogContent className="rounded-2xl sm:max-w-[450px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-left">
              <ArchiveRestore className="size-5 shrink-0 text-primary" aria-hidden />
              Khôi phục danh mục?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {restoreTarget ? (
                <>
                  Đưa{" "}
                  <strong className="text-foreground">{restoreTarget.name}</strong>{" "}
                  trở lại danh sách đang hoạt động.
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
                confirmRestore();
              }}
              disabled={restoreMutation.isPending}
            >
              {restoreMutation.isPending ? (
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
