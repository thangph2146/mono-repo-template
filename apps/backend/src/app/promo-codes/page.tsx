"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import { Badge } from "@ui/components/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@ui/components/alert-dialog";
import {
  AlertCircle,
  CalendarDays,
  FilterX,
  Info,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  TicketPercent,
  Trash2,
  X,
} from "lucide-react";
import { Calendar } from "@ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ui/components/popover";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminTablePaginationFooter } from "@/components/admin-table-pagination-footer";
import {
  useCreatePromoCode,
  useDeletePromoCode,
  usePromoCodesAdmin,
  useUpdatePromoCode,
} from "@/hooks/queries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuth } from "@/providers/auth-provider";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
import type { PromoCode, PromoDiscountKind } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { cn } from "@ui/lib/utils";

type FormState = {
  code: string;
  label: string;
  discountKind: PromoDiscountKind;
  discountFixed: string;
  discountPercent: string;
  discountCapVnd: string;
  minOrderSubtotal: string;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  usageLimit: string;
};

const emptyForm = (): FormState => ({
  code: "",
  label: "",
  discountKind: "fixed",
  discountFixed: "50000",
  discountPercent: "0",
  discountCapVnd: "",
  minOrderSubtotal: "0",
  isActive: true,
  validFrom: "",
  validUntil: "",
  usageLimit: "",
});

function fromRow(row: PromoCode): FormState {
  return {
    code: row.code,
    label: row.label,
    discountKind: row.discountKind,
    discountFixed: String(row.discountFixed),
    discountPercent: String(row.discountPercent),
    discountCapVnd:
      row.discountCapVnd != null ? String(row.discountCapVnd) : "",
    minOrderSubtotal: String(row.minOrderSubtotal),
    isActive: row.isActive,
    validFrom: row.validFrom ? row.validFrom.slice(0, 10) : "",
    validUntil: row.validUntil ? row.validUntil.slice(0, 10) : "",
    usageLimit: row.usageLimit != null ? String(row.usageLimit) : "",
  };
}

function parseIsoDateOnly(iso: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return undefined;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== mo ||
    dt.getDate() !== d
  ) {
    return undefined;
  }
  return dt;
}

