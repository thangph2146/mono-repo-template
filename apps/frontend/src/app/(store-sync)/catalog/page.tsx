"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import { Container, Page, PageContent } from "@ui/components/layout";
import {
  STORE_CONTAINER_INSET,
  STORE_CONTAINER_MAX_DEFAULT,
  STORE_PAGE_CONTENT_CLASS,
  STORE_PAGE_CONTENT_EMPTY_CLASS,
} from "@ui/lib/layout-shell";
import {
  Search,
  ShoppingCart,
  Package2,
  Layers,
  Tag,
  Minus,
  Plus,
  FilterX,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Product, ProductUnitType } from "@/lib/api";
import {
  useCatalogProducts,
  useCategories,
  useCategoryUsage,
} from "@/hooks/queries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cartLineQuantity, useCart } from "@/hooks/use-cart";
import { formatVND } from "@/lib/format";
import {
  getProductUnits,
  scoreProductSearchMatch,
} from "@/lib/catalog-filters";
import { unitSellingAndListPrice } from "@/lib/product-price";
import { resolveCategoryIcon } from "@/lib/category-icons";

const PURCHASE_TYPE_OPTS = [
  { key: "ALL", label: "Tất cả (KM & ban đầu)" },
  { key: "si", label: "Có giá khuyến mãi (thùng/lốc…)" },
  { key: "le", label: "Chỉ giá ban đầu (lon/chai/gói…)" },
];

const UNIT_FILTER_OPTS = [
  { key: "ALL", label: "Tất cả đơn vị" },
  { key: "thùng", label: "Thùng" },
  { key: "can", label: "Can" },
  { key: "chai", label: "Chai/Lẻ" },
  { key: "lốc", label: "Lốc" },
  { key: "gói", label: "Gói/Lẻ" },
];

const CATALOG_PAGE_SIZE = 24;

function CatalogPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const spKey = searchParams.toString();

  const { data: categoriesData } = useCategories(true);
  const { data: usageData } = useCategoryUsage();
  const cart = useCart();

  const categories = useMemo(() => categoriesData ?? [], [categoriesData]);
  const usageMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of usageData ?? []) m.set(u.slug, u.productCount);
    return m;
  }, [usageData]);
  const totalCatalogCount = useMemo(
    () => [...usageMap.values()].reduce((a, b) => a + b, 0),
    [usageMap],
  );

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

  const [searchTerm, setSearchTerm] = useState(
    () => searchParams.get("q") ?? "",
  );
  const [categoryTab, setCategoryTab] = useState(
    () => searchParams.get("cat") ?? "ALL",
  );
  const [purchaseType, setPurchaseType] = useState(
    () => searchParams.get("mode") ?? "ALL",
  );
  const [unitFilter, setUnitFilter] = useState(
    () => searchParams.get("unit") ?? "ALL",
  );
  const [page, setPage] = useState(() => {
    const n = parseInt(searchParams.get("page") ?? "1", 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  });

  const debouncedSearch = useDebouncedValue(searchTerm, 320);

  const catalogListParams = useMemo(() => {
    const purchaseMode =
      purchaseType === "si"
        ? ("si" as const)
        : purchaseType === "le"
          ? ("le" as const)
          : undefined;
    return {
      activeOnly: true as const,
      q: debouncedSearch.trim() || undefined,
      category: categoryTab !== "ALL" ? categoryTab : undefined,
      purchaseMode,
      unitType: unitFilter !== "ALL" ? unitFilter : undefined,
      page,
      limit: CATALOG_PAGE_SIZE,
    };
  }, [debouncedSearch, categoryTab, purchaseType, unitFilter, page]);

  const { data: catalogData, isLoading, error } =
    useCatalogProducts(catalogListParams);

  const filterSignature = `${debouncedSearch.trim()}|${categoryTab}|${purchaseType}|${unitFilter}`;
  const filterBaselineRef = useRef<string | null>(null);
  useEffect(() => {
    if (filterBaselineRef.current === null) {
      filterBaselineRef.current = filterSignature;
      return;
    }
    if (filterBaselineRef.current !== filterSignature) {
      filterBaselineRef.current = filterSignature;
      setPage(1);
    }
  }, [filterSignature]);

  useEffect(() => {
    const onPop = (): void => {
      const sp = new URLSearchParams(window.location.search);
      setSearchTerm(sp.get("q") ?? "");
      setCategoryTab(sp.get("cat") ?? "ALL");
      setPurchaseType(sp.get("mode") ?? "ALL");
      setUnitFilter(sp.get("unit") ?? "ALL");
      const pn = parseInt(sp.get("page") ?? "1", 10);
      setPage(Number.isFinite(pn) && pn >= 1 ? pn : 1);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const p = new URLSearchParams();
    const dq = debouncedSearch.trim();
    if (dq) p.set("q", dq);
    if (categoryTab !== "ALL") p.set("cat", categoryTab);
    if (purchaseType !== "ALL") p.set("mode", purchaseType);
    if (unitFilter !== "ALL") p.set("unit", unitFilter);
    if (page > 1) p.set("page", String(page));
    const qs = p.toString();
    if (qs === spKey) return;
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [
    debouncedSearch,
    categoryTab,
    purchaseType,
    unitFilter,
    page,
    pathname,
    router,
    spKey,
  ]);

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

  const totalProducts = catalogData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalProducts / CATALOG_PAGE_SIZE));

  useEffect(() => {
    if (catalogData == null || isLoading) return;
    const maxPage = Math.max(
      1,
      Math.ceil(catalogData.total / CATALOG_PAGE_SIZE),
    );
    if (page > maxPage) setPage(maxPage);
  }, [catalogData, isLoading, page]);

  const displayProducts = useMemo(() => {
    const items = catalogData?.items ?? [];
    const qLower = debouncedSearch.trim().toLowerCase();
    if (!qLower) return items;
    return [...items].sort(
      (a, b) =>
        scoreProductSearchMatch(b, debouncedSearch) -
        scoreProductSearchMatch(a, debouncedSearch),
    );
  }, [catalogData?.items, debouncedSearch]);

  const hasActiveFilters =
    categoryTab !== "ALL" ||
    purchaseType !== "ALL" ||
    unitFilter !== "ALL" ||
    Boolean(searchTerm.trim());

  const clearAllFilters = (): void => {
    setCategoryTab("ALL");
    setPurchaseType("ALL");
    setUnitFilter("ALL");
    setSearchTerm("");
    setPage(1);
  };

  const activeChips: { key: string; label: string; onRemove: () => void }[] =
    [];
  if (categoryTab !== "ALL") {
    activeChips.push({
      key: "cat",
      label: `DM: ${categoryMap.get(categoryTab) ?? categoryTab}`,
      onRemove: () => setCategoryTab("ALL"),
    });
  }
  if (purchaseType !== "ALL") {
    const lab =
      PURCHASE_TYPE_OPTS.find((o) => o.key === purchaseType)?.label ??
      purchaseType;
    activeChips.push({
      key: "mode",
      label: lab,
      onRemove: () => setPurchaseType("ALL"),
    });
  }
  if (unitFilter !== "ALL") {
    const lab =
      UNIT_FILTER_OPTS.find((o) => o.key === unitFilter)?.label ?? unitFilter;
    activeChips.push({
      key: "unit",
      label: lab,
      onRemove: () => setUnitFilter("ALL"),
    });
  }
  if (searchTerm.trim()) {
    activeChips.push({
      key: "q",
      label: `“${searchTerm.trim().slice(0, 24)}${searchTerm.trim().length > 24 ? "…" : ""}”`,
      onRemove: () => setSearchTerm(""),
    });
  }

  return (
    <Page>
      <PageContent className={STORE_PAGE_CONTENT_CLASS}>
        <section>
          <Container max={STORE_CONTAINER_MAX_DEFAULT} className={`${STORE_CONTAINER_INSET} space-y-6`}>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-surface p-6 sm:p-8 rounded-3xl shadow-sm border border-outline-variant">
              <div className="min-w-0">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2 tracking-tight">
                  Danh mục sản phẩm
                </h1>
                <p className="text-base sm:text-lg text-on-surface-variant font-medium">
                  Dữ liệu lọc theo trang từ API (đang bán, tìm kiếm, danh mục, đơn
                  vị, giá ban đầu/KM). URL lưu bộ lọc để chia sẻ.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:min-w-[min(100%,28rem)]">
                <Link href="/cart" className="hidden sm:block shrink-0">
                  <Button
                    type="button"
                    className="h-14 px-6 text-base rounded-2xl font-bold shadow-sm w-full sm:w-auto"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Giỏ ({cart.unitCount})
                  </Button>
                </Link>
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                  <Input
                    type="search"
                    enterKeyHint="search"
                    autoComplete="off"
                    aria-label="Tìm sản phẩm"
                    placeholder="SKU, tên, thương hiệu, danh mục…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 h-14 text-base sm:text-lg w-full rounded-2xl bg-background border-outline-variant shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div
              className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
              role="tablist"
              aria-label="Danh mục"
            >
              {categoryTabs.map((tab) => {
                const Icon = tab.icon;
                const active = categoryTab === tab.key;
                const count =
                  tab.key === "ALL"
                    ? totalCatalogCount
                    : (usageMap.get(tab.key) ?? 0);
                return (
                  <Button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setCategoryTab(tab.key)}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap border transition-all shrink-0 ${active
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-background border-outline-variant text-on-surface-variant hover:bg-muted"
                      }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden />
                    {tab.label}
                    <Badge
                      className={`ml-0.5 text-[10px] px-1.5 py-0 tabular-nums ${active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}
                    >
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 bg-surface border border-outline-variant rounded-2xl p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="w-5 h-5 text-primary shrink-0" aria-hidden />
                <span className="font-bold text-foreground text-sm">
                  Kiểu mua &amp; đơn vị
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 sm:items-center">
                <div className="flex gap-2 flex-wrap">
                  {PURCHASE_TYPE_OPTS.map((opt) => (
                    <Button
                      key={opt.key}
                      type="button"
                      size="sm"
                      onClick={() => setPurchaseType(opt.key)}
                      className={`rounded-lg text-sm font-semibold border transition-all ${purchaseType === opt.key
                          ? "bg-primary/10 text-primary border-primary/40"
                          : "bg-background border-outline-variant text-on-surface-variant hover:bg-muted"
                        }`}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
                <div className="hidden sm:block w-px h-7 bg-border shrink-0" />
                <div className="flex gap-2 flex-wrap">
                  {UNIT_FILTER_OPTS.map((opt) => (
                    <Button
                      key={opt.key}
                      type="button"
                      size="sm"
                      onClick={() => setUnitFilter(opt.key)}
                      className={`rounded-lg text-xs font-semibold border transition-all ${unitFilter === opt.key
                          ? "bg-secondary/15 text-secondary-foreground border-secondary/40"
                          : "bg-background border-outline-variant text-on-surface-variant hover:bg-muted"
                        }`}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Đang lọc:
                </span>
                {activeChips.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={c.onRemove}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/5 pl-2.5 pr-1 py-0.5 text-xs font-medium text-foreground hover:bg-primary/10 transition-colors"
                  >
                    {c.label}
                    <span className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-primary/15">
                      <X className="h-3 w-3" aria-hidden />
                    </span>
                  </button>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1 text-muted-foreground"
                  onClick={clearAllFilters}
                >
                  <FilterX className="h-3.5 w-3.5" />
                  Xóa hết
                </Button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-sm text-on-surface-variant font-medium">
                Trang{" "}
                <span className="font-bold text-foreground tabular-nums">
                  {page}
                </span>
                /{totalPages} —{" "}
                <span className="font-bold text-foreground tabular-nums">
                  {displayProducts.length}
                </span>
                /{totalProducts} sản phẩm khớp bộ lọc
                {debouncedSearch !== searchTerm && searchTerm.trim() ? (
                  <span className="text-muted-foreground text-xs ml-2">
                    (đang gõ…)
                  </span>
                ) : null}
              </p>
              {hasActiveFilters && activeChips.length === 0 ? (
                <Button
                  type="button"
                  variant="link"
                  onClick={clearAllFilters}
                  className="text-sm text-primary font-semibold h-auto p-0 sm:self-auto"
                >
                  Xóa bộ lọc
                </Button>
              ) : null}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {displayProducts.map((p) => (
                    <ProductCardWithUnitSelector
                      key={p.id}
                      product={p}
                      categoryLabel={categoryMap.get(p.category) ?? p.category}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>

                {totalPages > 1 ? (
                  <nav
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10 pb-2"
                    aria-label="Phân trang danh mục"
                  >
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-xl h-11 w-11 shrink-0"
                        disabled={page <= 1 || isLoading}
                        onClick={() => {
                          setPage((prev) => Math.max(1, prev - 1));
                          window.scrollTo({
                            top: 0,
                            behavior: "smooth",
                          });
                        }}
                        aria-label="Trang trước"
                      >
                        <ChevronLeft className="h-5 w-5" aria-hidden />
                      </Button>
                      <span className="text-sm font-semibold tabular-nums min-w-[5.5rem] text-center px-2">
                        {page} / {totalPages}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-xl h-11 w-11 shrink-0"
                        disabled={page >= totalPages || isLoading}
                        onClick={() => {
                          setPage((prev) => Math.min(totalPages, prev + 1));
                          window.scrollTo({
                            top: 0,
                            behavior: "smooth",
                          });
                        }}
                        aria-label="Trang sau"
                      >
                        <ChevronRight className="h-5 w-5" aria-hidden />
                      </Button>
                    </div>
                  </nav>
                ) : null}

                {displayProducts.length === 0 && (
                  <div className="text-center py-16 px-4 bg-muted/20 border border-dashed border-outline-variant rounded-2xl">
                    <Package2 className="w-16 h-16 mx-auto text-outline-variant opacity-30 mb-4" aria-hidden />
                    <p className="text-xl sm:text-2xl font-bold text-foreground">
                      Không tìm thấy sản phẩm phù hợp
                    </p>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
                      Thử bỏ bớt bộ lọc hoặc từ khóa ngắn hơn (SKU, tên, thương hiệu).
                    </p>
                    {hasActiveFilters ? (
                      <Button
                        type="button"
                        className="mt-6 rounded-xl font-bold"
                        onClick={clearAllFilters}
                      >
                        <FilterX className="w-4 h-4 mr-2" />
                        Xóa bộ lọc
                      </Button>
                    ) : null}
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

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <Page>
          <PageContent className={STORE_PAGE_CONTENT_EMPTY_CLASS}>
            <Loader2
              className="h-10 w-10 animate-spin text-primary"
              aria-label="Đang tải danh mục"
            />
          </PageContent>
        </Page>
      }
    >
      <CatalogPageInner />
    </Suspense>
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
  const cart = useCart();
  const units = useMemo(() => getProductUnits(p), [p]);
  const [selectedUnit, setSelectedUnit] = useState<ProductUnitType>(units[0]!);
  const [quantity, setQuantity] = useState(1);

  const qtyInCart = cartLineQuantity(cart.lines, p.id, selectedUnit.type);
  const pricingQty = qtyInCart + quantity;

  const isWholesale = selectedUnit.wholesalePrice !== null;
  const { current: displayPrice, list: listPrice } = unitSellingAndListPrice(
    selectedUnit,
    pricingQty,
  );

  const maxQty = Math.max(
    1,
    Math.floor(p.stock / Math.max(selectedUnit.qtyPerUnit, 1)),
  );
  /** Luôn cho mua từ 1; `minWholesaleQty` chỉ quyết định giá KM hay giá ban đầu. */
  const minPurchaseQty = 1;
  const outOfStock = maxQty <= 0;

  const primaryImage = p.images?.[0];
  const firstCoupon = p.coupons?.[0];

  const changeUnit = (u: ProductUnitType) => {
    setSelectedUnit(u);
    setQuantity(1);
  };

  return (
    <div className="bg-background border border-outline-variant rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all group flex flex-col">
      <Link href={`/catalog/${p.id}`} className="block relative overflow-hidden bg-white">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={p.name}
            className="w-full aspect-[4/5] max-h-80 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full aspect-[4/5] max-h-80 flex items-center justify-center bg-muted/30">
            <Package2 className="w-12 h-12 text-outline-variant" aria-hidden />
          </div>
        )}
        {firstCoupon && (
          <div className="absolute top-3 left-3 max-w-[60%] rounded-lg bg-destructive px-2 py-1 text-[10px] font-bold leading-tight text-white whitespace-normal break-words shadow-sm">
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
                  {isSi && (
                    <span className="ml-1 opacity-70">• Khuyến mãi</span>
                  )}
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
                Giá KM khi đặt ≥ {selectedUnit.minWholesaleQty} {selectedUnit.type}
                {qtyInCart > 0 && (
                  <span className="block text-[10px] mt-0.5 text-muted-foreground">
                    Giỏ: {qtyInCart} · Lần này: {quantity} → tổng xét giá:{" "}
                    <span className="font-semibold text-foreground">
                      {pricingQty}
                    </span>
                  </span>
                )}
                {pricingQty < selectedUnit.minWholesaleQty && (
                  <span className="block text-[10px] mt-0.5 text-muted-foreground">
                    Tổng {pricingQty} vẫn chưa đủ điều kiện KM — có thể mua 1.
                  </span>
                )}
                {pricingQty >= selectedUnit.minWholesaleQty && qtyInCart > 0 && (
                  <span className="block text-[10px] mt-0.5 text-emerald-700 dark:text-emerald-400 font-medium">
                    Gộp giỏ + lần này đủ điều kiện KM.
                  </span>
                )}
              </p>
            )}
            {!isWholesale && (
              <p className="text-xs text-on-surface-variant">
                Giá ban đầu / {selectedUnit.type}
              </p>
            )}
          </div>
          <div className="ml-auto text-right">
            {isWholesale ? (
              <Badge
                className={
                  listPrice != null
                    ? "bg-primary/10 text-primary border-primary/20 font-bold text-xs"
                    : "bg-secondary/10 text-secondary-foreground border-secondary/20 font-bold text-xs"
                }
              >
                {listPrice != null ? "Giá KM (đủ SL)" : "Giá ban đầu"}
              </Badge>
            ) : (
              <Badge className="bg-secondary/10 text-secondary border-secondary/20 font-bold text-xs">
                Giá ban đầu
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
              onClick={() =>
                setQuantity((q) => Math.max(minPurchaseQty, q - 1))
              }
              disabled={outOfStock || quantity <= minPurchaseQty}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <input
              type="number"
              value={quantity}
              min={minPurchaseQty}
              max={maxQty}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n)) {
                  setQuantity(
                    Math.min(Math.max(n, minPurchaseQty), maxQty),
                  );
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
