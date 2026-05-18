"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
} from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  RefreshCw,
  Tags,
  Plus,
} from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuth } from "@/providers/auth-provider";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
import { PageSection } from "@ui/components/layout";
import { TypographyH1 } from "@ui/components/typography";
import {
  ADMIN_ALERT_DIALOG_CONTENT_CLASS,
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";
import { cn } from "@ui/lib/utils";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import {
  CategoriesTable,
  CategoriesTrashTable,
  CategoriesConfirmDialog,
  getCategoryColumns,
  getTrashColumns,
  buildCategoryOptionTree,
  buildCategoriesFilterQuery,
  formatDateTime,
  useColumnFiltersChange,
  useClearListFilters,
  useClearTrashFilters,
  useHandleConfirmAction,
  useConfirmAction,
  useCategoriesQuery,
  useTrashQuery,
  useCategoriesOptionsQuery,
} from "./_component";
import type { CategoryRow } from "./_component/types";

function buildCategoryTree(rows: CategoryRow[]): CategoryRow[] {
  const byId = new Map<string, CategoryRow>();
  for (const row of rows) {
    byId.set(row.id, { ...row, subRows: [] });
  }
  const roots: CategoryRow[] = [];
  for (const row of byId.values()) {
    const parentId = row.parentId ?? null;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId)!.subRows!.push(row);
    } else {
      roots.push(row);
    }
  }
  const sortTree = (items: CategoryRow[]): CategoryRow[] =>
    [...items]
      .sort((a, b) => a.name.localeCompare(b.name, "vi"))
      .map((item) => ({ ...item, subRows: sortTree(item.subRows ?? []) }));
  return sortTree(roots);
}

function CategoriesPageInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canWriteCategories = user
    ? canUserAccess(user, PERMISSION_CODES.CATEGORIES_WRITE)
    : false;

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const [mainTab, setMainTab] = useState<"list" | "trash">("list");
  const [globalFilter, setGlobalFilter] = useState("");
  const [trashPage, setTrashPage] = useState(1);
  const [trashPageSize, setTrashPageSize] = useState(10);
  const [trashGlobalFilter, setTrashGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [trashColumnFilters, setTrashColumnFilters] = useState<ColumnFiltersState>([]);
  const [listCategorySelection, setListCategorySelection] = useState<RowSelectionState>({});
  const [trashCategorySelection, setTrashCategorySelection] = useState<RowSelectionState>({});

  const debouncedQ = useDebouncedValue(globalFilter, 300);
  const debouncedTrashQ = useDebouncedValue(trashGlobalFilter, 300);

  const listColumnFilterQuery = useMemo(
    () => buildCategoriesFilterQuery(columnFilters),
    [columnFilters],
  );

  const trashColumnFilterQuery = useMemo(
    () => buildCategoriesFilterQuery(trashColumnFilters),
    [trashColumnFilters],
  );

  const categoriesQuery = useCategoriesQuery({
    api,
    debouncedQ,
    columnFilterQuery: listColumnFilterQuery,
  });

  const trashQuery = useTrashQuery({
    api,
    trashPage,
    trashPageSize,
    debouncedTrashQ,
    trashColumnFilterQuery,
    enabled: mainTab === "trash",
  });

  const categoriesOptionsQuery = useCategoriesOptionsQuery(api);

  const categoryTreeOptions = useMemo(
    () => buildCategoryOptionTree(categoriesOptionsQuery.data ?? []),
    [categoriesOptionsQuery.data],
  );

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.http.delete(`/admin/categories/${id}`),
    onSuccess: async () => {
      await invalidateAll();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => api.http.post(`/admin/categories/${id}/restore`),
    onSuccess: async () => {
      await invalidateAll();
    },
  });

  const purgeMutation = useMutation({
    mutationFn: async (id: string) =>
      api.http.delete(`/admin/categories/${id}/hard-delete`),
    onSuccess: async () => {
      await invalidateAll();
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async (input: {
      action: "delete" | "restore" | "hard-delete";
      ids: string[];
    }) => api.http.post("/admin/categories/bulk", input),
    onSuccess: async () => {
      await invalidateAll();
    },
  });

  useEffect(() => {
    setTrashPage(1);
  }, [trashColumnFilters, debouncedTrashQ, trashPageSize]);

  useEffect(() => {
    setListCategorySelection({});
    setTrashCategorySelection({});
  }, [mainTab]);

  const handleColumnFiltersChange = useColumnFiltersChange(setColumnFilters);
  const clearListFilters = useClearListFilters(setColumnFilters, setGlobalFilter);
  const clearTrashFilters = useClearTrashFilters(setTrashGlobalFilter, setTrashColumnFilters);
  const handleTrashColumnFiltersChange = useColumnFiltersChange(setTrashColumnFilters);

  const { confirmAction, setConfirmAction } = useConfirmAction();

  const handleConfirmAction = useHandleConfirmAction(
    deleteMutation,
    restoreMutation,
    purgeMutation,
    setConfirmAction,
  );

  const columns = useMemo<ColumnDef<CategoryRow>[]>(
    () =>
      getCategoryColumns({
        openDetail: (row) => router.push(`/categories/${row.id}`),
        openEdit: (row) => router.push(`/categories/${row.id}/edit`),
        setConfirmAction,
        categoryTreeOptions,
        canWriteCategories,
      }),
    [setConfirmAction, categoryTreeOptions, canWriteCategories, router],
  );

  const trashColumns = useMemo<ColumnDef<CategoryRow>[]>(
    () =>
      getTrashColumns({
        setConfirmAction,
        formatDateTime,
        categoryTreeOptions,
      }),
    [setConfirmAction, categoryTreeOptions],
  );

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            <Tags className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
            Danh mục dùng chung
          </TypographyH1>
          <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
            Quản lý taxonomy dùng chung để gắn cho bài viết, thẻ và các nội dung
            truyền thông
          </p>
          {user && !canWriteCategories && (
            <p className="mt-2 text-sm font-medium text-amber-800 dark:text-amber-200/90">
              Chỉ xem: cần quyền{" "}
              <span className="font-mono">categories.write</span> để
              thêm/sửa/xoá.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-outline-variant flex h-12 items-center gap-2 rounded-lg px-4 font-semibold hover:bg-muted"
            onClick={() => {
              void categoriesQuery.refetch();
              void trashQuery.refetch();
            }}
          >
            <RefreshCw
              className={cn(
                "size-5",
                (categoriesQuery.isFetching || trashQuery.isFetching) && "animate-spin",
              )}
              aria-hidden
            />
            Làm mới
          </Button>
          {canWriteCategories && (
            <Button
              type="button"
              onClick={() => router.push("/categories/new")}
              className="flex h-12 items-center gap-2 rounded-lg px-6 font-bold shadow-md"
            >
              <Plus className="size-5" aria-hidden /> Thêm danh mục
            </Button>
          )}
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
            Danh sách
          </TabsTrigger>
          {canWriteCategories ? (
            <TabsTrigger
              value="trash"
              className="flex items-center gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Thùng rác
              {(trashQuery.data?.total ?? 0) > 0 ? (
                <Badge
                  variant="secondary"
                  className="px-1.5 py-0 text-[10px] tabular-nums"
                >
                  {trashQuery.data?.total}
                </Badge>
              ) : null}
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="list" className="mt-0 space-y-4">
          {categoriesQuery.error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">Không tải được danh mục</p>
                  <p className="mt-1 text-sm opacity-90">
                    {categoriesQuery.error.message}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <CategoriesTable
            data={buildCategoryTree(categoriesQuery.data?.items ?? [])}
            columns={columns}
            isLoading={categoriesQuery.isLoading}
            columnFilters={columnFilters}
            onColumnFiltersChange={handleColumnFiltersChange}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            selectedRowIds={listCategorySelection}
            onSelectedRowIdsChange={setListCategorySelection}
            total={categoriesQuery.data?.total ?? 0}
            onRefresh={() => void categoriesQuery.refetch()}
            onClearFilters={clearListFilters}
            onBulkDelete={async (rows) => {
              const ids = rows.map((r) => String(r.id));
              if (!ids.length) return;
              await bulkMutation.mutateAsync({ action: "delete", ids });
              toast.success(`Đã đưa ${ids.length} danh mục vào thùng rác`);
            }}
            isFetching={categoriesQuery.isFetching}
            canSelectRow={(row) => {
              const childCount = row.original._count?.children ?? 0;
              const linkedPosts = row.original.postCount ?? 0;
              return !(childCount > 0 || linkedPosts > 0);
            }}
          />
        </TabsContent>

        {canWriteCategories ? (
          <TabsContent value="trash" className="mt-0 space-y-4">
            {trashQuery.error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <div>
                    <p className="font-semibold">Không tải được thùng rác</p>
                    <p className="mt-1 text-sm opacity-90">
                      {trashQuery.error.message}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <CategoriesTrashTable
                data={buildCategoryTree(trashQuery.data?.items ?? [])}
                columns={trashColumns}
                isLoading={trashQuery.isLoading}
                columnFilters={trashColumnFilters}
                onColumnFiltersChange={handleTrashColumnFiltersChange}
                globalFilter={trashGlobalFilter}
                onGlobalFilterChange={setTrashGlobalFilter}
                selectedRowIds={trashCategorySelection}
                onSelectedRowIdsChange={setTrashCategorySelection}
                page={trashPage}
                pageSize={trashPageSize}
                total={trashQuery.data?.total ?? 0}
                onPageChange={setTrashPage}
                onPageSizeChange={setTrashPageSize}
                onRefresh={() => void trashQuery.refetch()}
                onClearFilters={clearTrashFilters}
                onBulkRestore={async (rows) => {
                  const ids = rows.map((r) => String(r.id));
                  if (!ids.length) return;
                  await bulkMutation.mutateAsync({ action: "restore", ids });
                  toast.success(`Đã khôi phục ${ids.length} danh mục`);
                }}
                onBulkPurge={async (rows) => {
                  const ids = rows.map((r) => String(r.id));
                  if (!ids.length) return;
                  await bulkMutation.mutateAsync({ action: "hard-delete", ids });
                  toast.success(`Đã xóa vĩnh viễn ${ids.length} danh mục`);
                }}
                isFetching={trashQuery.isFetching}
              />
            )}
          </TabsContent>
        ) : null}
      </Tabs>

      <CategoriesConfirmDialog
        confirmAction={confirmAction}
        deleteMutation={deleteMutation}
        restoreMutation={restoreMutation}
        purgeMutation={purgeMutation}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        onConfirm={() => {
          if (confirmAction) void handleConfirmAction(confirmAction);
        }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
      />
    </PageSection>
  );
}

export default function CategoriesPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <CategoriesPageInner />
    </AdminPageGuard>
  );
}
