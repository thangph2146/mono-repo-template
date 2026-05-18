"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef, ColumnFiltersState, RowSelectionState } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { PageSection } from "@ui/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { TypographyH1, TypographyH2 } from "@ui/components/typography";
import { AlertCircle, Hash, Plus, RefreshCw } from "lucide-react";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuth } from "@/providers/auth-provider";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
import {
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";
import {
  EMPTY_TAG_FORM,
  getTagColumns,
  getTrashColumns,
  buildTagTree,
  useTagsListQuery,
  useTrashQuery,
  useCreateMutation,
  useUpdateMutation,
  useDeleteMutation,
  useRestoreMutation,
  usePurgeMutation,
  useBulkMutation,
  useHandleDelete,
  useHandleRestore,
  useHandlePurge,
  TagFormDialog,
  TagsConfirmDialog,
  TagsTrashTable,
  slugify,
} from "./_component";
import type { TagRow, TagTreeRow, TagFormValues } from "./_component";

function TagsPageInner() {
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
  const [form, setForm] = useState<TagFormValues>(EMPTY_TAG_FORM);
  const [deleteTarget, setDeleteTarget] = useState<TagRow | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<TagRow | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<TagRow | null>(null);
  const [listTagSelection, setListTagSelection] = useState<RowSelectionState>({});
  const [trashTagSelection, setTrashTagSelection] = useState<RowSelectionState>({});
  const [trashColumnFilters, setTrashColumnFilters] = useState<ColumnFiltersState>([]);
  const [listColumnFilters, setListColumnFilters] = useState<ColumnFiltersState>([]);
  const [bulkDeleteCount, setBulkDeleteCount] = useState(0);
  const debouncedTrashQ = useDebouncedValue(trashGlobalFilter, 350);

  const listQuery = useTagsListQuery(api, canRead);

  const trashQuery = useTrashQuery({
    api,
    trashPage,
    trashPageSize,
    debouncedTrashQ,
    trashColumnFilters,
    enabled: canRead && mainTab === "trash",
  });

  const reload = useCallback(async () => {
    await Promise.all([listQuery.refetch(), trashQuery.refetch()]);
  }, [listQuery, trashQuery]);

  const invalidateAll = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["media", "tags"] });
  }, [queryClient]);

  const createMutation = useCreateMutation(api, invalidateAll);
  const updateMutation = useUpdateMutation(api, invalidateAll);
  const deleteMutation = useDeleteMutation(api, invalidateAll);
  const restoreMutation = useRestoreMutation(api, invalidateAll);
  const purgeMutation = usePurgeMutation(api, invalidateAll);
  const bulkMutation = useBulkMutation(api, invalidateAll);

  useEffect(() => {
    setTrashPage(1);
  }, [debouncedTrashQ, trashPageSize]);

  useEffect(() => {
    setListTagSelection({});
    setTrashTagSelection({});
  }, [mainTab]);

  const openCreate = useCallback(() => {
    setForm(EMPTY_TAG_FORM);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((row: TagRow) => {
    setForm({ id: row.id, name: row.name, slug: row.slug });
    setDialogOpen(true);
  }, []);

  const submitting = createMutation.isPending || updateMutation.isPending;

  const handleDelete = useHandleDelete(deleteMutation);
  const handleRestore = useHandleRestore(restoreMutation);
  const handlePurge = useHandlePurge(purgeMutation);

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
    () =>
      getTagColumns({ openEdit, setDeleteTarget, canWrite, canDelete }),
    [openEdit, setDeleteTarget, canWrite, canDelete],
  );

  const trashColumns = useMemo<ColumnDef<TagRow>[]>(
    () => getTrashColumns({ setRestoreTarget, setPurgeTarget, canDelete }),
    [setRestoreTarget, setPurgeTarget, canDelete],
  );

  if (!canRead) {
    return (
      <PageSection max="full" className="min-w-0 space-y-6">
        <div className="rounded-lg border border-outline-variant bg-surface-container p-6">
          <TypographyH2 className="text-lg font-semibold">Không có quyền truy cập</TypographyH2>
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
          <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            <Hash className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
            Thẻ
          </TypographyH1>
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
              className={
                listQuery.isFetching || trashQuery.isFetching
                  ? "size-5 animate-spin"
                  : "size-5"
              }
            />
            Làm mới
          </Button>
          <TagFormDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            form={form}
            onChange={setForm}
            onSave={handleSave}
            canWrite={canWrite}
            submitting={submitting}
            trigger={
              <Button
                onClick={openCreate}
                className="flex h-12 items-center gap-2 rounded-lg px-6 font-bold shadow-md"
                disabled={!canWrite}
              >
                <Plus className="size-5" />
                Thêm thẻ
              </Button>
            }
          />
        </div>
      </div>

      <Tabs
        value={mainTab}
        onValueChange={(v) => (v === "list" || v === "trash" ? setMainTab(v) : null)}
      >
        <TabsList className="h-auto min-h-9 flex-wrap gap-1 rounded-lg p-1">
          <TabsTrigger
            value="list"
            className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Danh sách
          </TabsTrigger>
          <TabsTrigger
            value="trash"
            className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
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
              API hiện chưa có quan hệ cha-con thật cho `tag`, nên các nhóm này chỉ là lớp hiển
              thị.
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
            manualFiltering
            columnFilters={listColumnFilters}
            onColumnFiltersChange={setListColumnFilters}
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
                        setBulkDeleteCount(ids.length);
                      },
                    },
                  ]
                : []
            }
          />
        </TabsContent>

        <TabsContent value="trash" className="mt-4 space-y-4">
          <TagsTrashTable
            data={trashQuery.data?.items ?? []}
            columns={trashColumns}
            isLoading={trashQuery.isLoading}
            columnFilters={trashColumnFilters}
            onColumnFiltersChange={setTrashColumnFilters}
            globalFilter={trashGlobalFilter}
            onGlobalFilterChange={setTrashGlobalFilter}
            selectedRowIds={trashTagSelection}
            onSelectedRowIdsChange={setTrashTagSelection}
            page={trashPage}
            pageSize={trashPageSize}
            total={trashQuery.data?.total ?? 0}
            onPageChange={setTrashPage}
            onPageSizeChange={setTrashPageSize}
            canDelete={canDelete}
            bulkMutation={bulkMutation}
          />
        </TabsContent>
      </Tabs>

      <TagsConfirmDialog
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        onDeleteConfirm={() => {
          if (!deleteTarget) return;
          void handleDelete(deleteTarget).finally(() => setDeleteTarget(null));
        }}
        restoreTarget={restoreTarget}
        setRestoreTarget={setRestoreTarget}
        onRestoreConfirm={() => {
          if (!restoreTarget) return;
          void handleRestore(restoreTarget).finally(() => setRestoreTarget(null));
        }}
        purgeTarget={purgeTarget}
        setPurgeTarget={setPurgeTarget}
        onPurgeConfirm={() => {
          if (!purgeTarget) return;
          void handlePurge(purgeTarget).finally(() => setPurgeTarget(null));
        }}
        bulkDeleteCount={bulkDeleteCount}
        setBulkDeleteTarget={setBulkDeleteCount}
        onBulkDeleteConfirm={async () => {
          const selectedRows = Object.keys(listTagSelection);
          if (!selectedRows.length) return;
          const ids = treeRows
            .filter((r) => !r.isGroup && selectedRows.includes(r.id))
            .map((r) => r.id);
          if (!ids.length) return;
          await bulkMutation.mutateAsync({ action: "delete", ids });
          toast.success(`Đã đưa ${ids.length} thẻ vào thùng rác`);
          setListTagSelection({});
          setBulkDeleteCount(0);
        }}
      />
    </PageSection>
  );
}

export default function TagsPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <TagsPageInner />
    </AdminPageGuard>
  );
}
