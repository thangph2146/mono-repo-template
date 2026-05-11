"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
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
  CalendarDays,
  Loader2,
  Pencil,
  Plus,
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
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 350);
  const listParams = useMemo(
    () => ({ q: debouncedQ.trim() || undefined, page, limit: pageSize }),
    [debouncedQ, page, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, pageSize]);

  const { data, isLoading, error } = usePromoCodesAdmin({ listParams });
  const rows = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;

  const createMut = useCreatePromoCode();
  const updateMut = useUpdatePromoCode();
  const deleteMut = useDeletePromoCode();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null);

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
        cell: ({ row }) => (
          <span className="font-mono font-bold text-primary">
            {row.original.code}
          </span>
        ),
      },
      { accessorKey: "label", header: "Mô tả" },
      {
        accessorKey: "discountKind",
        header: "Kiểu",
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.discountKind === "fixed" ? "Cố định (đ)" : "Phần trăm"}
          </Badge>
        ),
      },
      {
        id: "value",
        header: "Giá trị",
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
      },
      {
        accessorKey: "usageCount",
        header: "Dùng",
        cell: ({ row }) => {
          const r = row.original;
          const lim =
            r.usageLimit != null ? ` / ${r.usageLimit}` : "";
          return (
            <span className="tabular-nums text-sm">
              {r.usageCount}
              {lim}
            </span>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Bật",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "outline"}>
            {row.original.isActive ? "Có" : "Tắt"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          canWrite ? (
            <div className="flex justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openEdit(row.original)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => setDeleteTarget(row.original)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ) : null,
      },
    ],
    [canWrite, openEdit],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <TicketPercent className="size-7 text-primary" />
            Mã khuyến mãi toàn đơn
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý mã nhập ở giỏ / thanh toán cửa hàng. Giá KM theo từng sản phẩm
            vẫn do kho cấu hình — khác hoàn toàn với mã ở đây.
          </p>
        </div>
        {canWrite ? (
          <Button
            className="rounded-xl font-bold"
            onClick={() => {
              openCreate();
              setOpen(true);
            }}
            type="button"
          >
            <Plus className="size-4 mr-2" />
            Thêm mã
          </Button>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className=" max-w-[500px] rounded-2xl">
              <DialogHeader>
                <DialogTitle>
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
                    <SelectTrigger>
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
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Huỷ
                </Button>
                <Button
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Tìm theo mã hoặc mô tả…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-xl"
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Không tải được danh sách"}
        </p>
      ) : null}

      <AdminDataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        emptyLabel="Chưa có mã — chạy seed hoặc thêm mã mới."
      />
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

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa mã {deleteTarget?.code}?</AlertDialogTitle>
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
