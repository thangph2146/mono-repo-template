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
import { AlertCircle, RefreshCw, Monitor, Plus } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuth } from "@/providers/auth-provider";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
import { PageSection } from "@ui/components/layout";
import { TypographyH1 } from "@ui/components/typography";
import { ADMIN_ALERT_DIALOG_CONTENT_CLASS, ADMIN_PAGE_SUBTITLE_CLASS, ADMIN_PAGE_TITLE_ICON_CLASS, ADMIN_PAGE_TITLE_PRIMARY_CLASS } from "@ui/lib/layout-shell";
import { cn } from "@ui/lib/utils";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import { ScreensTable, ScreensTrashTable, ScreensConfirmDialog, getScreenColumns, getTrashColumns, useColumnFiltersChange, useClearListFilters, useClearTrashFilters, useHandleConfirmAction, useConfirmAction, useScreensListQuery, useScreensTrashQuery } from "./_component";
import type { ScreenRow } from "./_component";

function ScreensPageInner() {
  const router = useRouter(), queryClient = useQueryClient(), { user } = useAuth();
  const canWrite = user ? canUserAccess(user, PERMISSION_CODES.SCREENS_MANAGE) || canUserAccess(user, PERMISSION_CODES.SCREENS_CREATE) || canUserAccess(user, PERMISSION_CODES.SCREENS_UPDATE) : false;
  const invalidateAll = async () => { await queryClient.invalidateQueries({ queryKey: ["screens"] }); };
  const [mainTab, setMainTab] = useState<"list" | "trash">("list");
  const [gF, setGF] = useState(""); const [tP, setTP] = useState(1); const [tPS, setTPS] = useState(15); const [tGF, setTGF] = useState("");
  const [cF, setCF] = useState<ColumnFiltersState>([]); const [tCF, setTCF] = useState<ColumnFiltersState>([]);
  const [lS, setLS] = useState<RowSelectionState>({}); const [tS, setTS] = useState<RowSelectionState>({});
  const dQ = useDebouncedValue(tGF, 350);
  const listQ = useScreensListQuery(api, canWrite || true);
  const trashQ = useScreensTrashQuery({ api: api, trashPage: tP, trashPageSize: tPS, debouncedTrashQ: dQ, enabled: mainTab === "trash" });
  const delM = useMutation({ mutationFn: (id: string) => api.screens.remove(id), onSuccess: invalidateAll });
  const resM = useMutation({ mutationFn: (id: string) => api.screens.restore(id), onSuccess: invalidateAll });
  const purM = useMutation({ mutationFn: (id: string) => api.screens.purge(id), onSuccess: invalidateAll });
  const bulM = useMutation({ mutationFn: (i: { action: string; ids: string[] }) => api.screens.bulk(i), onSuccess: invalidateAll });
  useEffect(() => { setTP(1); }, [tCF, dQ, tPS]); useEffect(() => { setLS({}); setTS({}); }, [mainTab]);
  const hCFC = useColumnFiltersChange(setCF); const cLF = useClearListFilters(setCF, setGF); const cTF = useClearTrashFilters(setTGF, setTCF); const hTCFC = useColumnFiltersChange(setTCF);
  const { confirmAction, setConfirmAction } = useConfirmAction();
  const hCA = useHandleConfirmAction(delM, resM, purM, setConfirmAction);
  const cols = useMemo<ColumnDef<ScreenRow>[]>(() => getScreenColumns({ openDetail: (r) => router.push(`/screens/${r.id}`), openEdit: (r) => router.push(`/screens/${r.id}/edit`), setConfirmAction }), [setConfirmAction, router]);
  const tCols = useMemo<ColumnDef<ScreenRow>[]>(() => getTrashColumns({ setConfirmAction }), [setConfirmAction]);
  return (<PageSection max="full" className="min-w-0 space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}><Monitor className={ADMIN_PAGE_TITLE_ICON_CLASS} /> Màn hình</TypographyH1><p className={ADMIN_PAGE_SUBTITLE_CLASS}>Quản lý màn hình.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" className="border-outline-variant flex h-12 items-center gap-2 rounded-lg px-4 font-semibold" onClick={() => { void listQ.refetch(); void trashQ.refetch(); }}><RefreshCw className={cn("size-5", (listQ.isFetching || trashQ.isFetching) && "animate-spin")} /> Làm mới</Button>
        {canWrite && <Button onClick={() => router.push("/screens/new")} className="flex h-12 items-center gap-2 rounded-lg px-6 font-bold shadow-md"><Plus className="size-5" /> Thêm màn hình</Button>}
      </div>
    </div>
    <Tabs value={mainTab} onValueChange={(v) => { if (v === "list" || v === "trash") setMainTab(v); }} className="space-y-6">
      <TabsList className="h-auto min-h-9 flex-wrap gap-1 rounded-lg p-1">
        <TabsTrigger value="list" className="flex items-center gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Danh sách</TabsTrigger>
        {canWrite && <TabsTrigger value="trash" className="flex items-center gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Thùng rác{(trashQ.data?.total ?? 0) > 0 ? <Badge variant="secondary" className="px-1.5 py-0 text-[10px] tabular-nums">{trashQ.data?.total}</Badge> : null}</TabsTrigger>}
      </TabsList>
      <TabsContent value="list" className="mt-0 space-y-4">
        {listQ.error ? (<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 size-5 shrink-0" /><div><p className="font-semibold">Lỗi</p><p className="mt-1 text-sm opacity-90">{listQ.error.message}</p></div></div></div>) : null}
        <ScreensTable data={listQ.data ?? []} columns={cols} isLoading={listQ.isLoading} columnFilters={cF} onColumnFiltersChange={hCFC} globalFilter={gF} onGlobalFilterChange={setGF} selectedRowIds={lS} onSelectedRowIdsChange={setLS} total={listQ.data?.length ?? 0} onRefresh={() => void listQ.refetch()} onClearFilters={cLF} onBulkDelete={async (rows) => { const ids = rows.map(r => r.id); if (!ids.length) return; await bulM.mutateAsync({ action: "delete", ids }); toast.success(`Đã xóa ${ids.length} màn hình`); }} isFetching={listQ.isFetching} />
      </TabsContent>
      {canWrite && (<TabsContent value="trash" className="mt-0 space-y-4">
        {trashQ.error ? (<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 size-5 shrink-0" /><div><p className="font-semibold">Lỗi</p></div></div></div>) : <ScreensTrashTable data={trashQ.data?.items ?? []} columns={tCols} isLoading={trashQ.isLoading} columnFilters={tCF} onColumnFiltersChange={hTCFC} globalFilter={tGF} onGlobalFilterChange={setTGF} selectedRowIds={tS} onSelectedRowIdsChange={setTS} page={tP} pageSize={tPS} total={trashQ.data?.total ?? 0} onPageChange={setTP} onPageSizeChange={setTPS} onRefresh={() => void trashQ.refetch()} onClearFilters={cTF} onBulkRestore={async (rows) => { const ids = rows.map(r => r.id); if (!ids.length) return; await bulM.mutateAsync({ action: "restore", ids }); toast.success(`Đã khôi phục ${ids.length} màn hình`); }} onBulkPurge={async (rows) => { const ids = rows.map(r => r.id); if (!ids.length) return; await bulM.mutateAsync({ action: "hard-delete", ids }); toast.success(`Đã xóa vĩnh viễn ${ids.length} màn hình`); }} isFetching={trashQ.isFetching} />}
      </TabsContent>)}
    </Tabs>
    <ScreensConfirmDialog confirmAction={confirmAction} deleteMutation={delM} restoreMutation={resM} purgeMutation={purM} onOpenChange={(o) => { if (!o) setConfirmAction(null); }} onConfirm={() => { if (confirmAction) void hCA(confirmAction); }} contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS} />
  </PageSection>);
}
export default function ScreensPage() { return <AdminPageGuard roles={["super_admin", "admin", "manager"]}><ScreensPageInner /></AdminPageGuard>; }
