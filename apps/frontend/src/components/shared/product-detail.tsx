"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  ShoppingCart,
  Truck,
  Minus,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Tag,
} from "lucide-react";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { toast } from "sonner";
import type { Product, ProductUnitType } from "@/lib/api";
import { formatVND } from "@/lib/format";
import { unitSellingAndListPrice } from "@/lib/product-price";
import { useCategoryBySlug } from "@/hooks/queries";
import { cartLineQuantity, useCart } from "@/hooks/use-cart";

type ProductDetailProps = {
  product: Product;
  backHref?: string;
  supportHref?: string;
};

export function ProductDetail({
  product,
  backHref = "/catalog",
  supportHref = "/support",
}: ProductDetailProps) {
  const { data: category } = useCategoryBySlug(product.category);
  const categoryLabel = category?.name ?? product.category;
  const cart = useCart();
  const fallbackUnit: ProductUnitType = useMemo(
    () => ({
      type: product.unit,
      label: product.unit,
      wholesalePrice: product.wholesalePrice,
      retailPrice: product.retailPrice,
      minWholesaleQty: 1,
      qtyPerUnit: 1,
    }),
    [product],
  );
  const units: ProductUnitType[] =
    product.unitTypes && product.unitTypes.length > 0
      ? product.unitTypes
      : [fallbackUnit];

  const [selectedUnit, setSelectedUnit] = useState<ProductUnitType>(units[0]!);
  const allImages = product.images ?? [];
  const [activeImage, setActiveImage] = useState<string | undefined>(allImages[0]);

  /** Luôn cho đặt từ 1; `minWholesaleQty` chỉ là ngưỡng áp giá KM. */
  const minPurchaseQty = 1;
  const minPromoQty =
    selectedUnit.minWholesaleQty > 0 ? selectedUnit.minWholesaleQty : 1;
  const maxQty = Math.max(
    1,
    Math.floor(product.stock / Math.max(selectedUnit.qtyPerUnit, 1)),
  );
  const [qty, setQty] = useState(1);

  const qtyInCart = cartLineQuantity(
    cart.lines,
    product.id,
    selectedUnit.type,
  );
  const pricingQty = qtyInCart + qty;

  const isWholesale = selectedUnit.wholesalePrice !== null;
  const { current: unitPrice, list: listPrice } = unitSellingAndListPrice(
    selectedUnit,
    pricingQty,
  );

  const totalUnits = qty * Math.max(selectedUnit.qtyPerUnit, 1);
  const totalPrice = unitPrice * qty;
  const stockWarning = totalUnits > product.stock * 0.8;
  const outOfStock = maxQty <= 0 || qty > maxQty;

  const handleQtyChange = (delta: number) => {
    setQty((prev) =>
      Math.max(minPurchaseQty, Math.min(prev + delta, maxQty)),
    );
  };

  const handleUnitChange = (u: ProductUnitType) => {
    setSelectedUnit(u);
    setQty(1);
  };

  const handleAddToCart = () => {
    if (outOfStock) return;
    cart.add(product, selectedUnit, qty);
    toast.success(`Đã thêm ${qty} ${selectedUnit.label} vào giỏ hàng`, {
      description: `${product.name} · Tổng: ${formatVND(totalPrice)}`,
    });
  };

  return (
    <>
      <Link href={backHref}>
        <Button variant="outline" className="rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh mục
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-3xl border-outline-variant overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="aspect-square bg-gradient-to-b from-white to-muted/20 rounded-2xl p-6 border border-outline-variant/30 shadow-inner flex items-center justify-center">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.name}
                  className="max-h-[88%] max-w-[88%] object-cover drop-shadow-[0_14px_24px_rgba(0,0,0,0.2)] rounded-lg transition-all duration-300"
                />
              ) : (
                <Package className="w-20 h-20 text-outline-variant" />
              )}
            </div>
            {allImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {allImages.slice(0, 4).map((img) => (
                  <Button
                    key={img}
                    onClick={() => setActiveImage(img)}
                    className={`aspect-square h-auto rounded-xl p-1.5 border-2 transition-all overflow-hidden bg-white ${
                      activeImage === img
                        ? "border-primary shadow-md"
                        : "border-outline-variant/30 hover:border-primary/40"
                    }`}
                  >
                    <img src={img} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">
              {categoryLabel}
            </Badge>
            {product.coupons?.map((c) => (
              <Badge
                key={c}
                className="bg-destructive/10 text-destructive border-destructive/20 font-bold text-xs"
              >
                <Tag className="w-3 h-3 mr-1" />
                {c}
              </Badge>
            ))}
          </div>

          <h1 className="text-3xl font-black leading-tight tracking-tight">{product.name}</h1>
          {product.description && (
            <p className="text-base text-muted-foreground">{product.description}</p>
          )}

          {units.length > 1 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                Chọn loại đơn vị:
              </p>
              <div className="flex flex-wrap gap-2">
                {units.map((u) => {
                  const active = selectedUnit.type === u.type;
                  const isSi = u.wholesalePrice !== null;
                  const inCartU = cartLineQuantity(cart.lines, product.id, u.type);
                  const previewQty = inCartU + qty;
                  const { current, list } = unitSellingAndListPrice(
                    u,
                    previewQty,
                  );
                  return (
                    <Button
                      key={u.type}
                      onClick={() => handleUnitChange(u)}
                      className={`h-auto px-4 py-2 rounded-xl text-sm font-bold border flex-col items-start gap-0.5 transition-all ${
                        active
                          ? isSi
                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                            : "bg-secondary text-secondary-foreground border-secondary shadow-md"
                          : "bg-background border-outline-variant text-on-surface-variant hover:bg-muted"
                      }`}
                    >
                      <span>{u.label}</span>
                      <span
                        className={`flex flex-wrap items-baseline gap-1 text-xs font-semibold ${active ? "opacity-90" : "text-primary"}`}
                      >
                        {list != null && (
                          <span className="line-through opacity-70">{formatVND(list)}</span>
                        )}
                        <span>{formatVND(current)}</span>
                        {isSi && (
                          <span className="ml-0.5 opacity-70">• Khuyến mãi</span>
                        )}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-outline-variant/40 bg-surface p-5 space-y-3">
            <div className="flex flex-wrap items-end gap-2 md:gap-3">
              {listPrice != null && (
                <p className="text-lg font-semibold text-muted-foreground line-through mb-1">
                  {formatVND(listPrice)}
                </p>
              )}
              <p className="text-4xl font-black text-primary">{formatVND(unitPrice)}</p>
              <p className="text-base text-muted-foreground mb-1">/ {selectedUnit.label}</p>
              {isWholesale && (
                <Badge
                  className={
                    listPrice != null
                      ? "mb-1 bg-primary/10 text-primary border-primary/20 font-bold"
                      : "mb-1 bg-secondary/10 text-secondary-foreground border-secondary/20 font-bold"
                  }
                >
                  {listPrice != null ? "Giá KM (đủ SL)" : "Giá ban đầu"}
                </Badge>
              )}
            </div>
            {qtyInCart > 0 && (
              <p className="text-xs text-muted-foreground font-medium">
                Trong giỏ:{" "}
                <span className="font-bold text-foreground">
                  {qtyInCart} {selectedUnit.type}
                </span>
                {" · "}
                Đang thêm:{" "}
                <span className="font-bold text-foreground">{qty}</span>
                {" → "}
                Tổng (áp giá):{" "}
                <span className="font-bold text-primary">{pricingQty}</span>
              </p>
            )}
            {isWholesale && minPromoQty > 1 && (
              <p className="text-sm text-on-surface-variant font-medium">
                Từ{" "}
                <span className="font-black text-primary">
                  {minPromoQty} {selectedUnit.type}
                </span>{" "}
                trở lên mới áp giá khuyến mãi; mua ít hơn vẫn được (giá ban đầu).
                {pricingQty < minPromoQty && (
                  <span className="block text-xs mt-1 text-muted-foreground">
                    Tổng sau khi thêm ({pricingQty}) vẫn chưa đủ điều kiện KM — có
                    thể đặt từ 1.
                  </span>
                )}
                {pricingQty >= minPromoQty && (
                  <span className="block text-xs mt-1 text-emerald-700 dark:text-emerald-400">
                    {qtyInCart > 0
                      ? `Đủ điều kiện KM khi gộp giỏ (${qtyInCart}) + lần này (${qty}) = ${pricingQty} ${selectedUnit.type}.`
                      : `Đủ điều kiện KM với ${pricingQty} ${selectedUnit.type}.`}
                  </span>
                )}
              </p>
            )}
            {totalPrice > 0 && (
              <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between">
                <p className="text-sm text-on-surface-variant font-medium">
                  Tổng cộng ({qty} {selectedUnit.type}
                  {selectedUnit.qtyPerUnit > 1
                    ? ` × ${selectedUnit.qtyPerUnit} ${product.unit}`
                    : ""}
                  ):
                </p>
                <p className="text-xl font-black text-primary">{formatVND(totalPrice)}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
              Số lượng đặt:
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-outline-variant rounded-xl overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-none border-r border-outline-variant"
                  onClick={() => handleQtyChange(-1)}
                  disabled={qty <= minPurchaseQty}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="w-16 text-center">
                  <p className="text-xl font-black text-foreground">{qty}</p>
                  <p className="text-[10px] text-on-surface-variant leading-none">
                    {selectedUnit.type}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-none border-l border-outline-variant"
                  onClick={() => handleQtyChange(1)}
                  disabled={outOfStock}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-sm text-on-surface-variant space-y-0.5">
                <p>
                  ={" "}
                  <span className="font-bold text-foreground">
                    {totalUnits.toLocaleString("vi-VN")}
                  </span>{" "}
                  {product.unit}
                </p>
                <p className="text-xs">
                  Tồn kho:{" "}
                  <span
                    className={`font-bold ${
                      outOfStock
                        ? "text-destructive"
                        : stockWarning
                          ? "text-warning"
                          : "text-success"
                    }`}
                  >
                    {product.stock} {product.unit}
                  </span>
                </p>
              </div>
            </div>
            {stockWarning && !outOfStock && (
              <div className="flex items-center gap-2 text-warning text-sm font-semibold bg-warning/10 px-3 py-2 rounded-xl">
                <AlertTriangle className="w-4 h-4 shrink-0" /> Sắp hết hàng – chỉ còn ít trong kho
              </div>
            )}
            {outOfStock && (
              <div className="flex items-center gap-2 text-destructive text-sm font-semibold bg-destructive/10 px-3 py-2 rounded-xl">
                <AlertTriangle className="w-4 h-4 shrink-0" /> Số lượng vượt quá tồn kho hiện tại
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoItem label="Thương hiệu" value={product.brand ?? "—"} />
            <InfoItem label="Xuất xứ" value={product.origin ?? "—"} />
            <InfoItem label="Mã SKU" value={product.sku} />
            <InfoItem label="Tồn kho" value={`${product.stock} ${product.unit}`} />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              className="h-14 rounded-xl px-8 font-black text-base flex-1"
              onClick={handleAddToCart}
              disabled={outOfStock}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {outOfStock ? "Hết hàng" : `Thêm vào giỏ – ${formatVND(totalPrice)}`}
            </Button>
            <Link href={supportHref}>
              <Button variant="outline" className="h-14 rounded-xl px-6 font-bold w-full sm:w-auto">
                <Truck className="w-4 h-4 mr-2" /> Tư vấn
              </Button>
            </Link>
          </div>

          {!outOfStock && (
            <div className="flex items-center gap-2 text-success text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Còn hàng – giao trong hôm nay hoặc ngày mai
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant/40 p-3 bg-background">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-bold flex items-center gap-2 mt-1">
        <Package className="w-4 h-4 text-primary" />
        {value}
      </p>
    </div>
  );
}
