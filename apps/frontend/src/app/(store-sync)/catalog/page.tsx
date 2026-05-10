"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import { Container, Page, PageContent } from "@ui/components/layout";
import {
  Search,
  ShoppingCart,
  Package2,
  Layers,
  Tag,
  Minus,
  Plus,
} from "lucide-react";
import type { Product, ProductUnitType } from "@/lib/api";
import { useCategories, useProducts } from "@/hooks/queries";
import { useCart } from "@/hooks/use-cart";
import { formatVND } from "@/lib/format";
import { unitSellingAndListPrice } from "@/lib/product-price";
import { resolveCategoryIcon } from "@/lib/category-icons";

const PURCHASE_TYPE_OPTS = [
  { key: "ALL", label: "Sỉ & Lẻ" },
  { key: "si", label: "Mua Sỉ (thùng/lốc)" },
  { key: "le", label: "Mua Lẻ (lon/chai/gói)" },
];

const UNIT_FILTER_OPTS = [
  { key: "ALL", label: "Tất cả đơn vị" },
  { key: "thùng", label: "Thùng" },
  { key: "can", label: "Can" },
  { key: "chai", label: "Chai/Lẻ" },
  { key: "lốc", label: "Lốc" },
  { key: "gói", label: "Gói/Lẻ" },
];

