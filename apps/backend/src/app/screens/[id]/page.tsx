"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Pencil, Calendar, Clock, Monitor, Hash, Camera, Layout } from "lucide-react";
import { PageSection } from "@ui/components/layout";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import { useScreenDetailQuery } from "../_component";
import { TypographyH1 } from "@ui/components/typography";
import { ADMIN_PAGE_SUBTITLE_CLASS, ADMIN_PAGE_TITLE_PRIMARY_CLASS } from "@ui/lib/layout-shell";
import { useAuth } from "@/providers/auth-provider";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
function fmt(v: string | null | undefined): string { if (!v) return "—"; const d = new Date(v); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("vi-VN"); }
function DetailInner() {
  const router = useRouter(), params = useParams(), id = params.id as string;
  const { user } = useAuth();
  const canUpdate = user ? canUserAccess(user, PERMISSION_CODES.SCREENS_UPDATE) : false;
  const { data: e, isLoading, isError } = useScreenDetailQuery(api, id);
  useEffect(() => { if (isError) { toast.error("Không tải được màn hình"); router.push("/screens"); } }, [isError, router]);
  if (isLoading) return <PageSection max="full" className="min-w-0 flex items-center justify-center py-24"><Loader2 className="size-8 animate-spin text-muted-foreground" /></PageSection>;
  if (!e) return null;
  return (<PageSection max="full" className="min-w-0 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><Button variant="outline" className="gap-1" onClick={() => router.push("/screens")}><ArrowLeft className="size-4" /> Quay lại</Button><div><TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>{e.name}</TypographyH1><p className={ADMIN_PAGE_SUBTITLE_CLASS}>Màn hình</p></div></div>
      {canUpdate && <Button variant="default" className="gap-2 rounded-lg px-5 font-semibold" onClick={() => router.push(`/screens/${id}/edit`)}><Pencil className="size-4" /> Chỉnh sửa</Button>}
    </div>
    <div className="grid gap-6 lg:grid-cols-3 my-6">
      <div className="space-y-6 lg:col-span-2">
        <Card className="border border-border/70 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg"><Monitor className="size-5 text-primary" /> Thông tin màn hình</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div><p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide"><Hash className="size-3" /> Mã màn hình</p><p className="mt-1 text-sm text-foreground">{e.code || "—"}</p></div>
              <div><p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide"><Camera className="size-3" /> Camera</p><p className="mt-1 text-sm text-foreground">{e.cameraName || "—"}</p></div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div><p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide"><Layout className="size-3" /> Template</p><p className="mt-1 text-sm">{e.templateName || "—"}</p></div>
              <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Camera ID</p><p className="mt-1 text-sm font-mono">{e.cameraId || "—"}</p></div>
            </div>
            <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Template ID</p><p className="mt-1 text-sm font-mono">{e.templateId || "—"}</p></div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card className="border border-border/70 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg text-muted-foreground"><Hash className="size-5" /> Trạng thái</CardTitle></CardHeader>
          <CardContent><Badge variant={e.status === 1 ? "default" : "outline"}>{e.status === 1 ? "Hoạt động" : "Khóa"}</Badge></CardContent>
        </Card>
        <Card className="border border-border/70 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg"><Calendar className="size-5 text-primary" /> Thời gian</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2.5 text-sm"><div className="flex size-7 items-center justify-center rounded-md bg-muted"><Calendar className="size-3.5 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">Ngày tạo</p><p className="text-sm font-medium">{fmt(e.createdAt)}</p></div></div>
            <div className="flex items-center gap-2.5 text-sm"><div className="flex size-7 items-center justify-center rounded-md bg-muted"><Clock className="size-3.5 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">Cập nhật</p><p className="text-sm font-medium">{fmt(e.updatedAt)}</p></div></div>
          </CardContent>
        </Card>
      </div>
    </div>
  </PageSection>);
}
export default function ScreenDetailPage() { return <AdminPageGuard roles={["super_admin", "admin", "manager"]}><DetailInner /></AdminPageGuard>; }
