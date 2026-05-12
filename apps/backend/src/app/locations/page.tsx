"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Building2,
  CheckCircle2,
  Download,
  ExternalLink,
  FilterX,
  Info,
  Loader2,
  Mail,
  MapPin,
  MapPinOff,
  Navigation,
  Phone,
  RefreshCw,
  Search,
  UserCircle,
} from "lucide-react";
import { Card } from "@ui/components/card";
import { PageSection } from "@ui/components/layout";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import type { User } from "@/lib/api";
import { useDealerUsers } from "@/hooks/queries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { downloadCsvFile } from "@/lib/export-csv";
import { downloadXlsxFile } from "@/lib/export-xlsx";
import { cn } from "@ui/lib/utils";
import {
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";

type DealerStatus = "Hoạt động" | "Chưa đủ thông tin" | "Ngưng";

function dealerStatus(u: User): DealerStatus {
  if (!u.isActive) return "Ngưng";
  const hasAddr = Boolean(u.address?.trim());
  const hasPhone = Boolean(u.phone?.trim());
  if (!hasAddr || !hasPhone) return "Chưa đủ thông tin";
  return "Hoạt động";
}

function statusBadgeClass(s: DealerStatus): string {
  switch (s) {
    case "Hoạt động":
      return "bg-success/15 text-success border-success/20";
    case "Chưa đủ thông tin":
      return "bg-warning/15 text-warning border-warning/20";
    default:
      return "bg-destructive/15 text-destructive border-destructive/20";
  }
}

function matchesQuery(u: User, q: string): boolean {
  if (!q.trim()) return true;
  const n = q.trim().toLowerCase();
  const hay = [
    u.fullName,
    u.email,
    u.phone ?? "",
    u.address ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(n);
}

export default function StoreLocationsPage() {
  const {
    data: dealers = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useDealerUsers();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = useMemo(
    () => dealers.filter((u) => matchesQuery(u, debouncedSearch)),
    [dealers, debouncedSearch],
  );

  const counts = useMemo(() => {
    let active = 0;
    let warn = 0;
    let inactive = 0;
    for (const u of dealers) {
      const s = dealerStatus(u);
      if (s === "Hoạt động") active += 1;
      else if (s === "Chưa đủ thông tin") warn += 1;
      else inactive += 1;
    }
    return { active, warn, inactive };
  }, [dealers]);

  const selected =
    filtered.find((u) => u.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (selectedId == null || !filtered.some((u) => u.id === selectedId)) {
      setSelectedId(filtered[0]!.id);
    }
  }, [filtered, selectedId]);

  const mapQuery = selected
    ? encodeURIComponent(
        [selected.address?.trim(), selected.fullName].filter(Boolean).join(" "),
      )
    : "";
  const mapIframeUrl = mapQuery
    ? `https://www.google.com/maps?q=${mapQuery}&output=embed`
    : "";
  const mapExternalUrl = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${mapQuery}`
    : "";

  const getDealerExportGrid = (): { headers: string[]; rows: string[][] } => {
    const headers = [
      "Tên hiển thị",
      "Email",
      "Số điện thoại",
      "Địa chỉ",
      "Trạng thái",
    ];
    const rows = dealers.map((u) => [
      u.fullName,
      u.email,
      u.phone ?? "",
      u.address ?? "",
      dealerStatus(u),
    ]);
    return { headers, rows };
  };

  const exportCsv = () => {
    const { headers, rows } = getDealerExportGrid();
    downloadCsvFile("dai-ly-cua-hang.csv", headers, rows);
  };

  const exportXlsx = () => {
    const { headers, rows } = getDealerExportGrid();
    void downloadXlsxFile(
      "dai-ly-cua-hang.xlsx",
      headers,
      rows,
      "Đại lý",
    );
  };

  return (
    <PageSection
      max="full"
      className="flex h-full min-h-[80vh] min-w-0 flex-col space-y-6"
    >
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            <Building2 className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
            Đại lý &amp; Cửa hàng
          </h1>
          <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
            Phân bố địa lý các tài khoản đại lý (role Khách / đại lý) trong hệ
            thống.
          </p>
          <p className="mt-2 flex gap-2 text-sm text-muted-foreground">
            <Info
              className="mt-0.5 size-4 shrink-0 text-primary/80"
              aria-hidden
            />
            <span>
              Tìm kiếm lọc trên <span className="font-semibold">toàn bộ danh sách</span>{" "}
              đã tải (debounce ngắn). Chọn một dòng để xem bản đồ bên phải.
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2 rounded-xl border-outline-variant px-4 font-semibold hover:bg-muted"
            onClick={() => void refetch()}
          >
            <RefreshCw
              className={cn("size-4", isFetching && "animate-spin")}
              aria-hidden
            />
            Làm mới
          </Button>
          <Badge className="gap-1.5 bg-success px-3 py-1 text-success-foreground hover:bg-success">
            <CheckCircle2 className="size-3.5" aria-hidden />
            Hoạt động: {counts.active}
          </Badge>
          <Badge className="gap-1.5 bg-warning px-3 py-1 text-warning-foreground hover:bg-warning">
            <AlertTriangle className="size-3.5" aria-hidden />
            Chưa đủ TT: {counts.warn}
          </Badge>
          <Badge className="gap-1.5 bg-destructive px-3 py-1 text-destructive-foreground hover:bg-destructive">
            <Ban className="size-3.5" aria-hidden />
            Ngưng: {counts.inactive}
          </Badge>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-2 rounded-lg"
              disabled={dealers.length === 0 || isLoading}
              onClick={exportCsv}
              title="CSV: cột ; + UTF-16 LE"
            >
              <Download className="size-4" aria-hidden />
              CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-2 rounded-lg"
              disabled={dealers.length === 0 || isLoading}
              onClick={exportXlsx}
              title="Excel: cột rộng theo nội dung"
            >
              <Download className="size-4" aria-hidden />
              Excel
            </Button>
          </div>
        </div>
      </div>

      {isError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 py-12 text-center">
          <AlertCircle className="mx-auto mb-2 size-10 text-destructive" aria-hidden />
          <p className="text-lg font-bold text-destructive">
            Không tải được danh sách đại lý
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Lỗi không xác định"}
          </p>
        </div>
      ) : null}

      <div className="grid min-h-0 flex-grow grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col overflow-hidden border-border py-0 shadow-md lg:col-span-1">
          <div className="border-b border-border bg-muted/5 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="search"
                  placeholder="Tìm theo tên, email, SĐT, địa chỉ…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 rounded-lg border-border bg-background pl-10 pr-3"
                  autoComplete="off"
                />
              </div>
              {search.trim() ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 shrink-0 gap-1.5 rounded-lg"
                  onClick={() => setSearch("")}
                >
                  <FilterX className="size-4" aria-hidden />
                  Xóa lọc
                </Button>
              ) : null}
            </div>
          </div>
          <div className="max-h-[600px] flex-1 space-y-2 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
                <span className="text-sm font-medium">Đang tải…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
                <MapPinOff className="size-10 opacity-40" aria-hidden />
                <p>
                  {dealers.length === 0
                    ? "Chưa có tài khoản đại lý (role Khách / đại lý)."
                    : "Không có kết quả khớp bộ lọc."}
                </p>
              </div>
            ) : (
              filtered.map((u) => {
                const st = dealerStatus(u);
                return (
                  <Button
                    key={u.id}
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedId(u.id)}
                    className={cn(
                      "h-auto w-full justify-start rounded-xl border p-4 text-left font-normal transition-all duration-200",
                      selected?.id === u.id
                        ? "border-primary bg-primary/5 shadow-sm hover:bg-primary/5"
                        : "border-transparent hover:bg-muted/50",
                    )}
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2 font-bold text-foreground">
                        <UserCircle
                          className="size-4 shrink-0 text-primary/80"
                          aria-hidden
                        />
                        <span className="truncate">{u.fullName}</span>
                      </span>
                      <Badge
                        variant="outline"
                        className={cn("shrink-0 gap-1", statusBadgeClass(st))}
                      >
                        {st === "Hoạt động" ? (
                          <CheckCircle2 className="size-3" aria-hidden />
                        ) : st === "Chưa đủ thông tin" ? (
                          <AlertTriangle className="size-3" aria-hidden />
                        ) : (
                          <Ban className="size-3" aria-hidden />
                        )}
                        {st}
                      </Badge>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      <p className="line-clamp-2">
                        {u.address?.trim() || "— (chưa có địa chỉ)"}
                      </p>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 truncate pl-0 text-xs text-muted-foreground">
                      <Mail className="size-3 shrink-0 opacity-70" aria-hidden />
                      <span className="truncate">{u.email}</span>
                    </p>
                    {u.phone?.trim() ? (
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                        <Phone className="size-3 shrink-0 opacity-70" aria-hidden />
                        <span className="truncate tabular-nums">{u.phone}</span>
                      </p>
                    ) : null}
                  </Button>
                );
              })
            )}
          </div>
        </Card>

        <Card className="relative flex min-h-[500px] flex-col overflow-hidden border-border p-0 shadow-md lg:col-span-2">
          <div className="relative min-h-[400px] w-full flex-grow bg-muted/10">
            {selected && mapIframeUrl ? (
              <iframe
                title="Google Map cửa hàng"
                src={mapIframeUrl}
                className="absolute inset-0 h-full min-h-[400px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
                <MapPinOff className="size-10 opacity-50" aria-hidden />
                <p>
                  Chọn một đại lý có địa chỉ để xem bản đồ, hoặc thêm địa chỉ trong
                  hồ sơ tài khoản.
                </p>
              </div>
            )}

            {selected ? (
              <div className="pointer-events-none absolute left-4 top-4 hidden w-64 rounded-lg border border-border bg-background/90 p-4 shadow-lg backdrop-blur-md sm:block">
                <h4 className="mb-2 flex items-center gap-2 font-bold">
                  <Navigation className="size-4 text-primary" aria-hidden />
                  Thông tin vị trí
                </h4>
                <div className="space-y-1">
                  <p className="text-sm font-bold">{selected.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {selected.address?.trim() || "Chưa có địa chỉ"}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col items-start justify-between gap-3 border-t border-border bg-card p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Navigation className="size-4 shrink-0 text-primary" aria-hidden />
              <span>
                {selected
                  ? `Đang hiển thị: ${selected.fullName}`
                  : "Chưa chọn đại lý"}
              </span>
            </div>
            {mapExternalUrl ? (
              <a href={mapExternalUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="gap-2 rounded-lg">
                  <ExternalLink className="size-4" aria-hidden />
                  Mở trong Google Maps
                </Button>
              </a>
            ) : null}
          </div>
        </Card>
      </div>
    </PageSection>
  );
}
