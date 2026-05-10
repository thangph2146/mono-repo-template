"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@ui/components/sheet";
import { Button, buttonVariants } from "@ui/components/button";
import { cn } from "@ui/lib/utils";
import { Badge } from "@ui/components/badge";
import {
  Minus,
  Package2,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { formatVND } from "@/lib/format";

export function CartDrawer() {
  const { lines, unitCount, grandTotal, setQuantity, remove, clear } = useCart();
  const [open, setOpen] = useState(false);
  const isEmpty = lines.length === 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "relative text-on-surface-variant hover:text-primary",
            )}
          />
        }
      >
        <ShoppingCart className="size-5" />
        {unitCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border border-background">
            {unitCount}
          </Badge>
        )}
        <span className="sr-only">Mở giỏ hàng</span>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0"
      >
        <SheetHeader className="border-b border-outline-variant px-6 py-5 flex-row items-center justify-between space-y-0">
          <div>
            <SheetTitle className="text-xl font-extrabold flex items-center gap-2">
              <ShoppingCart className="size-5 text-primary" /> Giỏ hàng
            </SheetTitle>
            <SheetDescription className="text-xs">
              {isEmpty
                ? "Chưa có sản phẩm nào"
                : `${lines.length} loại · ${unitCount} đơn vị`}
            </SheetDescription>
          </div>
          {!isEmpty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-destructive hover:bg-destructive/10 rounded-lg"
            >
              <X className="size-4 mr-1" />
              Xoá tất cả
            </Button>
          )}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {isEmpty && (
            <div className="text-center py-16 space-y-3">
              <Package2 className="size-16 mx-auto text-outline-variant opacity-30" />
              <p className="text-base font-bold text-on-surface-variant">
                Giỏ hàng trống
              </p>
              <p className="text-sm text-muted-foreground">
                Hãy chọn sản phẩm từ danh mục để bắt đầu mua sắm.
              </p>
              <Button
                nativeButton={false}
                render={
                  <Link
                    href="/catalog"
                    onClick={() => setOpen(false)}
                  />
                }
                className="mt-2 rounded-xl"
              >
                Xem danh mục
              </Button>
            </div>
          )}

          {lines.map((line) => {
            const maxQty = Math.max(
              1,
              Math.floor(line.stock / Math.max(line.qtyPerUnit, 1)),
            );
            return (
              <div
                key={`${line.productId}:${line.unitType}`}
                className="flex gap-3 rounded-2xl border border-outline-variant bg-background p-3"
              >
                <div className="size-16 rounded-xl border border-outline-variant/40 bg-white flex items-center justify-center shrink-0 overflow-hidden">
                  {line.image ? (
                    <img
                      src={line.image}
                      alt=""
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <Package2 className="size-7 text-outline-variant" />
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-bold text-sm line-clamp-2 leading-snug">
                    {line.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge className="text-[10px] px-1.5 py-0 bg-muted text-on-surface-variant border-outline-variant/40 font-semibold">
                      {line.unitLabel}
                    </Badge>
                    {line.isWholesale && (
                      <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20 font-bold">
                        Sỉ
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center bg-surface border border-outline-variant rounded-lg overflow-hidden h-8">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none"
                        onClick={() =>
                          setQuantity(
                            line.productId,
                            line.unitType,
                            line.quantity - 1,
                          )
                        }
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-9 text-center text-sm font-bold">
                        {line.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none"
                        disabled={line.quantity >= maxQty}
                        onClick={() =>
                          setQuantity(
                            line.productId,
                            line.unitType,
                            line.quantity + 1,
                          )
                        }
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                    <p className="font-black text-primary">
                      {formatVND(line.unitPrice * line.quantity)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 size-8 text-destructive hover:bg-destructive/10"
                  onClick={() => remove(line.productId, line.unitType)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>

        {!isEmpty && (
          <SheetFooter className="border-t border-outline-variant px-6 py-5 space-y-3 flex-col sm:flex-col">
            <div className="flex justify-between text-base font-semibold">
              <span className="text-on-surface-variant">Tạm tính</span>
              <span className="font-black text-primary text-xl">
                {formatVND(grandTotal)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Thanh toán khi nhận hàng (COD). Phí vận chuyển sẽ được tính khi
              xác nhận đơn.
            </p>
            <Button
              nativeButton={false}
              render={
                <Link
                  href="/checkout"
                  onClick={() => setOpen(false)}
                />
              }
              className="w-full h-12 rounded-xl font-bold"
            >
              Tiến hành đặt hàng
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
