"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { ArrowRight, Tag, TicketPercent } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { formatVND } from "@/lib/format";
import { PROMO_CODE_EXAMPLES } from "@workspace/promo-codes";
import { cn } from "@ui/lib/utils";

type CartOrderSummaryProps = {
  /** Giỏ hàng: nút sang checkout. Thanh toán: chỉ bảng giá (nút đặt hàng ở card khác). */
  variant?: "cart-aside" | "checkout-total";
};

function PromoField({ className }: { className?: string }) {
  const {
    appliedPromoCode,
    applyPromo,
    clearPromo,
    subtotal,
    promoDiscount,
    promoLabel,
    promoError,
  } = useCart();
  const [draft, setDraft] = useState(appliedPromoCode ?? "");

  useEffect(() => {
    setDraft(appliedPromoCode ?? "");
  }, [appliedPromoCode]);

  const handleApply = (): void => {
    const r = applyPromo(draft);
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    toast.success(r.label);
    setDraft(r.normalizedCode);
  };

  const handleClear = (): void => {
    clearPromo();
    setDraft("");
    toast.message("Đã gỡ mã khuyến mãi");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label
        htmlFor="cart-promo-code"
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant"
      >
        <TicketPercent className="size-3.5 text-primary" />
        Mã khuyến mãi
      </Label>
      <div className="flex gap-2">
        <Input
          id="cart-promo-code"
          value={draft}
          onChange={(e) => setDraft(e.target.value.toUpperCase())}
          placeholder="VD: GIAM50K"
          className="h-11 flex-1 rounded-xl border-outline-variant font-mono text-sm uppercase"
          disabled={subtotal <= 0}
          autoComplete="off"
        />
        <Button
          type="button"
          variant="secondary"
          className="h-11 shrink-0 rounded-xl px-4 font-bold"
          disabled={subtotal <= 0 || !draft.trim()}
          onClick={handleApply}
        >
          Áp dụng
        </Button>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Mã toàn đơn do kho cấu hình (đồng bộ từ máy chủ). Ví dụ:{" "}
        {PROMO_CODE_EXAMPLES.join(" · ")}. Giá KM theo{" "}
        <strong>từng sản phẩm / đơn vị</strong> (SL tối thiểu) tự cập nhật khi đổi số
        lượng — khác với ô mã bên dưới.
      </p>
      {appliedPromoCode && promoDiscount > 0 && promoLabel && (
        <div className="flex items-center justify-between rounded-xl border border-success/25 bg-success/5 px-3 py-2 text-sm">
          <span className="flex items-center gap-2 font-semibold text-success">
            <Tag className="size-4" />
            {promoLabel}
          </span>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className={"rounded-xl"}
            onClick={handleClear}
          >
            Gỡ mã
          </Button>
        </div>
      )}
      {promoError && (
        <p className="text-xs font-medium text-destructive">{promoError}</p>
      )}
    </div>
  );
}

export function CartOrderSummary({ variant = "cart-aside" }: CartOrderSummaryProps) {
  const { unitCount, subtotal, wholesaleSavings, promoDiscount, grandTotal } =
    useCart();

  return (
    <div
      className={cn(
        "space-y-5 border border-outline-variant bg-background p-6 shadow-sm",
        variant === "cart-aside" && "sticky top-24 rounded-3xl",
        variant === "checkout-total" && "rounded-2xl border-dashed",
      )}
    >
      <div className="space-y-1 border-b border-outline-variant/60 pb-4">
        <h2 className="text-lg font-extrabold tracking-tight text-foreground">
          Tổng đơn hàng
        </h2>
        <p className="text-xs text-on-surface-variant">
          {unitCount} đơn vị trong giỏ — giá theo bảng giá ban đầu / khuyến mãi từng dòng.
        </p>
      </div>

      <PromoField />

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-on-surface-variant">Tạm tính</dt>
          <dd className="text-right font-bold tabular-nums">{formatVND(subtotal)}</dd>
        </div>
        {promoDiscount > 0 && (
          <div className="flex justify-between gap-4 text-primary">
            <dt className="font-medium">Giảm thêm (mã KM)</dt>
            <dd className="text-right font-bold tabular-nums">
              −{formatVND(promoDiscount)}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-on-surface-variant">Phí vận chuyển</dt>
          <dd className="text-right text-xs text-on-surface-variant">
            Tính khi xác nhận đơn
          </dd>
        </div>
      </dl>
      {wholesaleSavings > 0 && (
        <div className="rounded-xl border border-success/20 bg-success/5 px-3 py-2.5 text-xs leading-relaxed text-success">
          <strong>Tiết kiệm từ giá khuyến mãi:</strong> so với giá ban đầu cùng quy cách, tạm tính đã
          thấp hơn{" "}
          <span className="font-black tabular-nums">
            {formatVND(wholesaleSavings)}
          </span>
          . Khoản này <em>không</em> trừ thêm lần nữa — chỉ để đối chiếu.
        </div>
      )}

      <div className="rounded-2xl bg-primary/5 px-4 py-3 ring-1 ring-primary/15">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-extrabold text-foreground">Thành tiền</span>
          <span className="text-2xl font-black tabular-nums tracking-tight text-primary">
            {formatVND(grandTotal)}
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">
          Thanh toán COD khi nhận hàng. Số tiền cuối khớp với đơn hàng sau khi hệ
          thống xác nhận tồn kho và mã KM.
        </p>
      </div>

      {variant === "cart-aside" && (
        <Button
          nativeButton={false}
          render={<Link href="/checkout" />}
          className="h-12 w-full rounded-xl text-base font-bold"
        >
          Tiến hành đặt hàng
          <ArrowRight className="ml-1 size-4" />
        </Button>
      )}
    </div>
  );
}

/** Khối nhập mã + gợi ý — dùng trong card tổng thanh toán checkout. */
export function CheckoutPromoField() {
  return (
    <div className="rounded-2xl border border-outline-variant/50 bg-muted/20 p-4">
      <PromoField />
    </div>
  );
}