function toIsoDateOnly(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function utcDayStart(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

/** dd/mm/yyyy từ yyyy-mm-dd (hiển thị form). */
function formatDateDisplayVi(iso: string): string {
  const parsed = parseIsoDateOnly(iso);
  if (!parsed) return "Chưa chọn";
  return `${String(parsed.getDate()).padStart(2, "0")}/${String(parsed.getMonth() + 1).padStart(2, "0")}/${parsed.getFullYear()}`;
}

/** yyyy-mm-dd từ ISO đầy đủ (hiển thị bảng). */
function isoDateOnlyFromDb(iso: string | null | undefined): string {
  if (!iso) return "";
  const s = String(iso).trim();
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  return m?.[1] ?? "";
}

function PromoDateField({
  label,
  value,
  onChange,
  minIso,
  maxIso,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  minIso?: string;
  maxIso?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseIsoDateOnly(value);

  const disabledMatcher =
    minIso || maxIso
      ? (date: Date) => {
          const t = utcDayStart(date);
          const mn = minIso ? parseIsoDateOnly(minIso) : undefined;
          const mx = maxIso ? parseIsoDateOnly(maxIso) : undefined;
          if (mn != null && t < utcDayStart(mn)) return true;
          if (mx != null && t > utcDayStart(mx)) return true;
          return false;
        }
      : undefined;

  return (
    <div className="space-y-1">
      <Label className="text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 justify-start gap-2 rounded-xl font-normal"
              />
            }
          >
            <CalendarDays className="size-4 shrink-0 opacity-70" />
            <span className="truncate">{formatDateDisplayVi(value)}</span>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto border-0 p-0 shadow-lg"
            align="start"
            sideOffset={6}
          >
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(d) => {
                if (d) onChange(toIsoDateOnly(d));
                setOpen(false);
              }}
              disabled={disabledMatcher}
              captionLayout="dropdown"
              fromYear={2020}
              toYear={2035}
            />
          </PopoverContent>
        </Popover>
        {value.trim() ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl text-muted-foreground"
            title="Bỏ chọn ngày"
            onClick={() => onChange("")}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function PromoCodesAdminPage() {
  const { user } = useAuth();
  const canWrite = user
    ? canUserAccess(user, PERMISSION_CODES.PRODUCTS_WRITE)
    : false;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedQ = useDebouncedValue(globalFilter, 350);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const listParams = useMemo(
    () => ({ q: debouncedQ.trim() || undefined, page, limit: pageSize }),
    [debouncedQ, page, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, pageSize]);

  const { data, isLoading, error, refetch, isFetching } = usePromoCodesAdmin({
    listParams,
  });
  const rows = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;

  const createMut = useCreatePromoCode();
  const updateMut = useUpdatePromoCode();
  const deleteMut = useDeletePromoCode();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null);

  const clearAllFilters = useCallback((): void => {
    setColumnFilters([]);
    setGlobalFilter("");
    setPage(1);
  }, []);

  const handleColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>(
    (updater) => {
      setColumnFilters((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      );
    },
    [],
  );

  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm());
  }, []);

  const openEdit = useCallback((row: PromoCode) => {
    setEditingId(row.id);
    setForm(fromRow(row));
    setOpen(true);
  }, []);

  const parseNum = (s: string, fallback = 0): number => {
    const n = Number(String(s).replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? Math.floor(n) : fallback;
  };

  const submit = useCallback(async () => {
    const code = form.code.trim().toUpperCase();
    if (!code || code.length < 2) {
      toast.error("Mã tối thiểu 2 ký tự");
      return;
    }
    if (!form.label.trim()) {
      toast.error("Nhập mô tả hiển thị (label)");
      return;
    }
    const discountFixed = parseNum(form.discountFixed, 0);
    const discountPercent = parseNum(form.discountPercent, 0);
    const minOrderSubtotal = parseNum(form.minOrderSubtotal, 0);
    const capRaw = form.discountCapVnd.trim();
    const discountCapVnd =
      capRaw === "" ? null : Math.max(0, parseNum(capRaw, 0));
    const ulRaw = form.usageLimit.trim();
    const usageLimit = ulRaw === "" ? null : Math.max(1, parseNum(ulRaw, 1));

    if (form.discountKind === "fixed" && discountFixed <= 0) {
      toast.error("Giảm cố định phải > 0");
      return;
    }
    if (form.discountKind === "percent" && discountPercent <= 0) {
      toast.error("Phần trăm phải > 0");
      return;
    }

    const payload = {
      code,
      label: form.label.trim(),
      discountKind: form.discountKind,
      discountFixed,
      discountPercent,
      discountCapVnd,
      minOrderSubtotal,
      isActive: form.isActive,
      validFrom: form.validFrom.trim() || null,
      validUntil: form.validUntil.trim() || null,
      usageLimit,
    };

    try {
      if (editingId == null) {
        await createMut.mutateAsync(payload);
        toast.success("Đã tạo mã");
      } else {
        const { code: _c, ...rest } = payload;
        void _c;
        await updateMut.mutateAsync({ id: editingId, input: rest });
        toast.success("Đã cập nhật mã");
      }
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Lỗi lưu mã");
    }
  }, [createMut, editingId, form, updateMut]);

  const columns = useMemo<ColumnDef<PromoCode>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Mã",
        meta: { filterPlaceholder: "Lọc mã…" },
        cell: ({ row }) => (
          <span className="font-mono font-bold text-primary">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: "label",
        header: "Mô tả",
        meta: { filterPlaceholder: "Lọc mô tả…" },
      },
      {
        accessorKey: "discountKind",
        header: "Kiểu",
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.discountKind === "fixed" ? "Cố định (đ)" : "Phần trăm"}
          </Badge>
        ),
        filterFn: (row, id, v) => {
          if (v == null || v === "") return true;
          return row.getValue(id) === v;
        },
        meta: {
          filterVariant: "select",
          filterLabel: "Kiểu giảm",
          selectOptions: [
            { value: "fixed", label: "Cố định (đ)" },
            { value: "percent", label: "Phần trăm" },
          ],
        },
      },
      {
        id: "value",
        header: "Giá trị",
        enableColumnFilter: false,
        meta: { disableColumnFilter: true },
        cell: ({ row }) => {
          const r = row.original;
          if (r.discountKind === "fixed") {
            return (
              <span className="tabular-nums">
                {r.discountFixed.toLocaleString("vi-VN")}đ
              </span>
            );
          }
          return (
            <span className="tabular-nums">
              {r.discountPercent}%{" "}
              {r.discountCapVnd != null
                ? `(tối đa ${r.discountCapVnd.toLocaleString("vi-VN")}đ)`
                : ""}
            </span>
          );
        },
      },
      {
        accessorKey: "minOrderSubtotal",
        header: "Đơn tối thiểu",
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.minOrderSubtotal.toLocaleString("vi-VN")}đ
          </span>
        ),
        filterFn: (row, id, v) => {
          if (v == null || v === "") return true;
          return Number(row.getValue(id)) === Number(v);
        },
        meta: { filterVariant: "number", filterPlaceholder: "Số tiền = …" },
      },
      {
        accessorKey: "usageCount",
        header: "Dùng",
        cell: ({ row }) => {
          const r = row.original;
          const lim = r.usageLimit != null ? ` / ${r.usageLimit}` : "";
          return (
            <span className="tabular-nums text-sm">
              {r.usageCount}
              {lim}
            </span>
          );
        },
        filterFn: (row, id, v) => {
          if (v == null || v === "") return true;
          return Number(row.getValue(id)) === Number(v);
        },
        meta: { filterVariant: "number", filterPlaceholder: "Đã dùng = …" },
      },
      {
        id: "period",
        accessorFn: (r) => {
          const a = isoDateOnlyFromDb(r.validFrom);
          const b = isoDateOnlyFromDb(r.validUntil);
          if (!a && !b) return "";
          if (a && b) return `${a}→${b}`;
          if (a) return `${a}→`;
          return `→${b}`;
        },
        header: "Thời hạn",
        cell: ({ row }) => {
          const r = row.original;
          const a = isoDateOnlyFromDb(r.validFrom);
          const b = isoDateOnlyFromDb(r.validUntil);
          if (!a && !b) {
            return <span className="text-xs text-muted-foreground">Không giới hạn</span>;
          }
          return (
            <span className="text-xs text-muted-foreground tabular-nums">
              {a ? formatDateDisplayVi(a) : "…"} —{" "}
              {b ? formatDateDisplayVi(b) : "…"}
            </span>
          );
        },
        meta: { filterPlaceholder: "Chuỗi ngày (yyyy-mm-dd)…" },
      },
      {
        id: "isActive",
        accessorFn: (r) => (r.isActive ? "true" : "false"),
        header: "Kích hoạt",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "outline"}>
            {row.original.isActive ? "Bật" : "Tắt"}
          </Badge>
        ),
        filterFn: (row, id, v) => {
          if (v == null || v === "") return true;
          return row.getValue(id) === v;
        },
        meta: {
          filterVariant: "select",
          filterLabel: "Trạng thái mã",
          selectOptions: [
            { value: "true", label: "Đang bật" },
            { value: "false", label: "Đang tắt" },
          ],
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        enableColumnFilter: false,
        enableSorting: false,
        meta: { disableColumnFilter: true },
        cell: ({ row }) =>
          canWrite ? (
            <div className="flex flex-wrap justify-end gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 rounded-lg"
                onClick={() => openEdit(row.original)}
              >
                <Pencil className="size-3.5" />
                Sửa
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteTarget(row.original)}
              >
                <Trash2 className="size-3.5" />
                Xóa
              </Button>
            </div>
          ) : null,
      },
    ],
    [canWrite, openEdit],
  );

  const paginationFooter = (
    <AdminTablePaginationFooter
      page={page}
      pageSize={pageSize}
      total={total}
      isLoading={isLoading}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      emptySummary="Chưa có mã khuyến mãi."
      itemLabel="mã"
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-4xl font-extrabold text-foreground tracking-tight">
            <TicketPercent className="size-9 shrink-0 text-primary" aria-hidden />
            Mã khuyến mãi toàn đơn
          </h1>
          <p className="mt-1 font-medium text-on-surface-variant">
            Quản lý mã nhập ở giỏ / thanh toán cửa hàng. Giá KM theo từng sản phẩm
            vẫn do kho cấu hình — khác hoàn toàn với mã ở đây.
          </p>
          {user && !canWrite ? (
            <p className="mt-2 text-sm font-medium text-amber-800 dark:text-amber-200/90">
              Chỉ xem: cần quyền{" "}
              <span className="font-mono">products.write</span> để thêm / sửa / xóa mã.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void refetch()}
            className="flex h-12 items-center gap-2 rounded-xl border-outline-variant px-5 font-bold hover:bg-muted"
          >
            <RefreshCw
              className={cn("size-5", isFetching && "animate-spin")}
              aria-hidden
            />
            Làm mới
          </Button>
          {canWrite ? (
            <Button
              type="button"
              className="flex h-12 items-center gap-2 rounded-xl px-6 font-bold shadow-md"
              onClick={() => {
                openCreate();
                setOpen(true);
              }}
            >
              <Plus className="size-5" aria-hidden />
              Thêm mã
            </Button>
          ) : null}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold">
              {editingId == null ? "Tạo mã mới" : `Sửa mã ${form.code}`}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
                <div className="space-y-1">
                  <Label>Mã (in hoa)</Label>
                  <Input
                    className="font-mono uppercase"
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    disabled={editingId != null}
                    placeholder="VD: GIAM50K"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Mô tả hiển thị</Label>
                  <Input
                    value={form.label}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, label: e.target.value }))
                    }
                    placeholder="Giảm 50.000đ (GIAM50K)"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Kiểu giảm</Label>
                  <Select
                    value={form.discountKind}
                    onValueChange={(v) => {
                      if (v === "fixed" || v === "percent") {
                        setForm((f) => ({ ...f, discountKind: v }));
                      }
                    }}
                  >
                    <SelectTrigger className="w-full rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Số tiền cố định (VNĐ)</SelectItem>
                      <SelectItem value="percent">Phần trăm tạm tính</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.discountKind === "fixed" ? (
                  <div className="space-y-1">
                    <Label>Số tiền giảm (đ)</Label>
                    <Input
                      inputMode="numeric"
                      value={form.discountFixed}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, discountFixed: e.target.value }))
                      }
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <Label>Phần trăm (%)</Label>
                      <Input
                        inputMode="numeric"
                        value={form.discountPercent}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            discountPercent: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Trần giảm (đ, để trống = không trần)</Label>
                      <Input
                        inputMode="numeric"
                        value={form.discountCapVnd}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            discountCapVnd: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <Label>Tạm tính tối thiểu (đ)</Label>
                  <Input
                    inputMode="numeric"
                    value={form.minOrderSubtotal}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        minOrderSubtotal: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <PromoDateField
                    label="Hiệu lực từ"
                    value={form.validFrom}
                    onChange={(v) => setForm((f) => ({ ...f, validFrom: v }))}
                    maxIso={form.validUntil.trim() || undefined}
                  />
                  <PromoDateField
                    label="Đến hết"
                    value={form.validUntil}
                    onChange={(v) => setForm((f) => ({ ...f, validUntil: v }))}
                    minIso={form.validFrom.trim() || undefined}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Chưa chọn = không giới hạn theo ngày đó. Ngày bắt đầu không được sau
                  ngày kết thúc (và ngược lại).
                </p>
                <div className="space-y-1">
                  <Label>Giới hạn số lần dùng (để trống = không giới hạn)</Label>
                  <Input
                    inputMode="numeric"
                    value={form.usageLimit}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, usageLimit: e.target.value }))
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, isActive: Boolean(v) }))
                    }
                  />
                  <Label>Đang kích hoạt</Label>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setOpen(false)}
                >
                  Huỷ
                </Button>
                <Button
                  className="rounded-xl font-bold"
                  onClick={() => void submit()}
                  disabled={createMut.isPending || updateMut.isPending}
                >
                  {(createMut.isPending || updateMut.isPending) && (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  )}
                  Lưu
                </Button>
              </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 shadow-sm">
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span className="text-on-surface-variant">
            Tìm nhanh gọi API phân trang; lọc theo cột chỉ áp dụng trên{" "}
            <span className="font-semibold text-foreground">trang hiện tại</span> (chọn số
            mã/trang ở cuối bảng). Xuất CSV / Excel theo dữ liệu đang hiển thị.
          </span>
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">Không tải được danh sách mã</p>
              <p className="mt-1 text-sm opacity-90">
                {error instanceof Error ? error.message : "Lỗi không xác định"}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {!error ? (
        <AdminDataTable<PromoCode>
          columns={columns}
          data={rows}
          isLoading={isLoading}
          emptyLabel={
            canWrite
              ? 'Chưa có mã — bấm "Thêm mã" hoặc chạy seed.'
              : "Chưa có dữ liệu hoặc không khớp bộ lọc."
          }
          defaultExpandedAll={false}
          manualFiltering
          columnFilters={columnFilters}
          onColumnFiltersChange={handleColumnFiltersChange}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          globalFilterPlaceholder="Tìm theo mã hoặc mô tả (API)…"
          filterToolbarExtra={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-lg"
                onClick={() => void refetch()}
              >
                <RefreshCw
                  className={cn("size-4", isFetching && "animate-spin")}
                  aria-hidden
                />
                Làm mới
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-lg"
                onClick={clearAllFilters}
              >
                <FilterX className="size-4" aria-hidden />
                Xóa bộ lọc
              </Button>
            </div>
          }
          csvExport={{ fileName: "ma-khuyen-mai.csv" }}
          footer={paginationFooter}
        />
      ) : null}

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-left text-destructive">
              <Trash2 className="size-5 shrink-0" aria-hidden />
              Xóa mã {deleteTarget?.code}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Thao tác không hoàn tác. Đơn đã tạo vẫn giữ mã đã áp dụng trong lịch
              sử.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  await deleteMut.mutateAsync(deleteTarget.id);
                  toast.success("Đã xóa mã");
                } catch (e) {
                  toast.error(e instanceof ApiError ? e.message : "Lỗi xóa");
                }
                setDeleteTarget(null);
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
