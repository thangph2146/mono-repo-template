"use client"

import type {
  ColumnFiltersState,
  RowSelectionState,
} from "@tanstack/react-table"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Headset } from "lucide-react"
import { Button } from "@ui/components/button"
import { Badge } from "@ui/components/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs"
import { PageSection } from "@ui/components/layout"
import { AdminPageGuard } from "@/components/admin-page-guard"
import { useContactRequests } from "@/hooks/queries"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import {
  ContactRequestTable,
  ContactRequestTrashTable,
  ContactConfirmDialog,
  ContactBulkConfirmDialog,
} from "./_component"
import type { ContactRequest } from "./_component/types"
import {
  useDeleteContactRequest,
  useRestoreContactRequest,
  usePurgeContactRequest,
  useBulkDeleteContactRequest,
  useBulkRestoreContactRequest,
  useBulkPurgeContactRequest,
} from "./_component/_query/use-contact-queries"
import {
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
} from "@ui/lib/layout-shell"
import { TypographyH1 } from "@ui/components/typography"
import { cn } from "@ui/lib/utils"

function ContactRequestsPageInner() {
  const router = useRouter()

  const [tab, setTab] = useState<"list" | "trash">("list")
  const [listSelection, setListSelection] = useState<RowSelectionState>({})
  const [trashSelection, setTrashSelection] = useState<RowSelectionState>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [trashPage, setTrashPage] = useState(1)
  const [trashPageSize, setTrashPageSize] = useState(20)

  const [globalFilter, setGlobalFilter] = useState("")
  const debouncedGlobalFilter = useDebouncedValue(globalFilter, 250)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [trashColumnFilters, setTrashColumnFilters] =
    useState<ColumnFiltersState>([])

  const [deleteTarget, setDeleteTarget] = useState<ContactRequest | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<ContactRequest | null>(null)
  const [purgeTarget, setPurgeTarget] = useState<ContactRequest | null>(null)
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<string[] | null>(null)
  const [bulkRestoreTarget, setBulkRestoreTarget] = useState<string[] | null>(null)
  const [bulkPurgeTarget, setBulkPurgeTarget] = useState<string[] | null>(null)

  const deleteMutation = useDeleteContactRequest()
  const restoreMutation = useRestoreContactRequest()
  const purgeMutation = usePurgeContactRequest()
  const bulkDeleteMutation = useBulkDeleteContactRequest()
  const bulkRestoreMutation = useBulkRestoreContactRequest()
  const bulkPurgeMutation = useBulkPurgeContactRequest()

  useEffect(() => {
    setPage(1)
  }, [debouncedGlobalFilter, pageSize])

  useEffect(() => {
    setTrashPage(1)
  }, [tab, trashPageSize])

  useEffect(() => {
    setListSelection({})
    setTrashSelection({})
  }, [tab])

  const listParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      search: debouncedGlobalFilter.trim() || undefined,
      status: columnFilters.find((f) => f.id === "status")?.value as
        | string
        | undefined,
    }),
    [columnFilters, debouncedGlobalFilter, page, pageSize]
  )

  const trashParams = useMemo(
    () => ({
      page: trashPage,
      limit: trashPageSize,
      search: debouncedGlobalFilter.trim() || undefined,
      trash: true,
    }),
    [debouncedGlobalFilter, trashPage, trashPageSize]
  )

  const activeQuery = useContactRequests({
    enabled: tab === "list",
    params: listParams,
  })

  const trashQuery = useContactRequests({
    enabled: tab === "trash",
    params: trashParams,
  })

  const activeItems = useMemo(
    () => activeQuery.data?.items ?? [],
    [activeQuery.data?.items]
  )
  const activeTotal = activeQuery.data?.total ?? 0
  const trashItems = useMemo(
    () => trashQuery.data?.items ?? [],
    [trashQuery.data?.items]
  )
  const trashTotal = trashQuery.data?.total ?? 0

  const handleView = useCallback(
    (contact: ContactRequest) => {
      router.push(`/contact-requests/${contact.id}`)
    },
    [router]
  )

  const handleEdit = useCallback(
    (contact: ContactRequest) => {
      router.push(`/contact-requests/${contact.id}/edit`)
    },
    [router]
  )

  const handleDelete = useCallback((contact: ContactRequest) => {
    setDeleteTarget(contact)
  }, [])

  const handleRestore = useCallback((contact: ContactRequest) => {
    setRestoreTarget(contact)
  }, [])

  const handlePurge = useCallback((contact: ContactRequest) => {
    setPurgeTarget(contact)
  }, [])

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    setBulkDeleteTarget(ids)
  }, [])

  const handleBulkRestore = useCallback(async (ids: string[]) => {
    setBulkRestoreTarget(ids)
  }, [])

  const handleBulkPurge = useCallback(async (ids: string[]) => {
    setBulkPurgeTarget(ids)
  }, [])

  const handleConfirmBulkDelete = useCallback(async () => {
    if (bulkDeleteTarget) {
      await bulkDeleteMutation.mutateAsync(bulkDeleteTarget)
      setBulkDeleteTarget(null)
      setListSelection({})
    }
  }, [bulkDeleteTarget, bulkDeleteMutation])

  const handleConfirmBulkRestore = useCallback(async () => {
    if (bulkRestoreTarget) {
      await bulkRestoreMutation.mutateAsync(bulkRestoreTarget)
      setBulkRestoreTarget(null)
      setTrashSelection({})
    }
  }, [bulkRestoreTarget, bulkRestoreMutation])

  const handleConfirmBulkPurge = useCallback(async () => {
    if (bulkPurgeTarget) {
      await bulkPurgeMutation.mutateAsync(bulkPurgeTarget)
      setBulkPurgeTarget(null)
      setTrashSelection({})
    }
  }, [bulkPurgeTarget, bulkPurgeMutation])

  const handleClearFilters = useCallback(() => {
    setGlobalFilter("")
    setColumnFilters([])
  }, [])

  const busy =
    deleteMutation.isPending ||
    restoreMutation.isPending ||
    purgeMutation.isPending ||
    bulkDeleteMutation.isPending ||
    bulkRestoreMutation.isPending ||
    bulkPurgeMutation.isPending

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            <Headset className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
            Yêu cầu liên hệ
          </TypographyH1>
          <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
            Quản lý các yêu cầu liên hệ từ người dùng
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "list" | "trash")}>
        <div className="mb-4 flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list" className="gap-2">
              Đang hoạt động
              {activeTotal > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {activeTotal}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="trash" className="gap-2">
              Thùng rác
              {trashTotal > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {trashTotal}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              activeQuery.refetch()
              trashQuery.refetch()
            }}
            disabled={activeQuery.isLoading || trashQuery.isLoading}
          >
            <RefreshCw
              className={cn(
                "size-4",
                activeQuery.isLoading || trashQuery.isLoading
                  ? "animate-spin"
                  : ""
              )}
              aria-hidden
            />
            Làm mới
          </Button>
        </div>

        <TabsContent value="list" className="mt-0">
          <ContactRequestTable
            data={activeItems}
            isLoading={activeQuery.isLoading}
            total={activeTotal}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            selectedRowIds={listSelection}
            onSelectedRowIdsChange={setListSelection}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            busy={busy}
            onBulkDelete={handleBulkDelete}
            onClearFilters={handleClearFilters}
          />
        </TabsContent>

        <TabsContent value="trash" className="mt-0">
          <ContactRequestTrashTable
            data={trashItems}
            isLoading={trashQuery.isLoading}
            total={trashTotal}
            page={trashPage}
            pageSize={trashPageSize}
            onPageChange={setTrashPage}
            onPageSizeChange={setTrashPageSize}
            columnFilters={trashColumnFilters}
            onColumnFiltersChange={setTrashColumnFilters}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            selectedRowIds={trashSelection}
            onSelectedRowIdsChange={setTrashSelection}
            onRestore={handleRestore}
            onPurge={handlePurge}
            busy={busy}
            onBulkRestore={handleBulkRestore}
            onBulkPurge={handleBulkPurge}
            onClearFilters={handleClearFilters}
          />
        </TabsContent>
      </Tabs>

      <ContactConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        action="delete"
        target={deleteTarget}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id)
            setDeleteTarget(null)
          }
        }}
        loading={deleteMutation.isPending}
      />

      <ContactConfirmDialog
        open={!!restoreTarget}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
        action="restore"
        target={restoreTarget}
        onConfirm={async () => {
          if (restoreTarget) {
            await restoreMutation.mutateAsync(restoreTarget.id)
            setRestoreTarget(null)
          }
        }}
        loading={restoreMutation.isPending}
      />

      <ContactConfirmDialog
        open={!!purgeTarget}
        onOpenChange={(open) => !open && setPurgeTarget(null)}
        action="purge"
        target={purgeTarget}
        onConfirm={async () => {
          if (purgeTarget) {
            await purgeMutation.mutateAsync(purgeTarget.id)
            setPurgeTarget(null)
          }
        }}
        loading={purgeMutation.isPending}
      />

      <ContactBulkConfirmDialog
        open={!!bulkDeleteTarget}
        onOpenChange={(open) => !open && setBulkDeleteTarget(null)}
        action="delete"
        count={bulkDeleteTarget?.length ?? 0}
        onConfirm={handleConfirmBulkDelete}
        loading={bulkDeleteMutation.isPending}
      />

      <ContactBulkConfirmDialog
        open={!!bulkRestoreTarget}
        onOpenChange={(open) => !open && setBulkRestoreTarget(null)}
        action="restore"
        count={bulkRestoreTarget?.length ?? 0}
        onConfirm={handleConfirmBulkRestore}
        loading={bulkRestoreMutation.isPending}
      />

      <ContactBulkConfirmDialog
        open={!!bulkPurgeTarget}
        onOpenChange={(open) => !open && setBulkPurgeTarget(null)}
        action="purge"
        count={bulkPurgeTarget?.length ?? 0}
        onConfirm={handleConfirmBulkPurge}
        loading={bulkPurgeMutation.isPending}
      />
    </PageSection>
  )
}

export default function ContactRequestsPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin"]}>
      <ContactRequestsPageInner />
    </AdminPageGuard>
  )
}
