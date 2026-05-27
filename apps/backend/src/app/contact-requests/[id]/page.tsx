"use client";

import { useParams, useRouter } from "next/navigation";
import { useContactRequestDetail } from "@/hooks/queries";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import {
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
} from "@ui/lib/layout-shell";
import { TypographyH1, TypographyH3 } from "@ui/components/typography";
import {
  FileText,
  Mail,
  Phone,
  User,
  CalendarClock,
  Pencil,
  CircleDot,
  CircleCheck,
  AlertCircle,
  UserCircle,
  MapPin,
  BookOpen,
  GraduationCap,
  Bell,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { formatDateTime } from "@workspace/api-client";
import type { ContactRequest } from "../_component/types";
import { CONTACT_REQUEST_STATUS_LABELS } from "../_component/types";
import { formatPhoneNumber } from "../_component/utils";
import { cn } from "@ui/lib/utils";

function ContactRequestDetailPageInner() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const contactQuery = useContactRequestDetail(contactId);
  const contact = contactQuery.data as ContactRequest | undefined;

  if (contactQuery.isLoading || !contact) {
    return (
      <PageSection max="full" className="min-w-0 space-y-6">
        <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
          <FileText className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
          Chi tiết yêu cầu liên hệ
        </TypographyH1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Đang tải...</p>
          </CardContent>
        </Card>
      </PageSection>
    );
  }

  // Helper functions for status badges
  const getStatusConfig = (status: string) => {
    const configs = {
      new: {
        className: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400",
      },
      "in-progress": {
        className: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400",
      },
      resolved: {
        className: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400",
      },
      archived: {
        className: "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-950/30 dark:border-gray-800 dark:text-gray-400",
      },
    };
    return configs[status.toLowerCase() as keyof typeof configs] || configs.archived;
  };

  const getPriorityConfig = (priority: string) => {
    const configs = {
      HIGH: {
        label: "Cao",
        className: "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400",
        icon: AlertCircle,
      },
      MEDIUM: {
        label: "Trung bình",
        className: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400",
        icon: CircleDot,
      },
      LOW: {
        label: "Thấp",
        className: "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-950/30 dark:border-gray-800 dark:text-gray-400",
        icon: CircleDot,
      },
    };
    return configs[priority as keyof typeof configs] || configs.MEDIUM;
  };

  // Parse structured content (key-value pairs)
  const parseStructuredContent = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    const structured: Array<{ key: string; value: string; icon?: LucideIcon }> = [];
    let messageContent = '';

    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        const iconMap: Record<string, LucideIcon> = {
          'Địa chỉ': MapPin,
          'Chương trình': BookOpen,
          'Ngành': GraduationCap,
          'Đăng ký nhận thông tin tuyển sinh': Bell,
          'Đăng ký tư vấn': Bell,
          'Nội dung': MessageSquare,
        };
        structured.push({
          key: key.trim(),
          value: value.trim(),
          icon: iconMap[key.trim()] || undefined,
        });
      } else {
        messageContent += line + '\n';
      }
    }

    return { structured, messageContent: messageContent.trim() };
  };

  const { structured, messageContent } = parseStructuredContent(contact.content || contact.message || "");

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
          <FileText className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
          Chi tiết yêu cầu liên hệ
        </TypographyH1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => router.push(`/contact-requests/${contactId}/edit`)}
          >
            <Pencil className="size-4" aria-hidden />
            Chỉnh sửa
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 pb-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin liên hệ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted-foreground">Tên</p>
                  <p className="text-sm font-medium">{contact.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted-foreground">Email</p>
                  <p className="font-mono text-sm">{contact.email}</p>
                </div>
              </div>
              {contact.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted-foreground">SĐT</p>
                    <p className="font-mono text-sm">{formatPhoneNumber(contact.phone)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trạng thái xử lý</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Trạng thái</p>
                  <Badge
                    variant="outline"
                    className={cn("mt-1.5 font-medium", getStatusConfig(contact.status).className)}
                  >
                    {CONTACT_REQUEST_STATUS_LABELS[contact.status.toLowerCase() as keyof typeof CONTACT_REQUEST_STATUS_LABELS] || contact.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Đã đọc</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {contact.isRead ? (
                      <>
                        <CircleCheck className="size-4 text-emerald-600" aria-hidden />
                        <span className="text-sm font-medium text-emerald-600">Đã đọc</span>
                      </>
                    ) : (
                      <>
                        <CircleDot className="size-4 text-muted-foreground" aria-hidden />
                        <span className="text-sm text-muted-foreground">Chưa đọc</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs font-semibold text-muted-foreground">Ưu tiên</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  {(() => {
                    const config = getPriorityConfig(contact.priority || "MEDIUM");
                    const PriorityIcon = config.icon;
                    return (
                      <Badge
                        variant="outline"
                        className={cn("gap-1.5 font-medium", config.className)}
                      >
                        <PriorityIcon className="size-3" aria-hidden />
                        {config.label}
                      </Badge>
                    );
                  })()}
                </div>
              </div>
              {contact.assignedToName && (
                <div className="flex items-start gap-3 pt-2 border-t border-border/50">
                  <UserCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted-foreground">Người phụ trách</p>
                    <p className="text-sm font-medium">{contact.assignedToName}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thời gian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted-foreground">Tạo lúc</p>
                  <p className="text-sm">{formatDateTime(contact.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted-foreground">Cập nhật lần cuối</p>
                  <p className="text-sm">{formatDateTime(contact.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Nội dung yêu cầu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Tiêu đề</p>
              <TypographyH3 className="text-base font-semibold text-foreground">
                {contact.subject}
              </TypographyH3>
            </div>
            {structured.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2">
                {structured.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
                      {Icon && <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-muted-foreground">{item.key}</p>
                        <p className="text-sm font-medium">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {messageContent && (
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Nội dung</p>
                <p className="text-sm whitespace-pre-wrap bg-muted/30 rounded-lg p-4">
                  {messageContent}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageSection>
  );
}

export default function ContactRequestDetailPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin"]}>
      <ContactRequestDetailPageInner />
    </AdminPageGuard>
  );
}
