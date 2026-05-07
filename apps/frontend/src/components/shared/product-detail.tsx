"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, ShoppingCart, Truck, Minus, Plus, AlertTriangle, CheckCircle2, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

type UnitType = {
  type: string;
  label: string;
  wholesalePrice: string | null;
  retailPrice: string;
  minWholesaleQty: number | null;
  qtyPerUnit: number;
};

export type ProductDetailData = {
  id: string;
  name: string;
  category: string;
  brand: string;
  origin: string;
  basePrice: string;
  discountPrice: string;
  minQty: string;
  stock: number;
  unit: string;
  sku: string;
  description: string;
  primaryImage: string;
  gallery: string[];
  unitTypes?: UnitType[];
  coupons?: string[];
};

type ProductDetailProps = {
  product: ProductDetailData;
  backHref?: string;
  supportHref?: string;
};

function parsePrice(str: string): number {
  return parseInt(str.replace(/[^\d]/g, ""), 10) || 0;
}

function formatVND(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ";
}

export function ProductDetail({
  product,
  backHref = "/catalog",
  supportHref = "/support",
}: ProductDetailProps) {
  const units: UnitType[] = product.unitTypes ?? [];
  const [selectedUnit, setSelectedUnit] = useState<UnitType>(units[0] ?? {
    type: product.unit, label: product.unit,
    wholesalePrice: product.discountPrice, retailPrice: product.basePrice,
    minWholesaleQty: 1, qtyPerUnit: 1,
  });
  const [activeImage, setActiveImage] = useState(product.primaryImage);

  const isWholesale = selectedUnit.wholesalePrice !== null;
  const unitPrice = isWholesale ? selectedUnit.wholesalePrice! : selectedUnit.retailPrice;
  const minQty = selectedUnit.minWholesaleQty ?? 1;
  const [qty, setQty] = useState(minQty);

  const totalUnits = qty * selectedUnit.qtyPerUnit;
  const totalPrice = parsePrice(unitPrice) * qty;
  const stockWarning = qty > product.stock * 0.8;
  const outOfStock = qty > product.stock;

  const handleQtyChange = (delta: number) => {
    setQty((prev) => Math.max(minQty, Math.min(prev + delta, product.stock)));
  };

  const handleUnitChange = (u: UnitType) => {
    setSelectedUnit(u);
    setQty(u.minWholesaleQty ?? 1);
  };

  const handleAddToCart = () => {
    if (outOfStock) return;
    toast.success(`Đã thêm ${qty} ${selectedUnit.label} vào giỏ hàng`, {
      description: `${product.name} · Tổng: ${formatVND(totalPrice)}`,
    });
  };

  const allImages = [product.primaryImage, ...product.gallery.filter((g) => g !== product.primaryImage)];

  return (
    <>
      <Link href={backHref}>
        <Button variant="outline" className="rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh mục
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <Card className="rounded-3xl border-outline-variant overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="aspect-square bg-gradient-to-b from-white to-muted/20 rounded-2xl p-6 border border-outline-variant/30 shadow-inner flex items-center justify-center">
              <img
                src={activeImage}
                alt={product.name}
                className="max-h-[88%] max-w-[88%] object-contain drop-shadow-[0_14px_24px_rgba(0,0,0,0.2)] rounded-lg transition-all duration-300"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {allImages.slice(0, 4).map((img) => (
                <Button
                  key={img}
                  onClick={() => setActiveImage(img)}
                  className={`aspect-square h-auto rounded-xl p-1.5 border-2 transition-all overflow-hidden bg-white ${
                    activeImage === img ? "border-primary shadow-md" : "border-outline-variant/30 hover:border-primary/40"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain rounded-lg" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Product Info */}
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">{product.category}</Badge>
            {product.coupons?.map((c) => (
              <Badge key={c} className="bg-destructive/10 text-destructive border-destructive/20 font-bold text-xs">
                <Tag className="w-3 h-3 mr-1" />{c}
              </Badge>
            ))}
          </div>

          <h1 className="text-3xl font-black leading-tight tracking-tight">{product.name}</h1>
          <p className="text-base text-muted-foreground">{product.description}</p>

          {/* Unit Type Selector */}
          {units.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Chọn loại đơn vị:</p>
              <div className="flex flex-wrap gap-2">
                {units.map((u) => {
                  const active = selectedUnit.type === u.type;
                  const isSi = u.wholesalePrice !== null;
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
                      <span className={`text-xs font-semibold ${active ? "opacity-80" : "text-primary"}`}>
                        {isSi ? u.wholesalePrice : u.retailPrice}
                        {isSi && <span className="ml-1 opacity-70">• Sỉ</span>}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price Box */}
          <div className="rounded-2xl border border-outline-variant/40 bg-surface p-5 space-y-3">
            <div className="flex items-end gap-3">
              <p className="text-4xl font-black text-primary">{unitPrice}</p>
              <p className="text-base text-muted-foreground mb-1">/ {selectedUnit.label}</p>
              {isWholesale && (
                <Badge className="mb-1 bg-primary/10 text-primary border-primary/20 font-bold">Giá Sỉ</Badge>
              )}
            </div>
            {isWholesale && minQty > 1 && (
              <p className="text-sm text-on-surface-variant font-medium">
                Tối thiểu <span className="font-black text-primary">{minQty} {selectedUnit.type}</span> để được giá sỉ
              </p>
            )}
            {totalPrice > 0 && (
              <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between">
                <p className="text-sm text-on-surface-variant font-medium">
                  Tổng cộng ({qty} {selectedUnit.type} × {selectedUnit.qtyPerUnit > 1 ? `${selectedUnit.qtyPerUnit} ${product.unit}` : selectedUnit.label}):
                </p>
                <p className="text-xl font-black text-primary">{formatVND(totalPrice)}</p>
              </div>
            )}
          </div>

          {/* Quantity Stepper */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Số lượng đặt:</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-outline-variant rounded-xl overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-none border-r border-outline-variant"
                  onClick={() => handleQtyChange(-1)}
                  disabled={qty <= minQty}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="w-16 text-center">
                  <p className="text-xl font-black text-foreground">{qty}</p>
                  <p className="text-[10px] text-on-surface-variant leading-none">{selectedUnit.type}</p>
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
                <p>= <span className="font-bold text-foreground">{totalUnits.toLocaleString()}</span> {product.unit}</p>
                <p className="text-xs">Tồn kho: <span className={`font-bold ${outOfStock ? "text-destructive" : stockWarning ? "text-warning" : "text-success"}`}>{product.stock} {product.unit}</span></p>
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

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <InfoItem label="Thương hiệu" value={product.brand} />
            <InfoItem label="Xuất xứ" value={product.origin} />
            <InfoItem label="Mã SKU" value={product.sku} />
            <InfoItem label="Tồn kho" value={`${product.stock} ${product.unit}`} />
          </div>

          {/* Actions */}
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
