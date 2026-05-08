"use client";

import { useMemo, useState } from "react";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import Link from "next/link";
import { toast } from "sonner";
import products from "@ui/data/products.json";
import { Search, ShoppingCart, Package2, Layers, Droplets, Milk, Soup, Tag } from "lucide-react";
import { Container, Page, PageContent } from "@ui/components/layout";


const CATEGORY_TABS = [
  { key: "ALL", label: "Tất cả", icon: Layers },
  { key: "do-uong", label: "Đồ uống", icon: Droplets },
  { key: "thuc-pham", label: "Thực phẩm", icon: Soup },
  { key: "sua-bot", label: "Sữa & Bột", icon: Milk },
  { key: "gia-vi", label: "Gia vị & Dầu ăn", icon: Package2 },
];

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
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryTab, setCategoryTab] = useState("ALL");
  const [purchaseType, setPurchaseType] = useState("ALL");
  const [unitFilter, setUnitFilter] = useState("ALL");

  const handleAddToCart = (productName: string, unitLabel: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: "Đang thêm vào giỏ hàng...",
        success: `Đã thêm ${productName} (${unitLabel}) vào giỏ!`,
        error: "Lỗi khi lưu vào giỏ hàng",
      }
    );
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      const matchCategory =
        categoryTab === "ALL" || p.categoryGroup === categoryTab;

      const hasWholesale = p.unitTypes.some((u) => u.wholesalePrice !== null);
      const hasRetail = p.unitTypes.some((u) => u.wholesalePrice === null);
      const matchPurchase =
        purchaseType === "ALL" ||
        (purchaseType === "si" && hasWholesale) ||
        (purchaseType === "le" && hasRetail);

      const matchUnit =
        unitFilter === "ALL" ||
        p.unitTypes.some((u) => u.type === unitFilter);

      return matchSearch && matchCategory && matchPurchase && matchUnit;
    });
  }, [searchTerm, categoryTab, purchaseType, unitFilter]);

  return (
    <Page>
      <PageContent className="px-0 md:px-0 py-8 md:py-10 space-y-0">
        <section>
          <Container max="8xl" className="px-4 md:px-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-surface p-8 rounded-3xl shadow-sm border border-outline-variant">
              <div>
                <h1 className="text-4xl font-extrabold text-foreground mb-2">Danh mục sản phẩm</h1>
                <p className="text-lg text-on-surface-variant font-medium">Chọn mua sỉ hoặc lẻ – Giá ưu đãi riêng cho đại lý</p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Button className="h-16 px-8 text-xl rounded-2xl font-bold shadow-sm hidden sm:flex">
                  <Link href="/checkout" className="flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6" />
                    Giỏ hàng
                  </Link>
                </Button>
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

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
              {CATEGORY_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = categoryTab === tab.key;
                return (
                  <Button
                    key={tab.key}
                    onClick={() => setCategoryTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap border transition-all ${
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-background border-outline-variant text-on-surface-variant hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.key !== "ALL" && (
                      <Badge className={`ml-1 text-[10px] px-1.5 py-0 ${active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                        {products.filter((p) => p.categoryGroup === tab.key).length}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>

            {/* Purchase Type & Unit Filters */}
            <div className="flex flex-wrap gap-3 items-center bg-surface border border-outline-variant rounded-2xl p-4">
              <Tag className="w-5 h-5 text-primary shrink-0" />
              <span className="font-bold text-foreground text-sm">Lọc theo:</span>
              <div className="flex gap-2 flex-wrap">
                {PURCHASE_TYPE_OPTS.map((opt) => (
                  <Button
                    key={opt.key}
                    onClick={() => setPurchaseType(opt.key)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                      purchaseType === opt.key
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      unitFilter === opt.key
                        ? "bg-secondary/10 text-secondary border-secondary/40"
                        : "bg-background border-outline-variant text-on-surface-variant hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Results count */}
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

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((p) => (
                <ProductCardWithUnitSelector
                  key={p.id}
                  product={p}
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
          </Container>
        </section>
      </PageContent>
    </Page>
  );
}

type Product = typeof products[0];

function ProductCardWithUnitSelector({
  product: p,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: (name: string, unitLabel: string) => void;
}) {
  const [selectedUnit, setSelectedUnit] = useState(p.unitTypes[0]);

  const isWholesale = selectedUnit.wholesalePrice !== null;
  const displayPrice = isWholesale ? selectedUnit.wholesalePrice! : selectedUnit.retailPrice;

  return (
    <div className="bg-background border border-outline-variant rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all group flex flex-col">
      <Link href={`/catalog/${p.id}`} className="block relative overflow-hidden bg-white">
        <img
          src={p.primaryImage}
          alt={p.name}
          className="w-full h-52 object-contain p-4 group-hover:scale-105 transition-transform duration-300"
        />
        {p.coupons[0] && (
          <div className="absolute top-3 left-3 bg-destructive text-white text-xs font-bold px-2 py-1 rounded-lg">
            {p.coupons[0]}
          </div>
        )}
        <Badge className="absolute top-3 right-3 bg-primary/90 text-white text-xs px-2 py-0.5">
          {p.category}
        </Badge>
      </Link>

      <div className="p-5 flex flex-col gap-3 flex-grow">
        <Link href={`/catalog/${p.id}`}>
          <h3 className="font-bold text-lg leading-snug hover:text-primary transition-colors line-clamp-2">{p.name}</h3>
        </Link>
        <p className="text-xs text-on-surface-variant font-medium">{p.brand} · {p.origin}</p>

        {/* Unit Type Selector */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Chọn loại hàng:</p>
          <div className="flex flex-wrap gap-1.5">
            {p.unitTypes.map((u) => {
              const active = selectedUnit.type === u.type;
              const isSi = u.wholesalePrice !== null;
              return (
                <Button
                  key={u.type}
                  onClick={() => setSelectedUnit(u)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    active
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

        {/* Price */}
        <div className="flex items-center gap-3 mt-auto pt-2 border-t border-outline-variant/30">
          <div>
            <p className="text-2xl font-black text-primary">{displayPrice}</p>
            {isWholesale && selectedUnit.minWholesaleQty && (
              <p className="text-xs text-on-surface-variant">Tối thiểu {selectedUnit.minWholesaleQty} {selectedUnit.type}</p>
            )}
            {!isWholesale && (
              <p className="text-xs text-on-surface-variant">Giá lẻ / {selectedUnit.type}</p>
            )}
          </div>
          <div className="ml-auto">
            {isWholesale ? (
              <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-xs">Giá Sỉ</Badge>
            ) : (
              <Badge className="bg-secondary/10 text-secondary border-secondary/20 font-bold text-xs">Giá Lẻ</Badge>
            )}
          </div>
        </div>

        <Button
          className="w-full rounded-xl font-bold"
          onClick={() => onAddToCart(p.name, selectedUnit.label)}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Thêm vào giỏ
        </Button>
      </div>
    </div>
  );
}
