"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { LexicalEditor } from "@thangph2146/lexical-editor";
import { Loader2, ArrowLeft, Pencil, Calendar, Clock, MapPin, Building2, Users, Monitor, CheckSquare, FileText, UserCheck, ClipboardList, Mic } from "lucide-react";
import { PageSection } from "@ui/components/layout";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { useAuth } from "@/providers/auth-provider";
import { PERMISSION_CODES, canUserAccess } from "@workspace/api-client";
import { api } from "@/lib/api";
import { useEventDetailQuery, useEventRegistrationsQuery, useEventCheckinsQuery, useEventSpeakersQuery } from "../_component";
import { TypographyH1 } from "@ui/components/typography";
import { ADMIN_PAGE_SUBTITLE_CLASS, ADMIN_PAGE_TITLE_PRIMARY_CLASS } from "@ui/lib/layout-shell";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}

function EventDetailInner() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const canUpdate = user ? canUserAccess(user, PERMISSION_CODES.EVENTS_UPDATE) : false;
  const { data: entity, isLoading, isError } = useEventDetailQuery(api, id);

  useEffect(() => { if (isError) { toast.error("Không tải được sự kiện"); router.push("/events"); } }, [isError, router]);

  if (isLoading) return <PageSection max="full" className="min-w-0 flex items-center justify-center py-24"><Loader2 className="size-8 animate-spin text-muted-foreground" /></PageSection>;
  if (!entity) return null;

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" className="gap-1" onClick={() => router.push("/events")}>
            <ArrowLeft className="size-4" /> Quay lại
          </Button>
          <div>
            <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>{entity.title}</TypographyH1>
            <p className={ADMIN_PAGE_SUBTITLE_CLASS}>Sự kiện</p>
          </div>
        </div>
        {canUpdate && (
        <Button type="button" variant="default" className="gap-2 rounded-lg px-5 font-semibold" onClick={() => router.push(`/events/${id}/edit`)}>
          <Pencil className="size-4" /> Chỉnh sửa
        </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 my-6">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg"><Calendar className="size-5 text-primary" /> Thông tin sự kiện</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {entity.description && (
                <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mô tả</p><p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{entity.description}</p></div>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide"><Calendar className="size-3" /> Bắt đầu</p>
                  <p className="mt-1 text-sm text-foreground">{formatDateTime(entity.startDate)}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide"><Clock className="size-3" /> Kết thúc</p>
                  <p className="mt-1 text-sm text-foreground">{formatDateTime(entity.endDate)}</p>
                </div>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide"><Building2 className="size-3" /> Đơn vị tổ chức</p>
                <p className="mt-1 text-sm text-foreground">{entity.organizer || "—"}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide"><MapPin className="size-3" /> Địa điểm</p>
                  <p className="mt-1 text-sm text-foreground">{entity.location || "—"}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Địa chỉ</p>
                  <p className="mt-1 text-sm text-foreground">{entity.address || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {entity.content ? (
            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg"><FileText className="size-5 text-primary" /> Nội dung</CardTitle>
              </CardHeader>
              <CardContent>
                <LexicalEditor value={entity.content} readOnly className="max-w-full" />
              </CardContent>
            </Card>
          ) : null}

          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg"><Clock className="size-5 text-primary" /> Check-in & Đăng ký</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Check-in từ</p><p className="mt-1 text-sm">{formatDateTime(entity.checkinStart)}</p></div>
                <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Check-in đến</p><p className="mt-1 text-sm">{formatDateTime(entity.checkinEnd)}</p></div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Đăng ký từ</p><p className="mt-1 text-sm">{formatDateTime(entity.registrationStart)}</p></div>
                <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Đăng ký đến</p><p className="mt-1 text-sm">{formatDateTime(entity.registrationEnd)}</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground"><Monitor className="size-5" /> Hình thức & Trạng thái</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Hình thức</p>
                <Badge variant={entity.format === 1 ? "secondary" : entity.format === 2 ? "outline" : "default"}>
                  {entity.format === 1 ? "Online" : entity.format === 2 ? "Hybrid" : "Offline"}
                </Badge>
              </div>
              <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Trạng thái</p>
                {entity.status === 1 ? <Badge variant="default">Hoạt động</Badge> : <Badge variant="outline">Khóa</Badge>}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg"><Users className="size-5 text-primary" /> Thống kê</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/30 p-3 text-center"><p className="text-2xl font-bold text-primary">{entity.totalRegistrations}</p><p className="text-xs text-muted-foreground">Đăng ký</p></div>
                <div className="rounded-lg bg-muted/30 p-3 text-center"><p className="text-2xl font-bold text-green-600">{entity.totalCheckins}</p><p className="text-xs text-muted-foreground">Check-in</p></div>
                <div className="rounded-lg bg-muted/30 p-3 text-center"><p className="text-2xl font-bold text-amber-600">{entity.totalCheckouts}</p><p className="text-xs text-muted-foreground">Check-out</p></div>
                <div className="rounded-lg bg-muted/30 p-3 text-center"><p className="text-2xl font-bold text-muted-foreground">{entity.maxParticipants || "∞"}</p><p className="text-xs text-muted-foreground">Tối đa</p></div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm"><CheckSquare className="size-4" /> {entity.allowCheckin ? "Cho phép check-in" : "Không check-in"}</div>
                <div className="flex items-center gap-2 text-sm"><CheckSquare className="size-4" /> {entity.allowCheckout ? "Cho phép check-out" : "Không check-out"}</div>
                <div className="flex items-center gap-2 text-sm"><CheckSquare className="size-4" /> {entity.requireFaceId ? "Yêu cầu Face ID" : "Không yêu cầu Face ID"}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg"><Calendar className="size-5 text-primary" /> Thời gian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2.5 text-sm">
                <div className="flex size-7 items-center justify-center rounded-md bg-muted"><Calendar className="size-3.5 text-muted-foreground" /></div>
                <div><p className="text-xs text-muted-foreground">Ngày tạo</p><p className="text-sm font-medium">{formatDateTime(entity.createdAt)}</p></div>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <div className="flex size-7 items-center justify-center rounded-md bg-muted"><Clock className="size-3.5 text-muted-foreground" /></div>
                <div><p className="text-xs text-muted-foreground">Cập nhật lần cuối</p><p className="text-sm font-medium">{formatDateTime(entity.updatedAt)}</p></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="registrations" className="mt-8">
        <TabsList>
          <TabsTrigger value="registrations" className="gap-1.5"><ClipboardList className="size-4" /> Đăng ký</TabsTrigger>
          <TabsTrigger value="checkins" className="gap-1.5"><UserCheck className="size-4" /> Check-in</TabsTrigger>
          <TabsTrigger value="speakers" className="gap-1.5"><Mic className="size-4" /> Diễn giả</TabsTrigger>
        </TabsList>
        <TabsContent value="registrations" className="mt-4">
          <RegistrationsTab eventId={id} />
        </TabsContent>
        <TabsContent value="checkins" className="mt-4">
          <CheckinsTab eventId={id} />
        </TabsContent>
        <TabsContent value="speakers" className="mt-4">
          <SpeakersTab eventId={id} />
        </TabsContent>
      </Tabs>
    </PageSection>
  );
}

function RegistrationsTab({ eventId }: { eventId: string }) {
  const { data: registrations, isLoading } = useEventRegistrationsQuery(api, eventId);
  if (isLoading) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Đang tải...</div>;
  if (!registrations?.length) return <p className="text-sm text-muted-foreground py-4">Chưa có đăng ký nào.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-border/70">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr className="border-b">
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Họ tên</th>
            <th className="px-4 py-3 font-medium">Điện thoại</th>
            <th className="px-4 py-3 font-medium">Trạng thái</th>
            <th className="px-4 py-3 font-medium">Check-in</th>
            <th className="px-4 py-3 font-medium">Điểm danh</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((r: Record<string, unknown>) => (
            <tr key={r.id as string} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3">{r.email as string}</td>
              <td className="px-4 py-3 font-medium">{r.fullName as string}</td>
              <td className="px-4 py-3">{r.phone as string || "—"}</td>
              <td className="px-4 py-3"><Badge variant={r.status === 1 ? "default" : r.status === 2 ? "outline" : "secondary"}>{r.status === 1 ? "Đã xác nhận" : r.status === 2 ? "Đã hủy" : "Chờ xử lý"}</Badge></td>
              <td className="px-4 py-3">{r.hasCheckin ? "✅" : "—"}</td>
              <td className="px-4 py-3">
                {r.attendanceStatus === 2 ? "Có mặt" : r.attendanceStatus === 1 ? "Một phần" : "Vắng"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CheckinsTab({ eventId }: { eventId: string }) {
  const { data: checkins, isLoading } = useEventCheckinsQuery(api, eventId);
  if (isLoading) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Đang tải...</div>;
  if (!checkins?.length) return <p className="text-sm text-muted-foreground py-4">Chưa có check-in nào.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-border/70">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr className="border-b">
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Họ tên</th>
            <th className="px-4 py-3 font-medium">Thời gian</th>
            <th className="px-4 py-3 font-medium">Phương thức</th>
            <th className="px-4 py-3 font-medium">Face ID</th>
          </tr>
        </thead>
        <tbody>
          {checkins.map((c: Record<string, unknown>) => (
            <tr key={c.id as string} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3">{c.email as string}</td>
              <td className="px-4 py-3 font-medium">{c.fullName as string}</td>
              <td className="px-4 py-3">{formatDateTime(c.checkinTime as string)}</td>
              <td className="px-4 py-3">
                {c.checkinType === 0 ? "Face ID" : c.checkinType === 2 ? "QR Code" : c.checkinType === 3 ? "Online" : "Thủ công"}
              </td>
              <td className="px-4 py-3">{c.faceVerified ? "✅" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SpeakersTab({ eventId }: { eventId: string }) {
  const { data: speakers, isLoading } = useEventSpeakersQuery(api, eventId);
  if (isLoading) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Đang tải...</div>;
  if (!speakers?.length) return <p className="text-sm text-muted-foreground py-4">Chưa có diễn giả nào.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-border/70">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr className="border-b">
            <th className="px-4 py-3 font-medium">Diễn giả</th>
            <th className="px-4 py-3 font-medium">Chức danh</th>
            <th className="px-4 py-3 font-medium">Vai trò</th>
            <th className="px-4 py-3 font-medium">Chủ đề</th>
            <th className="px-4 py-3 font-medium">Thời lượng</th>
          </tr>
        </thead>
        <tbody>
          {speakers.map((s: Record<string, unknown>) => (
            <tr key={s.id as string} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{(s.speakerName as string) || "—"}</td>
              <td className="px-4 py-3">{(s.speakerTitle as string) || "—"}</td>
              <td className="px-4 py-3">{(s.role as string) || "—"}</td>
              <td className="px-4 py-3">{(s.presentationTitle as string) || "—"}</td>
              <td className="px-4 py-3">{s.duration ? `${s.duration as number} phút` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function EventDetailPage() {
  return <AdminPageGuard roles={["super_admin", "admin", "manager"]}><EventDetailInner /></AdminPageGuard>;
}
