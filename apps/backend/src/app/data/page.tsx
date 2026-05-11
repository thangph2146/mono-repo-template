"use client";

import { useEffect, useState } from "react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@ui/components/collapsible";
import { cn } from "@ui/lib/utils";
import { readAdminSession } from "@/lib/auth-session";
import { DEFAULT_API_URL } from "@workspace/api-client";
import {
  Database,
  Download,
  FileSpreadsheet,
  FileJson,
  Upload,
  KeyRound,
  Loader2,
  FolderDown,
  Check,
  ChevronDown,
  Sparkles,
} from "lucide-react";

const SECRET_KEY = "storesync_backup_admin_secret";

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "");
}

export default function DataBackupPage() {
  const [secret, setSecret] = useState("");
  const [exporting, setExporting] = useState<"json" | "excel" | null>(null);
  const [importing, setImporting] = useState<"json" | "excel" | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    try {
      setSecret(sessionStorage.getItem(SECRET_KEY) ?? "");
    } catch {
      setSecret("");
    }
  }, []);

  const persistSecret = (): void => {
    try {
      sessionStorage.setItem(SECRET_KEY, secret.trim());
      toast.success("Đã lưu mật khẩu trong trình duyệt (session).");
    } catch {
      toast.error("Không thể lưu sessionStorage.");
    }
  };

  const authHeaders = (): HeadersInit => {
    const headers: Record<string, string> = {};
    const t = secret.trim();
    if (t) headers["X-Backup-Secret"] = t;
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
    const t = await res.text();
    const msg = t.length > 280 ? `${t.slice(0, 280)}…` : t;
    if (res.status === 401) {
      toast.error(
        "API từ chối: thiếu hoặc sai X-User-Id — hãy đăng nhập lại admin.",
      );
      return;
    }
    if (res.status === 403) {
      toast.error(
        msg ||
          "Không đủ quyền (data.maintenance hoặc X-Backup-Secret không khớp).",
      );
      return;
    }
    toast.error(msg || `Lỗi ${res.status}`);
  };

  const exportJson = async (): Promise<void> => {
    setExporting("json");
    try {
      const res = await fetch(`${apiBase()}/data-maintenance/export`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        await toastFetchError(res);
        return;
      }
      const blob = await res.blob();
      downloadBlob(blob, "storesync-backup.json");
      toast.success("Đã tải storesync-backup.json — kiểm tra thư mục Tải xuống.");
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
      const res = await fetch(`${apiBase()}/data-maintenance/export/excel`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        await toastFetchError(res);
        return;
      }
      const blob = await res.blob();
      downloadBlob(blob, "storesync-backup.xlsx");
      toast.success("Đã tải storesync-backup.xlsx — kiểm tra thư mục Tải xuống.");
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
      const res = await fetch(`${apiBase()}/data-maintenance/import`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        await toastFetchError(res);
        return;
      }
      const data = (await res.json()) as { inserted: number };
      toast.success(`Import JSON xong — ${data.inserted} bản ghi.`);
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
      const res = await fetch(`${apiBase()}/data-maintenance/import/excel`, {
        method: "POST",
        headers: authHeaders(),
        body: fd,
      });
      if (!res.ok) {
        await toastFetchError(res);
        return;
      }
      const data = (await res.json()) as { inserted: number };
      toast.success(`Import Excel xong — ${data.inserted} bản ghi.`);
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
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      {/* Tiêu đề + bối cảnh ngay khi mở trang */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
            <Database className="size-7" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Sao lưu &amp; phục hồi dữ liệu
              </h1>
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
              mở khối &quot;Cài đặt nâng cao&quot; nếu API yêu cầu mật khẩu.
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
              <code className="rounded bg-muted px-1 text-xs">data.maintenance</code>.
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
                storesync-backup.json
              </code>{" "}
              hoặc{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                storesync-backup.xlsx
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
          <h2 id="export-heading" className="text-lg font-semibold tracking-tight">
            Xuất snapshot hiện tại
          </h2>
        </div>
        <p className="text-muted-foreground -mt-1 text-sm">
          Hai định dạng cùng nội dung nguồn; chọn theo công cụ bạn dùng (script / Excel).
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
              <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-sky-500/12 text-sky-600 dark:text-sky-400">
                <FileJson className="size-6" />
              </div>
              <CardTitle className="text-lg">JSON</CardTitle>
              <CardDescription className="text-pretty">
                Một file duy nhất, dễ tích hợp CI/CD và script phục hồi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  Cấu trúc theo metadata ORM (không cấu hình tay từng cột).
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  Phù hợp import lại qua API JSON.
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
              <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="size-6" />
              </div>
              <CardTitle className="text-lg">Excel</CardTitle>
              <CardDescription className="text-pretty">
                Nhiều sheet — mỗi entity một sheet, mở trực tiếp bằng Excel / LibreOffice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  Có sheet metadata ẩn + dữ liệu từng bảng.
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  Phù hợp xem nhanh, chỉnh sửa thủ công rồi import Excel.
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

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <Card className="py-0">
          <CollapsibleTrigger
            className={cn(
              "flex w-full items-center justify-between gap-3 p-4 text-left",
              "rounded-none border-0 bg-transparent hover:bg-muted/50",
              "cursor-pointer font-semibold text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            <span className="flex items-center gap-2">
              <KeyRound className="size-5 shrink-0 text-primary" />
              Cài đặt nâng cao — X-Backup-Secret (tuỳ chọn)
            </span>
            <ChevronDown
              className={cn(
                "size-5 shrink-0 text-muted-foreground transition-transform",
                advancedOpen && "rotate-180",
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="border-t pt-4 space-y-3">
              <p className="text-muted-foreground text-sm">
                Chỉ cần khi API đặt biến{" "}
                <code className="rounded bg-muted px-1 text-xs">BACKUP_IMPORT_SECRET</code>.
                Giá trị gửi qua header{" "}
                <code className="rounded bg-muted px-1 text-xs">X-Backup-Secret</code>.
              </p>
              <div className="space-y-2">
                <Label htmlFor="backup-secret">Mật khẩu</Label>
                <Input
                  id="backup-secret"
                  type="password"
                  autoComplete="off"
                  placeholder="Để trống nếu API không bật secret"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                />
              </div>
              <Button type="button" variant="secondary" onClick={persistSecret}>
                Lưu vào trình duyệt (session)
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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
          <div className="space-y-2 rounded-xl border border-border bg-card p-4">
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
          <div className="space-y-2 rounded-xl border border-border bg-card p-4">
            <Label className="flex items-center gap-2 text-base font-medium">
              <FileSpreadsheet className="size-4 text-emerald-600" />
              Import Excel
            </Label>
            <p className="text-muted-foreground text-xs">
              Chọn file <code className="rounded bg-muted px-1">.xlsx</code> do export Excel tạo.
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
    </div>
  );
}
