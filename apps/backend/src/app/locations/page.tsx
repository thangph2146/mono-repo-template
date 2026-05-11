"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  MapPin,
  ExternalLink,
  Navigation,
  Download,
  Loader2,
} from "lucide-react";
import { Card } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import type { User } from "@/lib/api";
import { useDealerUsers } from "@/hooks/queries";
import { downloadCsvFile } from "@/lib/export-csv";
import { downloadXlsxFile } from "@/lib/export-xlsx";

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
  const { data: dealers = [], isLoading, isError, error } = useDealerUsers();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = useMemo(
    () => dealers.filter((u) => matchesQuery(u, search)),
    [dealers, search],
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
    <div className="space-y-6 flex flex-col h-full min-h-[80vh]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Đại lý &amp; Cửa hàng
          </h1>
          <p className="text-muted-foreground">
            Phân bố địa lý các tài khoản đại lý (role Khách / đại lý) trong hệ
            thống.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-success text-success-foreground hover:bg-success">
            Hoạt động: {counts.active}
          </Badge>
          <Badge className="bg-warning text-warning-foreground hover:bg-warning">
            Chưa đủ TT: {counts.warn}
          </Badge>
          <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive">
            Ngưng: {counts.inactive}
          </Badge>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={dealers.length === 0 || isLoading}
              onClick={exportCsv}
              title="CSV: cột ; + UTF-16 LE"
            >
              <Download className="size-4" />
              CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={dealers.length === 0 || isLoading}
              onClick={exportXlsx}
              title="Excel: cột rộng theo nội dung"
            >
              <Download className="size-4" />
              Excel
            </Button>
          </div>
        </div>
      </div>

      {isError ? (
        <Card className="p-6 border-destructive/30 text-destructive">
          Không tải được danh sách đại lý.
          {error instanceof Error ? ` ${error.message}` : ""}
        </Card>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
        <Card className="py-0 lg:col-span-1 border-border shadow-md overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-muted/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm theo tên, email, SĐT, địa chỉ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[600px]">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                Đang tải…
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10 px-2">
                {dealers.length === 0
                  ? "Chưa có tài khoản đại lý (role Khách / đại lý)."
                  : "Không có kết quả khớp bộ lọc."}
              </p>
            ) : (
              filtered.map((u) => {
                const st = dealerStatus(u);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedId(u.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      selected?.id === u.id
                        ? "bg-primary/5 border-primary shadow-sm"
                        : "border-transparent hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h3 className="font-bold text-foreground">{u.fullName}</h3>
                      <Badge
                        variant="outline"
                        className={`shrink-0 ${statusBadgeClass(st)}`}
                      >
                        {st}
                      </Badge>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="size-3.5 mt-0.5 shrink-0" />
                      <p className="line-clamp-2">
                        {u.address?.trim() || "— (chưa có địa chỉ)"}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate pl-5">
                      {u.email}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        <Card className="p-0 lg:col-span-2 border-border shadow-md overflow-hidden flex flex-col relative min-h-[500px]">
          <div className="flex-grow w-full relative bg-muted/10 min-h-[400px]">
            {selected && mapIframeUrl ? (
              <iframe
                title="Google Map cửa hàng"
                src={mapIframeUrl}
                className="w-full h-full min-h-[400px] border-0 absolute inset-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm p-6 text-center">
                Chọn một đại lý có địa chỉ để xem bản đồ, hoặc thêm địa chỉ trong
                hồ sơ tài khoản.
              </div>
            )}

            {selected ? (
              <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-md p-4 rounded-lg shadow-lg border border-border w-64 pointer-events-none sm:block hidden">
                <h4 className="font-bold mb-2">Thông tin vị trí</h4>
                <div className="space-y-1">
                  <p className="text-sm font-bold">{selected.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {selected.address?.trim() || "Chưa có địa chỉ"}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="p-4 bg-surface border-t border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Navigation className="size-4 text-primary shrink-0" />
              <span>
                {selected
                  ? `Đang hiển thị: ${selected.fullName}`
                  : "Chưa chọn đại lý"}
              </span>
            </div>
            {mapExternalUrl ? (
              <a href={mapExternalUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="size-4" />
                  Mở trong Google Maps
                </Button>
              </a>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