export default function CatalogPage() {
  const { data: productsData, isLoading, error } = useProducts();
  const { data: categoriesData } = useCategories(true);
  const cart = useCart();

  const products = useMemo(() => productsData ?? [], [productsData]);
  const categories = useMemo(() => categoriesData ?? [], [categoriesData]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.slug, c.name);
    return map;
  }, [categories]);

  const categoryTabs = useMemo(
    () => [
      { key: "ALL", label: "Tất cả", icon: Layers },
      ...categories.map((c) => ({
        key: c.slug,
        label: c.name,
        icon: resolveCategoryIcon(c.icon),
      })),
    ],
    [categories],
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryTab, setCategoryTab] = useState("ALL");
  const [purchaseType, setPurchaseType] = useState("ALL");
  const [unitFilter, setUnitFilter] = useState("ALL");

  const handleAddToCart = (
    product: Product,
    unit: ProductUnitType,
    quantity: number,
  ): void => {
    cart.add(product, unit, quantity);
    toast.success(`Đã thêm ${quantity} ${unit.label} – ${product.name}`, {
      description: "Mở giỏ hàng để xem chi tiết",
    });
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.brand ?? "").toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      const matchCategory =
        categoryTab === "ALL" || p.category === categoryTab;

      const units = p.unitTypes ?? [];
      const hasWholesale = units.some((u) => u.wholesalePrice !== null);
      const hasRetail = units.some((u) => u.wholesalePrice === null);
      const matchPurchase =
        purchaseType === "ALL" ||
        (purchaseType === "si" && hasWholesale) ||
        (purchaseType === "le" && hasRetail);

      const matchUnit =
        unitFilter === "ALL" || units.some((u) => u.type === unitFilter);

      return matchSearch && matchCategory && matchPurchase && matchUnit;
    });
  }, [products, searchTerm, categoryTab, purchaseType, unitFilter]);

  return (
    <Page>
      <PageContent className="px-0 md:px-0 py-8 md:py-10 space-y-0">
        <section>
          <Container max="8xl" className="px-4 md:px-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-surface p-8 rounded-3xl shadow-sm border border-outline-variant">
              <div>
                <h1 className="text-4xl font-extrabold text-foreground mb-2">Danh mục sản phẩm</h1>
                <p className="text-lg text-on-surface-variant font-medium">Chọn mua sỉ hoặc lẻ – Giá ưu đãi riêng cho đại lý</p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Link href="/checkout" className="hidden sm:flex">
                  <Button className="h-16 px-8 text-xl rounded-2xl font-bold shadow-sm">
                    <ShoppingCart className="w-6 h-6" />
                    Giỏ hàng ({cart.unitCount})
                  </Button>
                </Link>
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-6 h-6" />
                  <Input
                    type="text"
                    placeholder="Tìm tên sản phẩm, thương hiệu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 py-7 text-xl h-16 w-full md:w-[420px] rounded-2xl bg-background border-outline-variant focus:ring-primary/20 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
              {categoryTabs.map((tab) => {
                const Icon = tab.icon;
                const active = categoryTab === tab.key;
                const count =
                  tab.key === "ALL"
                    ? products.length
                    : products.filter((p) => p.category === tab.key).length;
                return (
                  <Button
                    key={tab.key}
                    onClick={() => setCategoryTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap border transition-all ${active
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-background border-outline-variant text-on-surface-variant hover:bg-muted"
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    <Badge className={`ml-1 text-[10px] px-1.5 py-0 ${active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3 items-center bg-surface border border-outline-variant rounded-2xl p-4">
              <Tag className="w-5 h-5 text-primary shrink-0" />
              <span className="font-bold text-foreground text-sm">Lọc theo:</span>
              <div className="flex gap-2 flex-wrap">
                {PURCHASE_TYPE_OPTS.map((opt) => (
                  <Button
                    key={opt.key}
                    onClick={() => setPurchaseType(opt.key)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-all ${purchaseType === opt.key
                        ? "bg-primary/10 text-primary border-primary/40"
                        : "bg-background border-outline-variant text-on-surface-variant hover:bg-muted"
                      }`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              <div className="w-px h-6 bg-outline-variant hidden sm:block" />
              <div className="flex gap-2 flex-wrap">
                {UNIT_FILTER_OPTS.map((opt) => (
                  <Button
                    key={opt.key}
                    onClick={() => setUnitFilter(opt.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${unitFilter === opt.key
                        ? "bg-secondary/10 text-secondary border-secondary/40"
                        : "bg-background border-outline-variant text-on-surface-variant hover:bg-muted"
                      }`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-on-surface-variant font-medium">
                Hiển thị <span className="font-bold text-foreground">{filteredProducts.length}</span> sản phẩm
              </p>
              {(categoryTab !== "ALL" || purchaseType !== "ALL" || unitFilter !== "ALL" || searchTerm) && (
                <Button
                  variant="link"
                  onClick={() => { setCategoryTab("ALL"); setPurchaseType("ALL"); setUnitFilter("ALL"); setSearchTerm(""); }}
                  className="text-sm text-primary font-semibold"
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>

            {error && (
              <div className="text-center py-12 bg-destructive/5 border border-destructive/20 rounded-2xl">
                <p className="text-lg font-bold text-destructive">Không tải được dữ liệu sản phẩm</p>
                <p className="text-sm text-on-surface-variant mt-1">{error.message}</p>
              </div>
            )}

            {isLoading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-96 rounded-3xl bg-muted/40 animate-pulse"
                  />
                ))}
              </div>
            )}

            {!isLoading && !error && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProducts.map((p) => (
                    <ProductCardWithUnitSelector
                      key={p.id}
                      product={p}
                      categoryLabel={categoryMap.get(p.category) ?? p.category}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-16 bg-muted/20 border border-dashed border-outline-variant rounded-2xl">
                    <Package2 className="w-16 h-16 mx-auto text-outline-variant opacity-30 mb-4" />
                    <p className="text-2xl font-bold text-foreground">Không tìm thấy sản phẩm phù hợp</p>
                    <p className="text-muted-foreground mt-2">Thử từ khóa khác hoặc xóa bộ lọc tìm kiếm.</p>
                  </div>
                )}
              </>
            )}
          </Container>
        </section>
      </PageContent>
    </Page>
  );
}

function ProductCardWithUnitSelector({
  product: p,
  categoryLabel,
  onAddToCart,
}: {
  product: Product;
  categoryLabel: string;
  onAddToCart: (product: Product, unit: ProductUnitType, qty: number) => void;
}) {
  const fallbackUnit: ProductUnitType = useMemo(
    () => ({
      type: p.unit,
      label: p.unit,
      wholesalePrice: p.wholesalePrice,
      retailPrice: p.retailPrice,
      minWholesaleQty: 0,
      qtyPerUnit: 1,
    }),
    [p],
  );
  const units =
    p.unitTypes && p.unitTypes.length > 0 ? p.unitTypes : [fallbackUnit];
  const [selectedUnit, setSelectedUnit] = useState<ProductUnitType>(units[0]!);
  const [quantity, setQuantity] = useState(1);

  const isWholesale = selectedUnit.wholesalePrice !== null;
  const { current: displayPrice, list: listPrice } =
    unitSellingAndListPrice(selectedUnit);

  const maxQty = Math.max(
    1,
    Math.floor(p.stock / Math.max(selectedUnit.qtyPerUnit, 1)),
  );
  const minQty = isWholesale ? Math.max(1, selectedUnit.minWholesaleQty || 1) : 1;
  const outOfStock = maxQty <= 0;

  const primaryImage = p.images?.[0];
  const firstCoupon = p.coupons?.[0];

  const changeUnit = (u: ProductUnitType) => {
    setSelectedUnit(u);
    setQuantity(
      u.wholesalePrice !== null ? Math.max(1, u.minWholesaleQty || 1) : 1,
    );
  };

  return (
    <div className="bg-background border border-outline-variant rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all group flex flex-col">
      <Link href={`/catalog/${p.id}`} className="block relative overflow-hidden bg-white">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={p.name}
            className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-52 flex items-center justify-center bg-muted/30">
            <Package2 className="w-12 h-12 text-outline-variant" />
          </div>
        )}
        {firstCoupon && (
          <div className="absolute top-3 left-3 bg-destructive text-white text-xs font-bold px-2 py-1 rounded-lg">
            {firstCoupon}
          </div>
        )}
        <Badge className="absolute top-3 right-3 bg-primary/90 text-white text-xs px-2 py-0.5">
          {categoryLabel}
        </Badge>
      </Link>

      <div className="p-5 flex flex-col gap-3 flex-grow">
        <Link href={`/catalog/${p.id}`}>
          <h3 className="font-bold text-lg leading-snug hover:text-primary transition-colors line-clamp-2">
            {p.name}
          </h3>
        </Link>
        <p className="text-xs text-on-surface-variant font-medium">
          {[p.brand, p.origin].filter(Boolean).join(" · ")}
        </p>

        <div className="space-y-2">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
            Chọn loại hàng:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {units.map((u) => {
              const active = selectedUnit.type === u.type;
              const isSi = u.wholesalePrice !== null;
              return (
                <Button
                  key={u.type}
                  onClick={() => changeUnit(u)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${active
                      ? isSi
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-secondary-foreground border-secondary"
                      : "bg-muted/50 text-on-surface-variant border-outline-variant hover:bg-muted"
                    }`}
                >
                  {u.label}
                  {isSi && <span className="ml-1 opacity-70">• Sỉ</span>}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-auto pt-2 border-t border-outline-variant/30">
          <div>
            <div className="flex flex-wrap items-baseline gap-2">
              {listPrice != null && (
                <p className="text-sm font-semibold text-muted-foreground line-through">
                  {formatVND(listPrice)}
                </p>
              )}
              <p className="text-2xl font-black text-primary">{formatVND(displayPrice)}</p>
            </div>
            {isWholesale && selectedUnit.minWholesaleQty > 0 && (
              <p className="text-xs text-on-surface-variant">
                Tối thiểu {selectedUnit.minWholesaleQty} {selectedUnit.type}
              </p>
            )}
            {!isWholesale && (
              <p className="text-xs text-on-surface-variant">
                Giá lẻ / {selectedUnit.type}
              </p>
            )}
          </div>
          <div className="ml-auto text-right">
            {isWholesale ? (
              <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-xs">
                Giá Sỉ
              </Badge>
            ) : (
              <Badge className="bg-secondary/10 text-secondary border-secondary/20 font-bold text-xs">
                Giá Lẻ
              </Badge>
            )}
            <p className="text-[10px] text-on-surface-variant mt-1 font-medium">
              Tồn: {maxQty} {selectedUnit.type}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface border border-outline-variant rounded-xl overflow-hidden h-11">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-none"
              onClick={() => setQuantity((q) => Math.max(minQty, q - 1))}
              disabled={outOfStock || quantity <= minQty}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <input
              type="number"
              value={quantity}
              min={minQty}
              max={maxQty}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n)) {
                  setQuantity(Math.min(Math.max(n, minQty), maxQty));
                }
              }}
              className="w-12 text-center font-extrabold bg-transparent border-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-none"
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              disabled={outOfStock || quantity >= maxQty}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <Button
            className="flex-grow rounded-xl font-bold h-11"
            onClick={() => onAddToCart(p, selectedUnit, quantity)}
            disabled={outOfStock}
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            {outOfStock ? "Hết hàng" : "Thêm vào giỏ"}
          </Button>
        </div>
      </div>
    </div>
  );
}
