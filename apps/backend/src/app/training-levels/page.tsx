"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, ColumnFiltersState, RowSelectionState } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw, GraduationCap, Plus } from "lucide-react";
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
  TrainingLevelsTable,
  TrainingLevelsTrashTable,
  TrainingLevelsConfirmDialog,
  getTrainingLevelColumns,
  getTrashColumns,
  useColumnFiltersChange,
  useClearListFilters,
  useClearTrashFilters,
  useHandleConfirmAction,
  useConfirmAction,
  useTrainingLevelsListQuery,
  useTrainingLevelsTrashQuery,
} from "./_component";
import type { TrainingLevelRow } from "./_component";

function TrainingLevelsPageInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canWrite = user
    ? canUserAccess(user, PERMISSION_CODES.TRAINING_LEVELS_MANAGE) ||
      canUserAccess(user, PERMISSION_CODES.TRAINING_LEVELS_CREATE) ||
      canUserAccess(user, PERMISSION_CODES.TRAINING_LEVELS_UPDATE)
    : false;

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["training-levels"] });
  };

  const [mainTab, setMainTab] = useState<"list" | "trash">("list");
  const [globalFilter, setGlobalFilter] = useState("");
  const [trashPage, setTrashPage] = useState(1);
  const [trashPageSize, setTrashPageSize] = useState(15);
  const [trashGlobalFilter, setTrashGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [trashColumnFilters, setTrashColumnFilters] = useState<ColumnFiltersState>([]);
  const [listSelection, setListSelection] = useState<RowSelectionState>({});
  const [trashSelection, setTrashSelection] = useState<RowSelectionState>({});

  const debouncedTrashQ = useDebouncedValue(trashGlobalFilter, 350);

  const listFilterParams = useMemo(() => {
    const params: Record<string, string> = {};
    for (const f of columnFilters) {
      if (f.id === "status") {
        params.statusFilter = String(f.value);
      } else if (f.id === "updatedAt" && typeof f.value === "string") {
        const [fromStr, toStr] = f.value.split(",");
        if (fromStr) params.updatedAtFrom = fromStr;
        if (toStr) params.updatedAtTo = toStr;
      }
    }
    return params;
  }, [columnFilters]);

  const trashFilterParams = useMemo(() => {
    const params: Record<string, string> = {};
    for (const f of trashColumnFilters) {
      if (f.id === "deletedAt" && typeof f.value === "string") {
        const [fromStr, toStr] = f.value.split(",");
        if (fromStr) params.deletedAtFrom = fromStr;
        if (toStr) params.deletedAtTo = toStr;
      }
    }
    return params;
  }, [trashColumnFilters]);

  const listQuery = useTrainingLevelsListQuery(api, canWrite || true, listFilterParams);

  const trashQuery = useTrainingLevelsTrashQuery({
    api,
    trashPage,
    trashPageSize,
    debouncedTrashQ,
    enabled: mainTab === "trash",
    filters: trashFilterParams,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.trainingLevels.remove(id),
    onSuccess: async () => { await invalidateAll(); },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => api.trainingLevels.restore(id),
    onSuccess: async () => { await invalidateAll(); },
  });

  const purgeMutation = useMutation({
    mutationFn: async (id: string) => api.trainingLevels.purge(id),
    onSuccess: async () => { await invalidateAll(); },
  });

  const bulkMutation = useMutation({
    mutationFn: async (input: { action: "delete" | "restore" | "hard-delete"; ids: string[] }) =>
      api.trainingLevels.bulk(input),
    onSuccess: async () => { await invalidateAll(); },
  });

  useEffect(() => { setTrashPage(1); }, [trashColumnFilters, debouncedTrashQ, trashPageSize]);
  useEffect(() => { setListSelection({}); setTrashSelection({}); }, [mainTab]);

  const handleColumnFiltersChange = useColumnFiltersChange(setColumnFilters);
  const clearListFilters = useClearListFilters(setColumnFilters, setGlobalFilter);
  const clearTrashFilters = useClearTrashFilters(setTrashGlobalFilter, setTrashColumnFilters);
  const handleTrashColumnFiltersChange = useColumnFiltersChange(setTrashColumnFilters);

  const { confirmAction, setConfirmAction } = useConfirmAction();

  const handleConfirmAction = useHandleConfirmAction(
    deleteMutation, restoreMutation, purgeMutation, setConfirmAction,
  );

  const columns = useMemo<ColumnDef<TrainingLevelRow>[]>(
    () => getTrainingLevelColumns({
      openDetail: (row) => router.push(`/training-levels/${row.id}`),
      openEdit: (row) => router.push(`/training-levels/${row.id}/edit`),
      setConfirmAction,
    }),
    [setConfirmAction, router],
  );

  const trashColumns = useMemo<ColumnDef<TrainingLevelRow>[]>(
    () => getTrashColumns({ setConfirmAction }),
    [setConfirmAction],
  );

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            <GraduationCap className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
            Bậc học
          </TypographyH1>
          <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
            Quản lý các bậc học trong hệ thống
          </p>
          {user && !canWrite && (
            <p className="mt-2 text-sm font-medium text-amber-800 dark:text-amber-200/90">
              Chỉ xem: cần quyền <span className="font-mono">training_levels:manage</span> để thêm/sửa/xoá.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-outline-variant flex h-12 items-center gap-2 rounded-lg px-4 font-semibold hover:bg-muted"
            onClick={() => { void listQuery.refetch(); void trashQuery.refetch(); }}
          >
            <RefreshCw
              className={cn("size-5", (listQuery.isFetching || trashQuery.isFetching) && "animate-spin")}
              aria-hidden
            />
            Làm mới
          </Button>
          {canWrite && (
            <Button
              type="button"
              onClick={() => router.push("/training-levels/new")}
              className="flex h-12 items-center gap-2 rounded-lg px-6 font-bold shadow-md"
            >
              <Plus className="size-5" aria-hidden /> Thêm bậc học
            </Button>
          )}
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={(v) => { if (v === "list" || v === "trash") setMainTab(v); }} className="space-y-6">
        <TabsList className="h-auto min-h-9 flex-wrap gap-1 rounded-lg p-1">
          <TabsTrigger value="list" className="flex items-center gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Danh sách
          </TabsTrigger>
          {canWrite && (
            <TabsTrigger value="trash" className="flex items-center gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Thùng rác
              {(trashQuery.data?.total ?? 0) > 0 ? (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] tabular-nums">
                  {trashQuery.data?.total}
                </Badge>
              ) : null}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list" className="mt-0 space-y-4">
          {listQuery.error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">Không tải được danh sách</p>
                  <p className="mt-1 text-sm opacity-90">{listQuery.error.message}</p>
                </div>
              </div>
            </div>
          ) : null}

          <TrainingLevelsTable
            data={listQuery.data ?? []}
            columns={columns}
            isLoading={listQuery.isLoading}
            columnFilters={columnFilters}
            onColumnFiltersChange={handleColumnFiltersChange}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            selectedRowIds={listSelection}
            onSelectedRowIdsChange={setListSelection}
            total={listQuery.data?.length ?? 0}
            onRefresh={() => void listQuery.refetch()}
            onClearFilters={clearListFilters}
            onBulkDelete={async (rows) => {
              const ids = rows.map((r) => r.id);
              if (!ids.length) return;
              await bulkMutation.mutateAsync({ action: "delete", ids });
              toast.success(`Đã đưa ${ids.length} bậc học vào thùng rác`);
            }}
            isFetching={listQuery.isFetching}
          />
        </TabsContent>

        {canWrite && (
          <TabsContent value="trash" className="mt-0 space-y-4">
            {trashQuery.error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <div>
                    <p className="font-semibold">Không tải được thùng rác</p>
                    <p className="mt-1 text-sm opacity-90">{trashQuery.error.message}</p>
                  </div>
                </div>
              </div>
            ) : (
              <TrainingLevelsTrashTable
                data={trashQuery.data?.items ?? []}
                columns={trashColumns}
                isLoading={trashQuery.isLoading}
                columnFilters={trashColumnFilters}
                onColumnFiltersChange={handleTrashColumnFiltersChange}
                globalFilter={trashGlobalFilter}
                onGlobalFilterChange={setTrashGlobalFilter}
                selectedRowIds={trashSelection}
                onSelectedRowIdsChange={setTrashSelection}
                page={trashPage}
                pageSize={trashPageSize}
                total={trashQuery.data?.total ?? 0}
                onPageChange={setTrashPage}
                onPageSizeChange={setTrashPageSize}
                onRefresh={() => void trashQuery.refetch()}
                onClearFilters={clearTrashFilters}
                onBulkRestore={async (rows) => {
                  const ids = rows.map((r) => r.id);
                  if (!ids.length) return;
                  await bulkMutation.mutateAsync({ action: "restore", ids });
                  toast.success(`Đã khôi phục ${ids.length} bậc học`);
                }}
                onBulkPurge={async (rows) => {
                  const ids = rows.map((r) => r.id);
                  if (!ids.length) return;
                  await bulkMutation.mutateAsync({ action: "hard-delete", ids });
                  toast.success(`Đã xóa vĩnh viễn ${ids.length} bậc học`);
                }}
                isFetching={trashQuery.isFetching}
              />
            )}
          </TabsContent>
        )}
      </Tabs>

      <TrainingLevelsConfirmDialog
        confirmAction={confirmAction}
        deleteMutation={deleteMutation}
        restoreMutation={restoreMutation}
        purgeMutation={purgeMutation}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        onConfirm={() => { if (confirmAction) void handleConfirmAction(confirmAction); }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
      />
    </PageSection>
  );
}

export default function TrainingLevelsPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <TrainingLevelsPageInner />
    </AdminPageGuard>
  );
}
