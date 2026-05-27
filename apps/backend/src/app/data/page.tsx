"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Badge } from "@ui/components/badge";
import { Separator } from "@ui/components/separator";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@ui/components/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { PageSection } from "@ui/components/layout";
import { TypographyH1, TypographyH2 } from "@ui/components/typography";
import { ADMIN_PAGE_TITLE_DOCUMENT_CLASS } from "@ui/lib/layout-shell";
import { cn } from "@ui/lib/utils";
import { readAdminSession } from "@/lib/auth-session";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { DEFAULT_API_URL } from "@workspace/api-client";
import {
  Database,
  Download,
  FileSpreadsheet,
  FileJson,
  Upload,
  Loader2,
  FolderDown,
  Check,
  Sparkles,
} from "lucide-react";

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "");
}

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  error?: string | null;
  data?: T;
};

function DataBackupPageInner() {
  const [exporting, setExporting] = useState<"json" | "excel" | null>(null);
  const [importing, setImporting] = useState<"json" | "excel" | null>(null);

  const dateStamp = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, "0")
    const d = String(now.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  const authHeaders = (): HeadersInit => {
    const headers: Record<string, string> = {};
    const uid = readAdminSession()?.id;
    if (uid != null) headers["X-User-Id"] = String(uid);
    return headers;
  };

  const downloadBlob = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const toastFetchError = async (res: Response): Promise<void> => {
    let msg = "";
    try {
      const json = (await res.json()) as ApiEnvelope<unknown>;
      msg =
        json.message?.trim() ||
        (typeof json.error === "string" ? json.error.trim() : "") ||
        "";
    } catch {
      const t = await res.text();
      msg = t.length > 280 ? `${t.slice(0, 280)}…` : t;
    }
    if (res.status === 401) {
      toast.error(
        "API từ chối: thiếu hoặc sai X-User-Id — hãy đăng nhập lại admin.",
      );
      return;
    }
    if (res.status === 403) {
      toast.error(
        msg || "Không đủ quyền export/import hệ thống cho tài khoản hiện tại.",
      );
      return;
    }
    toast.error(msg || `Lỗi ${res.status}`);
  };

  const exportJson = async (): Promise<void> => {
    setExporting("json");
    try {
      const res = await fetch(`${apiBase()}/admin/system/export`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        await toastFetchError(res);
        return;
      }
      const payload = (await res.json()) as ApiEnvelope<Record<string, unknown[]>>;
      if (!payload.success || !payload.data) {
        toast.error(payload.message || "API không trả dữ liệu export hợp lệ.");
        return;
      }

      const blob = new Blob([JSON.stringify(payload.data, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      downloadBlob(blob, `hub-system-export-${dateStamp()}.json`);
      toast.success(`Đã tải hub-system-export-${dateStamp()}.json.`);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Lỗi mạng — kiểm tra API đang chạy.",
      );
    } finally {
      setExporting(null);
    }
  };

  const exportExcel = async (): Promise<void> => {
    setExporting("excel");
    try {
      const res = await fetch(`${apiBase()}/admin/system/export/excel`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        await toastFetchError(res);
        return;
      }
      const blob = await res.blob();
      downloadBlob(blob, `hub-system-export-${dateStamp()}.xlsx`);
      toast.success(`Đã tải hub-system-export-${dateStamp()}.xlsx.`);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Lỗi mạng — kiểm tra API đang chạy.",
      );
    } finally {
      setExporting(null);
    }
  };

  const importJsonFile = async (file: File | null): Promise<void> => {
    if (!file) return;
    setImporting("json");
    try {
      const text = await file.text();
      let body: unknown;
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        toast.error("File không phải JSON hợp lệ.");
        return;
      }
      const res = await fetch(`${apiBase()}/admin/system/import`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        await toastFetchError(res);
        return;
      }
      const payload = (await res.json()) as ApiEnvelope<{
        success?: boolean;
        message?: string;
      }>;
      toast.success(
        payload.message ||
        payload.data?.message ||
        "Import JSON hoàn tất.",
      );
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Lỗi mạng — kiểm tra API đang chạy.",
      );
    } finally {
      setImporting(null);
    }
  };

  const importExcelFile = async (file: File | null): Promise<void> => {
    if (!file) return;
    setImporting("excel");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${apiBase()}/admin/system/import/excel`, {
        method: "POST",
        headers: authHeaders(),
        body: fd,
      });
      if (!res.ok) {
        await toastFetchError(res);
        return;
      }
      const payload = (await res.json()) as ApiEnvelope<{
        success?: boolean;
        message?: string;
      }>;
      toast.success(
        payload.message ||
        payload.data?.message ||
        "Import Excel hoàn tất.",
      );
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Lỗi mạng — kiểm tra API đang chạy.",
      );
    } finally {
      setImporting(null);
    }
  };

  const exportBusy = exporting !== null;

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      {/* Tiêu đề + bối cảnh ngay khi mở trang */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/20">
            <Database className="size-7" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <TypographyH1 className={ADMIN_PAGE_TITLE_DOCUMENT_CLASS}>
                Sao lưu &amp; phục hồi dữ liệu
              </TypographyH1>
              <Badge variant="secondary" className="font-normal">
                Admin
              </Badge>
            </div>
            <p className="text-muted-foreground text-pretty leading-relaxed">
              <span className="font-medium text-foreground">Bước 1:</span> chọn định dạng
              bên dưới và bấm nút xuất — file sẽ tải về máy.{" "}
            </p>

            <p className="text-muted-foreground text-pretty leading-relaxed">
              <span className="font-medium text-foreground">Bước 2 (tuỳ chọn):</span>{" "}
              dùng file JSON export từ chính hệ thống để import lại khi cần.
            </p>
          </div>
        </div>

        {readAdminSession() == null ? (
          <Alert variant="destructive" className="border-destructive/40">
            <AlertTitle>Chưa đăng nhập admin</AlertTitle>
            <AlertDescription>
              Export và import cần header{" "}
              <code className="rounded bg-muted px-1 text-xs">X-User-Id</code> — hãy đăng nhập
              tài khoản có quyền{" "}
              <code className="rounded bg-muted px-1 text-xs">settings:manage</code>{" "}
              hoặc{" "}
              <code className="rounded bg-muted px-1 text-xs">settings:import</code>.
            </AlertDescription>
          </Alert>
        ) : null}

        <Alert className="border-primary/25 bg-primary/[0.04]">
          <FolderDown className="size-4 text-primary" />
          <AlertTitle className="text-foreground">
            File tải về đi đâu?
          </AlertTitle>
          <AlertDescription className="text-muted-foreground space-y-1">
            <p>
              Trình duyệt thường lưu vào thư mục{" "}
              <strong className="text-foreground">Tải xuống</strong> (Downloads) với tên cố định{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                hub-system-export.json
              </code>
              . Nếu không thấy file, mở bảng tải xuống của trình duyệt (Ctrl+J / ⌘+J).
            </p>
          </AlertDescription>
        </Alert>
      </header>

      {/* Xuất — hai lựa chọn song song, dễ quét mắt */}
      <section className="space-y-4" aria-labelledby="export-heading">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" aria-hidden />
          <TypographyH2
            id="export-heading"
            className="text-lg font-semibold tracking-tight"
          >
            Xuất snapshot hiện tại
          </TypographyH2>
        </div>
        <p className="text-muted-foreground -mt-1 text-sm">
          Có thể xuất cùng snapshot hệ thống ở định dạng JSON hoặc Excel `.xlsx`.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* JSON */}
          <Card
            className={cn(
              "py-0 relative overflow-hidden border-2 transition-shadow",
              "border-border hover:border-primary/35 hover:shadow-md",
            )}
          >
            <div className="absolute right-3 top-3">
              <Badge variant="outline" className="font-mono text-xs">
                .json
              </Badge>
            </div>
            <CardHeader className="pb-2 pt-6">
              <div className="mb-3 flex size-12 items-center justify-center rounded-lg bg-sky-500/12 text-sky-600 dark:text-sky-400">
                <FileJson className="size-6" />
              </div>
              <CardTitle className="text-lg">JSON</CardTitle>
              <CardDescription className="text-pretty">
                Snapshot chuẩn theo contract `admin/system/export`, phù hợp sao lưu và import lại qua API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  Lấy trực tiếp từ API bảo trì hệ thống hiện có của HUB.
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  Phù hợp import lại qua `POST /api/admin/system/import`.
                </li>
              </ul>
              <Button
                type="button"
                className="h-11 w-full gap-2 text-base font-semibold"
                disabled={exportBusy}
                onClick={() => void exportJson()}
              >
                {exporting === "json" ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Đang tạo file…
                  </>
                ) : (
                  <>
                    <Download className="size-5" />
                    Xuất JSON
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Excel */}
          <Card
            className={cn(
              "pt-0 relative overflow-hidden border-2 transition-shadow",
              "border-border hover:border-primary/35 hover:shadow-md",
            )}
          >
            <div className="absolute right-3 top-3">
              <Badge variant="outline" className="font-mono text-xs">
                .xlsx
              </Badge>
            </div>
            <CardHeader className="pb-2 pt-6">
              <div className="mb-3 flex size-12 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="size-6" />
              </div>
              <CardTitle className="text-lg">Excel</CardTitle>
              <CardDescription className="text-pretty">
                Mỗi model/entity là một sheet, phù hợp kiểm tra nhanh và chỉnh dữ liệu trước khi import lại.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  Xuất workbook `.xlsx` từ cùng bundle dữ liệu của JSON export.
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  Mỗi bảng hiện tại của hệ thống được tách thành sheet tương ứng.
                </li>
              </ul>
              <Button
                type="button"
                variant="default"
                className="h-11 w-full gap-2 text-base font-semibold"
                disabled={exportBusy}
                onClick={() => void exportExcel()}
              >
                {exporting === "excel" ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Đang tạo workbook…
                  </>
                ) : (
                  <>
                    <Download className="size-5" />
                    Xuất Excel
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      <Card className="border-destructive/40 bg-destructive/[0.03]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <Upload className="size-5" />
            Import — ghi đè toàn bộ
          </CardTitle>
          <CardDescription className="text-pretty">
            Xóa dữ liệu các bảng đã đăng ký rồi nạp lại từ file. Chỉ dùng khi bạn đã sao lưu
            hoặc chấp nhận mất dữ liệu hiện tại.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-border bg-card p-4">
            <Label className="flex items-center gap-2 text-base font-medium">
              <FileJson className="size-4 text-sky-600" />
              Import JSON
            </Label>
            <p className="text-muted-foreground text-xs">
              Chọn file <code className="rounded bg-muted px-1">.json</code> đã xuất từ hệ thống.
            </p>
            <Input
              type="file"
              accept="application/json,.json"
              disabled={importing !== null}
              className="cursor-pointer file:mr-2 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/15"
              onChange={(e) =>
                void importJsonFile(e.target.files?.[0] ?? null).finally(() => {
                  e.target.value = "";
                })
              }
            />
            {importing === "json" && (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Đang import…
              </p>
            )}
          </div>
          <div className="space-y-2 rounded-lg border border-border bg-card p-4">
            <Label className="flex items-center gap-2 text-base font-medium">
              <FileSpreadsheet className="size-4 text-emerald-600" />
              Import Excel
            </Label>
            <p className="text-muted-foreground text-xs">
              Chọn file <code className="rounded bg-muted px-1">.xlsx</code> do hệ thống export ra để import lại.
            </p>
            <Input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              disabled={importing !== null}
              className="cursor-pointer file:mr-2 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/15"
              onChange={(e) =>
                void importExcelFile(e.target.files?.[0] ?? null).finally(() => {
                  e.target.value = "";
                })
              }
            />
            {importing === "excel" && (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Đang import…
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </PageSection>
  );
}

export default function DataBackupPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin"]}>
      <DataBackupPageInner />
    </AdminPageGuard>
  );
}
