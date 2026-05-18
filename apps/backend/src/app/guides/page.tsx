"use client";

import { useMemo, useState } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { Plus, BookOpen } from "lucide-react";
import { Button } from "@ui/components/button";
import { PageSection } from "@ui/components/layout";
import { TypographyH1 } from "@ui/components/typography";
import {
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import {
  useGuidesQuery,
  useGuidesActions,
  useDeleteGuideMutation,
  GroupFormDialog,
  GuidesConfirmDialog,
  getGuidesColumns,
  GuidesTable,
  PAGE_KEY,
  sortGroupsByOrder,
  type GuideConfirmAction,
} from "./_component";

function GuidesPageInner() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [confirmAction, setConfirmAction] = useState<GuideConfirmAction | null>(null);

  const { data, isLoading, isFetching, refetch } = useGuidesQuery({
    api,
    page: 1,
    limit: 1000,
    search: globalFilter,
  });

  const deleteMutation = useDeleteGuideMutation();

  const {
    formOpen,
    editTarget,
    openCreateForm,
    openEditForm,
    closeForm,
    handleSave,
    isSaving,
  } = useGuidesActions({ api, groups: data?.data ?? [] });

  const sortedGroups = useMemo(
    () => sortGroupsByOrder((data?.data ?? []).filter((g) => g.pageKey === PAGE_KEY)),
    [data],
  );

  const columns = useMemo(
    () =>
      getGuidesColumns({
        onEdit: openEditForm,
        onDelete: (row) => setConfirmAction({ kind: "delete", row }),
      }),
    [openEditForm],
  );

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    if (confirmAction.kind === "delete" && confirmAction.row) {
      await deleteMutation.mutateAsync({ api, id: confirmAction.row.id });
    }
    setConfirmAction(null);
  };

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            <BookOpen className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
            Hướng dẫn sử dụng
          </TypographyH1>
          <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
            Quản lý nhóm hướng dẫn sử dụng hệ thống
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button onClick={openCreateForm} className="gap-2">
            <Plus className="size-4" />
            Thêm nhóm
          </Button>
        </div>
      </div>

      <GuidesTable
        data={sortedGroups}
        columns={columns}
        isLoading={isLoading}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        total={sortedGroups.length}
        onRefresh={() => void refetch()}
        onClearFilters={() => {
          setGlobalFilter("");
          setColumnFilters([]);
        }}
        isFetching={isFetching}
      />

      <GroupFormDialog
        key={editTarget?.id ?? "new"}
        open={formOpen}
        initial={editTarget}
        onClose={closeForm}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <GuidesConfirmDialog
        confirmAction={confirmAction}
        deleteMutation={deleteMutation}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={() => {
          void handleConfirmAction();
        }}
      />
    </PageSection>
  );
}

export default function GuidesPage() {
  return (
    <AdminPageGuard permission="page_contents:view">
      <GuidesPageInner />
    </AdminPageGuard>
  );
}
