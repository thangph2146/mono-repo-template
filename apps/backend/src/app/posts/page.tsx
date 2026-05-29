"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
} from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import {
  AlertCircle,
  FileText,
  RefreshCw,
  Plus,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { PERMISSION_CODES, canUserAccess } from "@workspace/api-client";
import { api } from "@/lib/api";
import { PostsTable, PostsTrashTable } from "./_component/_table";
import { PostsConfirmDialog } from "./_component/_alert-dialog";
import {
  useColumnFiltersChange,
  useClearListFilters,
  useClearTrashFilters,
  useHandleConfirmActionWithAction,
} from "./_component/_hooks";
import {
  usePostsQuery,
  useTrashQuery,
  useCategoriesQuery,
  useTagsQuery,
  useDeleteMutation,
  useRestoreMutation,
  usePurgeMutation,
  useBulkMutation,
} from "./_component/_query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  ADMIN_ALERT_DIALOG_CONTENT_CLASS,
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";
import type {
  PostListRow,
  PostConfirmAction,
} from "./_component";
import {
  buildCategoryOptionTree,
  buildPostsFilterQuery,
  getPostColumns,
  getTrashColumns,
  formatDateTime,
} from "./_component";
import { PageSection } from "@ui/components/layout";
import { TypographyH1 } from "@ui/components/typography";

function PostsPageInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canCreate = user ? canUserAccess(user, PERMISSION_CODES.POSTS_CREATE) : false;
  const canUpdate = user ? canUserAccess(user, PERMISSION_CODES.POSTS_UPDATE) : false;
  const canDelete = user ? canUserAccess(user, PERMISSION_CODES.POSTS_DELETE) : false;
  const canRestore = user ? canUserAccess(user, PERMISSION_CODES.POSTS_RESTORE) : false;
  const canExport = user ? canUserAccess(user, PERMISSION_CODES.POSTS_EXPORT) : false;

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["media", "posts"] });
  };

  const [mainTab, setMainTab] = useState<"list" | "trash">("list");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [globalFilter, setGlobalFilter] = useState("");
  const [trashPage, setTrashPage] = useState(1);
  const [trashPageSize, setTrashPageSize] = useState(10);
  const [trashGlobalFilter, setTrashGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [trashColumnFilters, setTrashColumnFilters] = useState<ColumnFiltersState>([]);
  const [listPostSelection, setListPostSelection] = useState<RowSelectionState>({});
  const [trashPostSelection, setTrashPostSelection] = useState<RowSelectionState>({});
  const [confirmAction, setConfirmAction] = useState<PostConfirmAction | null>(null);

  const debouncedQ = useDebouncedValue(globalFilter, 300);
  const debouncedTrashQ = useDebouncedValue(trashGlobalFilter, 300);

  const postColumnFilterQuery = useMemo(
    () => buildPostsFilterQuery(columnFilters),
    [columnFilters],
  );

  const trashColumnFilterQuery = useMemo(
    () => buildPostsFilterQuery(trashColumnFilters),
    [trashColumnFilters],
  );

  const postsQuery = usePostsQuery({
    api,
    page,
    pageSize,
    debouncedQ,
    postColumnFilterQuery,
  });

  const trashQuery = useTrashQuery({
    api,
    trashPage,
    trashPageSize,
    debouncedTrashQ,
    trashColumnFilterQuery,
    enabled: mainTab === "trash",
  });

  const categoriesQuery = useCategoriesQuery(api);
  const tagsQuery = useTagsQuery(api);

  const deleteMutation = useDeleteMutation({ api, invalidateAll });
  const restoreMutation = useRestoreMutation({ api, invalidateAll });
  const purgeMutation = usePurgeMutation({ api, invalidateAll });
  const bulkMutation = useBulkMutation({ api, invalidateAll });

  const categoryTreeOptions = useMemo(
    () => buildCategoryOptionTree(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );

  useEffect(() => {
    setPage(1);
  }, [columnFilters, debouncedQ, pageSize]);

  useEffect(() => {
    setTrashPage(1);
  }, [trashColumnFilters, debouncedTrashQ, trashPageSize]);

  useEffect(() => {
    setListPostSelection({});
    setTrashPostSelection({});
  }, [mainTab]);

  const handleColumnFiltersChange = useColumnFiltersChange(setColumnFilters);
  const clearListFilters = useClearListFilters(setColumnFilters, setGlobalFilter);
  const clearTrashFilters = useClearTrashFilters(setTrashGlobalFilter, setTrashColumnFilters);
  const handleTrashColumnFiltersChange = useColumnFiltersChange(setTrashColumnFilters);

  const navigateToView = useCallback(
    (id: string) => router.push(`/posts/${id}`),
    [router],
  );

  const navigateToEdit = useCallback(
    (id: string) => router.push(`/posts/${id}/edit`),
    [router],
  );

  const handleConfirmAction = useHandleConfirmActionWithAction(
    deleteMutation,
    restoreMutation,
    purgeMutation,
    setConfirmAction,
  );

  const columns = useMemo<ColumnDef<PostListRow>[]>(
    () =>
      getPostColumns({
        navigateToEdit,
        navigateToView,
        setConfirmAction,
        categoryTreeOptions,
        tagsOptions: tagsQuery.data ?? [],
        formatDateTime,
        canUpdate,
        canDelete,
      }),
    [navigateToEdit, navigateToView, tagsQuery.data, categoryTreeOptions, canUpdate, canDelete],
  );

  const trashColumns = useMemo<ColumnDef<PostListRow>[]>(
    () =>
      getTrashColumns({
        setConfirmAction,
        formatDateTime,
        categoryTreeOptions,
        tagsOptions: tagsQuery.data ?? [],
        canRestore,
        canDelete,
      }),
    [setConfirmAction, categoryTreeOptions, tagsQuery.data, canRestore, canDelete],
  );

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            <FileText className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
            Bài viết
          </TypographyH1>
          <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
            Quản lý bài viết truyền thông, gắn danh mục và thẻ dùng chung
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void postsQuery.refetch();
              void trashQuery.refetch();
            }}
          >
            <RefreshCw
              className={
                postsQuery.isFetching || trashQuery.isFetching
                  ? "size-5 animate-spin"
                  : "size-5"
              }
            />
            Làm mới
          </Button>
          {canCreate && (
            <Button
              type="button"
              onClick={() => router.push("/posts/new")}
            >
              <Plus className="size-5" />
              Thêm bài viết
            </Button>
          )}
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={(v) => v === "list" || v === "trash" ? setMainTab(v) : null}>
        <TabsList className="h-auto min-h-9 flex-wrap gap-1 rounded-lg p-1">
          <TabsTrigger value="list" className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Danh sách
          </TabsTrigger>
          {canRestore && (
            <TabsTrigger value="trash" className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Thùng rác
              {(trashQuery.data?.total ?? 0) > 0 ? (
                <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-[10px] tabular-nums">
                  {trashQuery.data?.total}
                </Badge>
              ) : null}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list" className="mt-4 space-y-4">
          {postsQuery.error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="font-semibold">Không tải được bài viết</p>
                  <p className="mt-1 text-sm opacity-90">{postsQuery.error.message}</p>
                </div>
              </div>
            </div>
          ) : null}

          <PostsTable
            data={postsQuery.data?.items ?? []}
            columns={columns}
            isLoading={postsQuery.isLoading}
            columnFilters={columnFilters}
            onColumnFiltersChange={handleColumnFiltersChange}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            selectedRowIds={listPostSelection}
            onSelectedRowIdsChange={setListPostSelection}
            page={page}
            pageSize={pageSize}
            total={postsQuery.data?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onRefresh={() => void postsQuery.refetch()}
            onClearFilters={clearListFilters}
            onBulkDelete={async (rows) => {
              const ids = rows.map((r) => String(r.id));
              if (!ids.length) return;
              await bulkMutation.mutateAsync({ action: "delete", ids });
              toast.success(`Đã đưa ${ids.length} bài viết vào thùng rác`);
            }}
            isFetching={postsQuery.isFetching}
            canExport={canExport}
            canDelete={canDelete}
          />
        </TabsContent>

        <TabsContent value="trash" className="mt-4 space-y-4">
          <PostsTrashTable
            data={trashQuery.data?.items ?? []}
            columns={trashColumns}
            isLoading={trashQuery.isLoading}
            columnFilters={trashColumnFilters}
            onColumnFiltersChange={handleTrashColumnFiltersChange}
            globalFilter={trashGlobalFilter}
            onGlobalFilterChange={setTrashGlobalFilter}
            selectedRowIds={trashPostSelection}
            onSelectedRowIdsChange={setTrashPostSelection}
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
              toast.success(`Đã khôi phục ${ids.length} bài viết`);
            }}
            onBulkPurge={async (rows) => {
              const ids = rows.map((r) => String(r.id));
              if (!ids.length) return;
              await bulkMutation.mutateAsync({ action: "hard-delete", ids });
              toast.success(`Đã xóa vĩnh viễn ${ids.length} bài viết`);
            }}
            isFetching={trashQuery.isFetching}
            canExport={canExport}
            canRestore={canRestore}
            canDelete={canDelete}
          />
        </TabsContent>
      </Tabs>

      <PostsConfirmDialog
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

export default function PostsPage() {
  return (
    <AdminPageGuard permission={PERMISSION_CODES.POSTS_VIEW}>
      <PostsPageInner />
    </AdminPageGuard>
  );
}
