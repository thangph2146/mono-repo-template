"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
} from "@tanstack/react-table";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  type Resolver,
} from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import { Badge } from "@ui/components/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ui/components/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { ScrollArea } from "@ui/components/scroll-area";
import {
  AlertTriangle,
  ArchiveRestore,
  FilterX,
  ImageIcon,
  Layers,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { ApiError, type Product, type ProductUnitType } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
import {
  useAdjustStock,
  useCategories,
  useCategoryUsage,
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  usePurgeTrashedProduct,
  useRestoreProduct,
  useTrashedProducts,
  useUpdateProduct,
} from "@/hooks/queries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatVND } from "@/lib/format";
import { unitSellingAndListPrice } from "@/lib/product-price";
import {
  getProductSubRows,
  productsToTreeRows,
  type ProductTreeRow,
} from "@/lib/admin-inventory-tree";
import {
  applyInventoryLineOnlyFilter,
  inventoryFiltersToProductListParams,
  inventoryHasLineOnlyFilter,
} from "@/lib/inventory-api-filters";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminTablePaginationFooter } from "@/components/admin-table-pagination-footer";
import { resolveCategoryIcon } from "@/lib/category-icons";
import {
  defaultProductForm,
  defaultUnitRow,
  formValuesToCreatePayload,
  MAX_PRODUCT_IMAGE_BYTES,
  productFormSchema,
  productToFormValues,
  validateProductImageField,
  type ProductFormValues,
} from "./product-form";

type StockStatus = "Còn hàng" | "Sắp hết" | "Hết hàng";

const computeStatus = (stock: number): StockStatus => {
  if (stock <= 0) return "Hết hàng";
  if (stock < 50) return "Sắp hết";
  return "Còn hàng";
};

function fieldError(
  err: { message?: string } | undefined,
): string | undefined {
  return err?.message;
}

/** Preview trong form: URL / data URL; nếu tải lỗi vẫn hiện placeholder thay vì khung trống. */
function InventoryImagePreview({ value }: { value: string }) {
  const trimmed = (value ?? "").trim();
  const canTryLoad =
    /^https?:\/\//i.test(trimmed) || /^data:image\//i.test(trimmed);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [trimmed]);

  const showPlaceholder = !canTryLoad || broken;

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-outline-variant bg-muted/40">
      {canTryLoad && !broken && (
        // eslint-disable-next-line @next/next/no-img-element -- preview URL/data URL trong admin
        <img
          src={trimmed}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      )}
      {showPlaceholder && (
        <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center text-muted-foreground">
          <ImageIcon className="h-8 w-8 opacity-50" />
          <span className="text-[10px] font-medium leading-snug">
            {broken
              ? "Không tải được ảnh — kiểm tra URL hoặc file"
              : "URL hoặc tải ảnh từ máy để xem trước"}
          </span>
        </div>
      )}
    </div>
  );
}

function UnitRowSaleHint(
  unit: Pick<
    ProductUnitType,
    | "type"
    | "label"
    | "retailPrice"
    | "wholesalePrice"
    | "minWholesaleQty"
    | "qtyPerUnit"
  >,
): ReactNode {
  const retail = Math.max(0, Math.floor(Number(unit.retailPrice) || 0));
  const rawW = unit.wholesalePrice;
  const wholesale =
    rawW === null || rawW === undefined || !Number.isFinite(Number(rawW))
      ? null
      : Math.floor(Number(rawW));
  const minQ = Math.max(0, Math.floor(Number(unit.minWholesaleQty) || 0));
  const unitWord = String(unit.type).trim() || "đơn vị";

  const rowUnit: ProductUnitType = {
    type: unit.type,
    label: unit.label,
    retailPrice: retail,
    wholesalePrice: wholesale,
    minWholesaleQty: minQ,
    qtyPerUnit: Math.max(1, Math.floor(Number(unit.qtyPerUnit) || 1)),
  };

  if (wholesale === null || wholesale <= 0 || wholesale >= retail) {
    return (
      <p className="text-[10px] text-muted-foreground sm:col-span-12 -mt-1">
        Trên cửa hàng: <strong>{formatVND(retail)}</strong>
        <span className="font-normal"> (chỉ giá ban đầu — chưa nhập giá KM thấp hơn)</span>
      </p>
    );
  }

  const { current: priceWhenEligible, list: listWhenEligible } =
    unitSellingAndListPrice(rowUnit, minQ <= 0 ? 1 : minQ);
  const hasThreshold = minQ > 0;
  const belowQty = hasThreshold && minQ > 1 ? minQ - 1 : null;
  const { current: priceBelow } =
    belowQty != null
      ? unitSellingAndListPrice(rowUnit, belowQty)
      : { current: retail };

  return (
    <div className="text-[10px] text-muted-foreground sm:col-span-12 -mt-1 space-y-1">
      {hasThreshold ? (
        <p>
          <span className="font-semibold text-foreground">Điều kiện SL:</span> đặt{" "}
          <strong className="text-foreground">≥ {minQ}</strong>{" "}
          <span className="font-mono">{unitWord}</span> (cùng dòng này, cùng sản phẩm)
          → giá{" "}
          <strong className="text-destructive">{formatVND(priceWhenEligible)}</strong>
          {listWhenEligible != null && (
            <>
              {" "}
              <span className="line-through opacity-70">
                {formatVND(listWhenEligible)}
              </span>
            </>
          )}
          {belowQty != null ? (
            <>
              ; dưới <strong>{minQ}</strong> <span className="font-mono">{unitWord}</span>{" "}
              (vd. {belowQty}) → <strong>{formatVND(priceBelow)}</strong> (giá ban đầu).
            </>
          ) : (
            <> — từ 1 {unitWord} trở lên đã áp giá khuyến mãi.</>
          )}
        </p>
      ) : (
        <p>
          <span className="font-semibold text-foreground">Điều kiện SL:</span>{" "}
          <strong>SL tối thiểu = 0</strong> — áp giá khuyến mãi ngay từ{" "}
          <strong>1 {unitWord}</strong> trở lên.
        </p>
      )}
      <p>
        Trên cửa hàng (khi đủ điều kiện):{" "}
        {listWhenEligible != null && listWhenEligible > priceWhenEligible ? (
          <>
            <span className="line-through opacity-70">
              {formatVND(listWhenEligible)}
            </span>{" "}
            <strong className="text-destructive">{formatVND(priceWhenEligible)}</strong>
            <Badge
              variant="outline"
              className="ml-1.5 align-middle text-[9px] py-0 font-bold"
            >
              Sale
            </Badge>
          </>
        ) : (
          <>
            <strong>{formatVND(priceWhenEligible)}</strong>
            <span className="font-normal"> (giá ban đầu)</span>
          </>
        )}
      </p>
    </div>
  );
}

const INVENTORY_PRODUCT_FORM_ID = "inventory-product-dialog-form";

export default function InventoryPage() {
  const { user } = useAuth();
  const canWriteProducts = user
    ? canUserAccess(user, PERMISSION_CODES.PRODUCTS_WRITE)
    : false;
  const { data: categoriesData } = useCategories();
  const { data: usageData } = useCategoryUsage();
  const categories = useMemo(() => categoriesData ?? [], [categoriesData]);
  const usageMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of usageData ?? []) m.set(u.slug, u.productCount);
    return m;
  }, [usageData]);
  const categoryNameBySlug = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.slug, c.name);
    return m;
  }, [categories]);

  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedColumnFilters = useDebouncedValue(columnFilters, 350);
  const debouncedGlobalFilter = useDebouncedValue(globalFilter, 350);

  const productListParamsBase = useMemo(
    () =>
      inventoryFiltersToProductListParams(
        categoryFilter,
        debouncedColumnFilters,
        debouncedGlobalFilter,
      ),
    [categoryFilter, debouncedColumnFilters, debouncedGlobalFilter],
  );

  const filterSignature = useMemo(
    () => JSON.stringify(productListParamsBase),
    [productListParamsBase],
  );

  const [page, setPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(20);

  useEffect(() => {
    setPage(1);
  }, [filterSignature, listPageSize]);

  const productListParams = useMemo(
    () => ({
      ...productListParamsBase,
      page,
      limit: listPageSize,
    }),
    [productListParamsBase, page, listPageSize],
  );

  const { data, isLoading, error } = useProducts({
    listParams: productListParams,
  });
  const inventory = useMemo(() => data?.items ?? [], [data?.items]);
  const totalProducts = data?.total ?? 0;

  const clearAllFilters = (): void => {
    setCategoryFilter("ALL");
    setColumnFilters([]);
    setGlobalFilter("");
    setPage(1);
  };

  const clearTrashFilters = useCallback((): void => {
    setTrashGlobalFilter("");
    setTrashPage(1);
  }, []);

  /** Tab danh mục và ô « Lọc theo cột → Danh mục » dùng chung state gọi API. */
  const applyCategoryTab = useCallback((group: string): void => {
    setCategoryFilter(group);
    setColumnFilters((prev) => {
      const rest = prev.filter((f) => f.id !== "category");
      if (group === "ALL") return rest;
      return [...rest, { id: "category", value: group }];
    });
  }, []);

  const handleColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>(
    (updater) => {
      setColumnFilters((prev) => {
        const next =
          typeof updater === "function" ? updater(prev) : updater;
        const catRaw = next.find((f) => f.id === "category")?.value;
        if (catRaw != null && String(catRaw) !== "") {
          setCategoryFilter(String(catRaw));
        } else {
          setCategoryFilter("ALL");
        }
        return next;
      });
    },
    [],
  );

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const restoreProduct = useRestoreProduct();
  const purgeTrashedProduct = usePurgeTrashedProduct();
  const adjustStock = useAdjustStock();

  const [mainTab, setMainTab] = useState<"inventory" | "trash">("inventory");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Product | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<Product | null>(null);
  const [trashPage, setTrashPage] = useState(1);
  const [trashPageSize, setTrashPageSize] = useState(20);
  const [trashGlobalFilter, setTrashGlobalFilter] = useState("");
  const debouncedTrashQ = useDebouncedValue(trashGlobalFilter, 350);

  useEffect(() => {
    setTrashPage(1);
  }, [debouncedTrashQ, mainTab, trashPageSize]);

  const trashListParams = useMemo(
    () => ({
      page: trashPage,
      limit: trashPageSize,
      q: debouncedTrashQ.trim() || undefined,
    }),
    [trashPage, trashPageSize, debouncedTrashQ],
  );

  const { data: trashedData, isLoading: trashedLoading, error: trashedError } =
    useTrashedProducts({
      enabled: mainTab === "trash" && canWriteProducts,
      listParams: trashListParams,
    });

  const defaultCategory = categories[0]?.slug ?? "thuc-pham";

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormValues>,
    defaultValues: defaultProductForm(defaultCategory),
  });

  const { control, register, handleSubmit, reset, formState, watch, setValue } =
    form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "unitTypes",
  });

  const imageList = watch("images") ?? [];
  const watchedUnitTypes = watch("unitTypes");
  const couponRows = watch("coupons") ?? [""];

  const appendCouponRow = (): void => {
    setValue("coupons", [...couponRows, ""], {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const removeCouponRow = (idx: number): void => {
    if (couponRows.length <= 1) return;
    setValue(
      "coupons",
      couponRows.filter((_, i) => i !== idx),
      { shouldValidate: true, shouldDirty: true },
    );
  };
  const appendImage = (): void => {
    setValue("images", [...imageList, ""]);
  };
  const removeImageAt = (idx: number): void => {
    if (imageList.length <= 1) return;
    setValue(
      "images",
      imageList.filter((_, i) => i !== idx),
    );
  };

  const onPickProductImage = useCallback(
    (idx: number, files: FileList | null): void => {
      const file = files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Chỉ chọn file ảnh");
        return;
      }
      if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
        toast.error(
          `Ảnh tối đa ${MAX_PRODUCT_IMAGE_BYTES / (1024 * 1024)}MB`,
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = (): void => {
        const dataUrl = reader.result;
        if (typeof dataUrl !== "string") return;
        const check = validateProductImageField(dataUrl);
        if (check !== true) {
          toast.error(check);
          return;
        }
        setValue(`images.${idx}`, dataUrl, {
          shouldValidate: true,
          shouldDirty: true,
        });
      };
      reader.onerror = (): void => {
        toast.error("Không đọc được file");
      };
      reader.readAsDataURL(file);
    },
    [setValue],
  );

  const categoryTabs = useMemo(
    () => [
      { key: "Tất cả", group: "ALL", icon: Layers },
      ...categories.map((c) => ({
        key: c.name,
        group: c.slug,
        icon: resolveCategoryIcon(c.icon),
      })),
    ],
    [categories],
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const openCreate = (): void => {
    setEditingId(null);
    reset(defaultProductForm(defaultCategory));
    setDialogOpen(true);
  };

  const openEdit = (product: Product): void => {
    setEditingId(product.id);
    reset(productToFormValues(product));
    setDialogOpen(true);
  };

  const onDialogOpenChange = (open: boolean): void => {
    setDialogOpen(open);
    if (!open) {
      setEditingId(null);
    }
  };

  const onValidSubmit = async (values: ProductFormValues): Promise<void> => {
    try {
      const payload = formValuesToCreatePayload(values);
      if (editingId != null) {
        await updateProduct.mutateAsync({ id: editingId, input: payload });
        toast.success(`Đã cập nhật ${payload.name}`);
      } else {
        await createProduct.mutateAsync(payload);
        toast.success(`Đã tạo sản phẩm ${payload.name}`);
      }
      setDialogOpen(false);
      setEditingId(null);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Lưu sản phẩm thất bại";
      toast.error(msg);
    }
  };

  const requestDeleteProduct = (product: Product): void => {
    setDeleteTarget(product);
  };

  const requestRestoreProduct = (product: Product): void => {
    setRestoreTarget(product);
  };

  const confirmDeleteProduct = (): void => {
    if (!deleteTarget) return;
    const p = deleteTarget;
    toast.promise(
      deleteProduct.mutateAsync(p.id).then(() => setDeleteTarget(null)),
      {
        loading: `Đang đưa «${p.name}» vào thùng rác...`,
        success: `Đã xóa tạm «${p.name}»`,
        error: (err: unknown) =>
          err instanceof ApiError ? err.message : "Không xóa được sản phẩm",
      },
    );
  };

  const confirmRestoreProduct = (): void => {
    if (!restoreTarget) return;
    const p = restoreTarget;
    toast.promise(
      restoreProduct.mutateAsync(p.id).then(() => setRestoreTarget(null)),
      {
        loading: `Đang khôi phục «${p.name}»...`,
        success: `Đã khôi phục «${p.name}» vào kho`,
        error: (err: unknown) =>
          err instanceof ApiError ? err.message : "Không khôi phục được",
      },
    );
  };

  const confirmPurgeProduct = (): void => {
    if (!purgeTarget) return;
    const p = purgeTarget;
    toast.promise(
      purgeTrashedProduct.mutateAsync(p.id).then(() => setPurgeTarget(null)),
      {
        loading: `Đang xóa vĩnh viễn «${p.name}»...`,
        success: `Đã xóa vĩnh viễn «${p.name}»`,
        error: (err: unknown) =>
          err instanceof ApiError ? err.message : "Không xóa vĩnh viễn được",
      },
    );
  };

  const trashProductColumns: ColumnDef<Product>[] = [
    {
      accessorKey: "sku",
      header: "SKU",
      enableColumnFilter: false,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{String(getValue())}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Tên",
      enableColumnFilter: false,
      cell: ({ getValue }) => (
        <span className="max-w-[200px] truncate font-medium block">
          {String(getValue())}
        </span>
      ),
    },
    {
      accessorKey: "category",
      header: "Danh mục",
      enableColumnFilter: false,
      cell: ({ row }) =>
        categoryNameBySlug.get(row.original.category) ??
        row.original.category,
    },
    {
      accessorKey: "deletedAt",
      header: "Xóa lúc",
      enableColumnFilter: false,
      cell: ({ getValue }) => {
        const v = getValue() as string | null | undefined;
        return (
          <span className="text-muted-foreground text-xs">
            {v ? new Date(v).toLocaleString("vi-VN") : "—"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      enableColumnFilter: false,
      enableSorting: false,
      meta: { disableColumnFilter: true },
      cell: ({ row }) => (
        <div className="flex flex-wrap justify-end gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-lg"
            onClick={() => requestRestoreProduct(row.original)}
            disabled={restoreProduct.isPending || purgeTrashedProduct.isPending}
          >
            <ArchiveRestore className="size-3.5" />
            Khôi phục
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => setPurgeTarget(row.original)}
            disabled={restoreProduct.isPending || purgeTrashedProduct.isPending}
          >
            <Trash2 className="size-3.5" />
            Xóa hẳn
          </Button>
        </div>
      ),
    },
  ];

  const handleAdjust = (product: Product, delta: number): void => {
    toast.promise(
      adjustStock.mutateAsync({
        id: product.id,
        input: { delta, reason: "manual-adjust" },
      }),
      {
        loading: `${delta > 0 ? "Nhập" : "Xuất"} ${Math.abs(delta)} ${product.unit}...`,
        success: (p) => `Tồn kho ${p.name}: ${p.stock} ${p.unit}`,
        error: (err: unknown) =>
          err instanceof ApiError ? err.message : "Cập nhật tồn kho thất bại",
      },
    );
  };

  const baseTreeRows = useMemo(
    () => productsToTreeRows(inventory),
    [inventory],
  );
  const lineOnly = useMemo(
    () => inventoryHasLineOnlyFilter(columnFilters),
    [columnFilters],
  );
  const treeRows = useMemo(
    () => applyInventoryLineOnlyFilter(baseTreeRows, lineOnly),
    [baseTreeRows, lineOnly],
  );

  const inventoryCategoryFilterOptions = useMemo(
    () =>
      categories.map((c) => ({
        value: c.slug,
        label: `${c.name} (${c.slug})`,
      })),
    [categories],
  );

  const inventoryBrandFilterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of inventory) {
      const b = (p.brand ?? "").trim();
      set.add(b.length ? b : "—");
    }
    return [...set]
      .sort((a, b) => a.localeCompare(b, "vi"))
      .map((b) => ({
        value: b,
        label: b === "—" ? "(Không có thương hiệu)" : b,
      }));
  }, [inventory]);

  const inventoryColumns: ColumnDef<ProductTreeRow>[] = [
    {
      accessorKey: "sku",
      header: "SKU",
      meta: { filterPlaceholder: "Lọc SKU" },
    },
    {
      accessorKey: "name",
      header: "Tên / Đơn vị",
      meta: { filterPlaceholder: "Lọc tên" },
    },
    {
      accessorKey: "category",
      header: "Danh mục",
      filterFn: (row, id, v) => {
        if (v == null || v === "") return true;
        return String(row.getValue(id)) === String(v);
      },
      meta: {
        filterVariant: "select",
        filterLabel: "Danh mục",
        selectOptions: inventoryCategoryFilterOptions,
      },
    },
    {
      accessorKey: "brand",
      header: "Thương hiệu",
      filterFn: (row, id, v) => {
        if (v == null || v === "") return true;
        return String(row.getValue(id)) === String(v);
      },
      meta: {
        filterVariant: "select",
        filterLabel: "Thương hiệu",
        selectOptions: inventoryBrandFilterOptions,
      },
    },
    {
      id: "couponTags",
      header: "Tag / ưu đãi",
      enableColumnFilter: false,
      cell: ({ row }) => {
        const r = row.original;
        if (r.rowKind === "unit") {
          return <span className="text-muted-foreground">—</span>;
        }
        const tags = r.product.coupons ?? [];
        if (tags.length === 0) {
          return <span className="text-muted-foreground text-xs">—</span>;
        }
        return (
          <div className="flex max-w-[220px] flex-wrap gap-1">
            {tags.map((t) => (
              <Badge
                key={t}
                variant="secondary"
                className="border-destructive/25 bg-destructive/10 text-[10px] font-semibold text-destructive"
              >
                {t}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "stock",
      header: "Tồn",
      filterFn: (row, id, v) => {
        if (v == null || v === "") return true;
        return Number(row.getValue(id)) === Number(v);
      },
      cell: ({ row, getValue }) => {
        const n = Number(getValue());
        const u = row.original.unit;
        return `${n.toLocaleString("vi-VN")} ${u}`;
      },
      meta: { filterVariant: "number", filterPlaceholder: "Tồn = …" },
    },
    {
      accessorKey: "retailPrice",
      header: "Giá trên shop",
      filterFn: (row, id, v) => {
        if (v == null || v === "") return true;
        return Number(row.getValue(id)) === Number(v);
      },
      cell: ({ row, getValue }) => {
        const r = row.original;
        if (r.rowKind === "unit") {
          const min = Math.max(0, Math.floor(r.unitRow.minWholesaleQty ?? 0));
          const previewQty = min > 0 ? min : 1;
          const { current, list } = unitSellingAndListPrice(
            r.unitRow,
            previewQty,
          );
          return (
            <div className="flex flex-col gap-0.5 text-sm tabular-nums">
              {list != null && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatVND(list)}
                </span>
              )}
              <span className="font-medium">
                {formatVND(current)}
                {list != null && (
                  <Badge
                    variant="outline"
                    className="ml-1.5 align-middle text-[9px] font-bold py-0"
                  >
                    Sale
                  </Badge>
                )}
              </span>
            </div>
          );
        }
        return formatVND(Number(getValue()));
      },
      meta: { filterVariant: "number", filterPlaceholder: "Giá = …" },
    },
    {
      accessorKey: "isActiveLabel",
      header: "Kênh bán",
      filterFn: (row, id, v) => {
        if (v == null || v === "") return true;
        return String(row.getValue(id)) === String(v);
      },
      cell: ({ row, getValue }) =>
        row.original.rowKind === "unit" ? "—" : String(getValue()),
      meta: {
        filterVariant: "select",
        selectOptions: [
          { value: "Còn bán", label: "Còn bán" },
          { value: "Ngừng", label: "Ngừng" },
        ],
      },
    },
    {
      id: "stockBand",
      accessorFn: (r) =>
        r.rowKind === "product"
          ? computeStatus(r.stock)
          : computeStatus(r.parentStock),
      header: "Mức tồn",
      cell: ({ row, getValue }) =>
        row.original.rowKind === "unit" ? "—" : String(getValue()),
      filterFn: (row, id, v) => {
        if (v == null || v === "") return true;
        if (v === "__line__") {
          if (row.original.rowKind === "unit") return true;
          if (row.original.rowKind === "product") {
            const sr = row.subRows;
            return !!(sr && sr.length > 0);
          }
          return false;
        }
        return String(row.getValue(id)) === String(v);
      },
      meta: {
        filterVariant: "select",
        selectOptions: [
          { value: "__line__", label: "Chỉ dòng đơn vị" },
          { value: "Còn hàng", label: "Còn hàng" },
          { value: "Sắp hết", label: "Sắp hết" },
          { value: "Hết hàng", label: "Hết hàng" },
        ],
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      enableColumnFilter: false,
      enableSorting: false,
      meta: { disableColumnFilter: true },
      cell: ({ row }) => {
        const r = row.original;
        if (r.rowKind !== "product") return null;
        const item = r.product;
        const status = computeStatus(item.stock);
        return (
          <div className="flex flex-wrap items-center gap-1">
            {canWriteProducts && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => handleAdjust(item, -1)}
                  disabled={adjustStock.isPending || item.stock <= 0}
                  aria-label="Xuất 1"
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => handleAdjust(item, 1)}
                  disabled={adjustStock.isPending}
                  aria-label="Nhập 1"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-lg font-bold text-primary"
                  onClick={() => openEdit(item)}
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Sửa
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-lg text-destructive"
                  onClick={() => requestDeleteProduct(item)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
            <Badge
              variant="outline"
              className={
                status === "Còn hàng"
                  ? "bg-success/15 text-success border-success/20"
                  : status === "Sắp hết"
                    ? "bg-warning/15 text-warning border-warning/20"
                    : "bg-destructive/15 text-destructive border-destructive/20"
              }
            >
              {status === "Sắp hết" && (
                <AlertTriangle className="w-3 h-3 mr-1 inline" />
              )}
              {status}
            </Badge>
          </div>
        );
      },
    },
  ];

  const submitting =
    formState.isSubmitting ||
    createProduct.isPending ||
    updateProduct.isPending;

  const trashedItems = trashedData?.items ?? [];
  const trashTotal = trashedData?.total ?? 0;

  const trashInventoryPaginationFooter = (
    <AdminTablePaginationFooter
      page={trashPage}
      pageSize={trashPageSize}
      total={trashTotal}
      isLoading={trashedLoading}
      onPageChange={setTrashPage}
      onPageSizeChange={setTrashPageSize}
      emptySummary="Không có sản phẩm trong thùng rác"
      itemLabel="sản phẩm"
    />
  );

  const inventoryPaginationFooter = (
    <AdminTablePaginationFooter
      page={page}
      pageSize={listPageSize}
      total={totalProducts}
      isLoading={isLoading}
      onPageChange={setPage}
      onPageSizeChange={setListPageSize}
      emptySummary="Không có sản phẩm"
      itemLabel="sản phẩm"
    />
  );

  useEffect(() => {
    if (!canWriteProducts && mainTab === "trash") setMainTab("inventory");
  }, [canWriteProducts, mainTab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground">
            Quản lý Hàng hóa &amp; Kho
          </h1>
          <p className="text-on-surface-variant font-medium mt-1">
            Phân loại danh mục, quản lý đơn vị (thùng / can / chai / lốc / gói)
            và theo dõi tồn kho theo thời gian thực
          </p>
          {user && !canWriteProducts && (
            <p className="text-sm text-amber-800 dark:text-amber-200/90 mt-2 font-medium">
              Chế độ chỉ xem: tài khoản không có quyền{" "}
              <span className="font-mono">products.write</span> — không thể
              thêm/sửa/xoá hay điều chỉnh tồn.
            </p>
          )}
        </div>
        {canWriteProducts && (
          <Button
            onClick={openCreate}
            className="flex items-center gap-2 shadow-md h-12 px-6 rounded-xl font-bold"
          >
            <Plus className="w-5 h-5" /> Thêm sản phẩm mới
          </Button>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={onDialogOpenChange}>
        <DialogContent className="sm:max-w-7xl flex-col gap-0 p-0">
          <div className="w-full min-w-0 shrink-0 space-y-1.5 px-4 pt-4 pr-12">
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold">
                {editingId != null ? "Sửa sản phẩm" : "Thêm sản phẩm"}
              </DialogTitle>
              <DialogDescription>
                SKU, danh mục, xuất xứ, tag trên cửa hàng, ảnh và đơn vị tính với
                giá ban đầu và giá khuyến mãi. Mỗi sản phẩm có bảng giá theo từng loại
                hàng riêng —{" "}
                <span className="font-medium">
                  không gộp điều kiện KM giữa các sản phẩm
                </span>
                . Khi đặt đủ &quot;SL tối thiểu (KM)&quot; trên một dòng đơn vị, giá
                áp dụng là giá khuyến mãi của đúng dòng đó (khác với mã coupon nhập
                tay ở bước thanh toán).
              </DialogDescription>
            </DialogHeader>
          </div>
          <ScrollArea className="min-h-0 w-full min-w-0 flex-1 max-h-[70vh] overflow-y-auto">
            <form
              id={INVENTORY_PRODUCT_FORM_ID}
              onSubmit={handleSubmit(onValidSubmit)}
              className="space-y-6 p-4"
            >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="psku">Mã SKU</Label>
                <Input
                  id="psku"
                  {...register("sku")}
                  placeholder="VD: CC-320-24"
                  disabled={editingId != null}
                  aria-invalid={!!formState.errors.sku}
                />
                {fieldError(formState.errors.sku) && (
                  <p className="text-xs text-destructive">
                    {formState.errors.sku?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pname">Tên sản phẩm</Label>
                <Input
                  id="pname"
                  {...register("name")}
                  placeholder="VD: Coca-Cola 320ml"
                  aria-invalid={!!formState.errors.name}
                />
                {fieldError(formState.errors.name) && (
                  <p className="text-xs text-destructive">
                    {formState.errors.name?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pbrand">Thương hiệu</Label>
                <Input
                  id="pbrand"
                  {...register("brand")}
                  placeholder="VD: Coca-Cola"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="porigin">Xuất xứ</Label>
                <Input
                  id="porigin"
                  {...register("origin")}
                  placeholder="VD: Việt Nam"
                />
              </div>
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={categories.length === 0}
                    >
                      <SelectTrigger className="rounded-xl w-full">
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.slug} value={c.slug}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {fieldError(formState.errors.category) && (
                  <p className="text-xs text-destructive">
                    {formState.errors.category?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pstock">Tồn kho hiện tại (đơn vị nhỏ nhất)</Label>
                <Input
                  id="pstock"
                  type="number"
                  min={0}
                  {...register("stock")}
                  aria-invalid={!!formState.errors.stock}
                />
                {fieldError(formState.errors.stock) && (
                  <p className="text-xs text-destructive">
                    {formState.errors.stock?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="punit">Đơn vị quy chuẩn</Label>
                <Input
                  id="punit"
                  {...register("unit")}
                  placeholder="thùng / lốc / gói"
                  aria-invalid={!!formState.errors.unit}
                />
                {fieldError(formState.errors.unit) && (
                  <p className="text-xs text-destructive">
                    {formState.errors.unit?.message}
                  </p>
                )}
              </div>
              <div className="sm:col-span-2 flex flex-col gap-2 rounded-xl border border-outline-variant/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <Label htmlFor="p-active">Còn bán trên cửa hàng</Label>
                  <p className="text-xs text-muted-foreground">
                    Tắt để ẩn khỏi catalog; vẫn quản lý trong kho admin.
                  </p>
                </div>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="p-active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!canWriteProducts}
                    />
                  )}
                />
              </div>
              <div className="sm:col-span-2">
                <Card className="gap-0">
                  <CardHeader className="border-b border-foreground/10 pb-4">
                    <CardTitle className="text-base">Ảnh sản phẩm</CardTitle>
                    <CardDescription>
                      Dán URL hoặc chọn ảnh từ máy (base64, tối đa{" "}
                      {MAX_PRODUCT_IMAGE_BYTES / (1024 * 1024)}MB mỗi ảnh). Ảnh
                      đầu tiên thường làm đại diện trên cửa hàng.
                    </CardDescription>
                    {canWriteProducts && (
                      <CardAction>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-lg gap-1"
                          onClick={() => appendImage()}
                        >
                          <Plus className="w-4 h-4" />
                          Thêm ảnh
                        </Button>
                      </CardAction>
                    )}
                  </CardHeader>
                  <CardContent className="py-4">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {imageList.map((urlVal, idx) => {
                        return (
                          <Card key={idx} size="sm" className="py-0 shadow-none">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xs font-semibold text-muted-foreground">
                                Ảnh {idx + 1}
                              </CardTitle>
                              {canWriteProducts && (
                                <CardAction>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                    onClick={() => removeImageAt(idx)}
                                    disabled={imageList.length === 1}
                                    aria-label="Xóa ảnh này"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </CardAction>
                              )}
                            </CardHeader>
                            <CardContent className="space-y-3 pb-3 pt-0">
                              <InventoryImagePreview value={urlVal ?? ""} />
                              <div className="space-y-2">
                                <Label
                                  htmlFor={`pimg-${idx}`}
                                  className="text-xs"
                                >
                                  URL hoặc data ảnh
                                </Label>
                                <Textarea
                                  id={`pimg-${idx}`}
                                  {...register(`images.${idx}`)}
                                  placeholder="https://... hoặc data:image/png;base64,..."
                                  rows={2}
                                  className="min-h-[4rem] max-h-32 resize-y rounded-lg text-xs font-mono"
                                  aria-invalid={
                                    !!formState.errors.images?.[idx]
                                  }
                                />
                                {canWriteProducts && (
                                  <>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="sr-only"
                                      id={`pimg-file-${idx}`}
                                      onChange={(e) => {
                                        onPickProductImage(idx, e.target.files);
                                        e.target.value = "";
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="w-full gap-1 rounded-lg text-xs"
                                      onClick={() =>
                                        document
                                          .getElementById(`pimg-file-${idx}`)
                                          ?.click()
                                      }
                                    >
                                      <Upload className="h-3.5 w-3.5" />
                                      Chọn từ máy
                                    </Button>
                                  </>
                                )}
                                {fieldError(
                                  formState.errors.images?.[idx],
                                ) && (
                                  <p className="text-xs text-destructive">
                                    {
                                      formState.errors.images?.[idx]
                                        ?.message
                                    }
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="pdesc">Mô tả ngắn</Label>
                <Input
                  id="pdesc"
                  {...register("description")}
                  placeholder="Tóm tắt hàng hoá, ghi chú..."
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>Tag / ưu đãi (cửa hàng)</Label>
                <p className="text-xs text-muted-foreground">
                  Badge đỏ cạnh tên sản phẩm trên storefront (trường{" "}
                  <span className="font-mono text-[11px]">coupons</span>).
                </p>
                <div className="space-y-2">
                  {couponRows.map((_, cidx) => (
                    <div key={cidx} className="flex gap-2 items-start">
                      <Input
                        {...register(`coupons.${cidx}`)}
                        placeholder="VD: Freeship, Giảm 10%"
                        className="rounded-lg"
                        aria-invalid={!!formState.errors.coupons?.[cidx]}
                      />
                      {canWriteProducts && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 shrink-0 text-destructive hover:bg-destructive/10"
                          onClick={() => removeCouponRow(cidx)}
                          disabled={couponRows.length <= 1}
                          aria-label="Xóa tag"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {canWriteProducts && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg gap-1"
                      onClick={() => appendCouponRow()}
                    >
                      <Plus className="h-4 w-4" />
                      Thêm tag
                    </Button>
                  )}
                </div>
              </div>
              <div className="sm:col-span-2 space-y-2 rounded-xl border border-dashed border-amber-500/35 bg-amber-500/[0.06] p-4 dark:bg-amber-500/10">
                <Label htmlFor="p-fulfill">
                  Quà tặng / ghi chú giao hàng (shipper &amp; kho)
                </Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Viết rõ điều kiện (vd: từ 5 thùng), tên quà, SKU quà nếu có
                  hàng trong kho, và giá trị kê trên phiếu (vd: 0đ). Nội dung
                  được chụp vào từng dòng đơn khi khách đặt — shipper mở màn{" "}
                  <span className="font-medium">Đơn hàng</span> sẽ thấy cột
                  tương ứng.
                </p>
                <Textarea
                  id="p-fulfill"
                  {...register("fulfillmentNote")}
                  rows={4}
                  placeholder='Ví dụ: "Mua ≥5 thùng (đơn vị thùng) → tặng 1 ly (SKU: LY-CC). Giá trị quà kê 0đ. Chỉ giao quà khi đủ 5 thùng cùng SKU."'
                  className="rounded-lg text-sm"
                  aria-invalid={!!formState.errors.fulfillmentNote}
                />
                {fieldError(formState.errors.fulfillmentNote) && (
                  <p className="text-xs text-destructive">
                    {formState.errors.fulfillmentNote?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="border border-outline-variant rounded-xl p-4 space-y-3 bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-foreground">
                    Đơn vị tính &amp; giá theo loại hàng
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Giá ban đầu và giá khuyến mãi; để trống giá khuyến mãi nếu chỉ
                    dùng một mức. &quot;SL tối thiểu (KM)&quot; là số lượng theo{" "}
                    <em>đúng loại hàng này</em> của <em>đúng sản phẩm này</em> để áp
                    giá KM; khách đổi số lượng trên giỏ thì giá cập nhật tự động.
                  </p>
                </div>
                {canWriteProducts && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs rounded-lg"
                    onClick={() =>
                      append({ ...defaultUnitRow(), type: "can", label: "" })
                    }
                  >
                    <Plus className="w-3 h-3 mr-1" /> Thêm đơn vị
                  </Button>
                )}
              </div>

              {typeof formState.errors.unitTypes?.message === "string" && (
                <p className="text-xs text-destructive">
                  {formState.errors.unitTypes.message}
                </p>
              )}

              {fields.map((fieldRow, idx) => (
                <div
                  key={fieldRow.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end border border-outline-variant/50 rounded-xl p-3 bg-background"
                >
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Loại</Label>
                    <Input
                      {...register(`unitTypes.${idx}.type`)}
                      placeholder="thùng"
                      className="h-9 text-sm rounded-lg"
                      aria-invalid={!!formState.errors.unitTypes?.[idx]?.type}
                    />
                    {fieldError(formState.errors.unitTypes?.[idx]?.type) && (
                      <p className="text-[10px] text-destructive">
                        {formState.errors.unitTypes?.[idx]?.type?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1 sm:col-span-3">
                    <Label className="text-xs">Mô tả</Label>
                    <Input
                      {...register(`unitTypes.${idx}.label`)}
                      placeholder="Thùng (24 lon)"
                      className="h-9 text-sm rounded-lg"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-1">
                    <Label className="text-xs">Quy đổi</Label>
                    <Input
                      type="number"
                      min={1}
                      {...register(`unitTypes.${idx}.qtyPerUnit`)}
                      className="h-9 text-sm rounded-lg"
                      aria-invalid={
                        !!formState.errors.unitTypes?.[idx]?.qtyPerUnit
                      }
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Giá ban đầu</Label>
                    <Input
                      type="number"
                      min={0}
                      {...register(`unitTypes.${idx}.retailPrice`)}
                      className="h-9 text-sm rounded-lg"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Giá khuyến mãi (tuỳ chọn)</Label>
                    <p className="text-[10px] text-muted-foreground leading-snug">
                      Chỉ áp khi đủ{" "}
                      <span className="font-semibold text-foreground">SL tối thiểu (KM)</span>{" "}
                      bên phải (theo cùng loại <span className="font-mono">{String(watchedUnitTypes?.[idx]?.type ?? "").trim() || "…"}</span>).
                    </p>
                    <Controller
                      name={`unitTypes.${idx}.wholesalePrice`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          min={0}
                          className="h-9 text-sm rounded-lg"
                          value={
                            field.value === null || field.value === undefined
                              ? ""
                              : field.value
                          }
                          onChange={(e) => {
                            const raw = e.target.value;
                            field.onChange(
                              raw === "" ? null : Number(raw),
                            );
                          }}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-1">
                    <Label className="text-xs leading-tight">
                      SL tối thiểu (KM)
                    </Label>
                    <p className="text-[9px] text-muted-foreground leading-tight">
                      Số lượng tối thiểu theo loại này để áp giá KM (0 = từ 1 là áp).
                    </p>
                    <Input
                      type="number"
                      min={0}
                      {...register(`unitTypes.${idx}.minWholesaleQty`)}
                      className="h-9 text-sm rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    {canWriteProducts && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:bg-destructive/10"
                        onClick={() => remove(idx)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {watchedUnitTypes?.[idx] != null && (
                    <UnitRowSaleHint {...watchedUnitTypes[idx]!} />
                  )}
                </div>
              ))}
            </div>
            </form>
          </ScrollArea>
          <DialogFooter className="mx-0 mb-0 shrink-0 rounded-b-xl border-t border-foreground/10 bg-popover px-4 py-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="mr-auto rounded-xl"
              onClick={() => onDialogOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              form={INVENTORY_PRODUCT_FORM_ID}
              className="rounded-xl font-bold"
              disabled={submitting}
            >
              {submitting
                ? "Đang lưu..."
                : editingId != null
                  ? "Cập nhật sản phẩm"
                  : "Tạo sản phẩm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs
        value={mainTab}
        onValueChange={(v) => {
          if (v === "inventory" || v === "trash") setMainTab(v);
        }}
        className="space-y-6"
      >
        <TabsList className="h-auto min-h-9 flex-wrap gap-1 rounded-xl p-1">
          <TabsTrigger value="inventory" className="rounded-lg gap-2">
            <Layers className="size-4" />
            Kho hàng
          </TabsTrigger>
          {canWriteProducts ? (
            <TabsTrigger value="trash" className="rounded-lg gap-2">
              <ArchiveRestore className="size-4" />
              Thùng rác
              {trashedData != null && trashedData.total > 0 ? (
                <Badge
                  variant="secondary"
                  className="px-1.5 py-0 text-[10px] tabular-nums"
                >
                  {trashedData.total}
                </Badge>
              ) : null}
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="inventory" className="mt-0 space-y-6">
          <div className="flex flex-wrap gap-2">
            {categoryTabs.map((cat) => {
              const Icon = cat.icon;
              const active = categoryFilter === cat.group;
              const count =
                cat.group === "ALL"
                  ? [...usageMap.values()].reduce((a, b) => a + b, 0)
                  : (usageMap.get(cat.group) ?? 0);
              return (
                <button
                  key={cat.group}
                  type="button"
                  onClick={() => applyCategoryTab(cat.group)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-all ${
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "border-outline-variant bg-background text-on-surface-variant hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {cat.key}
                  <Badge
                    className={`ml-0.5 px-1.5 py-0 text-[10px] ${active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>

          <p className="text-sm text-on-surface-variant">
            Dòng <span className="font-semibold">sản phẩm</span> mở rộng thành
            cây <span className="font-semibold">đơn vị tính</span> (bấm mũi tên để
            mở). Tab danh mục và ô lọc « Danh mục » luôn đồng bộ; cùng ô lọc / tìm
            nhanh gọi API (phân trang, chọn số SP/trang ở cuối bảng); badge tab là
            tổng SP
            trong DB theo danh mục.
            {canWriteProducts ? (
              <>
                {" "}
                Xóa sản phẩm là{" "}
                <span className="font-semibold">xóa tạm</span> — khôi phục ở tab
                Thùng rác.
              </>
            ) : null}
          </p>

          {error && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 py-12 text-center">
              <p className="text-lg font-bold text-destructive">
                Không tải được dữ liệu kho
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {error.message}
              </p>
            </div>
          )}

          {!error && (
            <>
              <AdminDataTable<ProductTreeRow>
                data={treeRows}
                columns={inventoryColumns}
                getSubRows={lineOnly ? undefined : getProductSubRows}
                isLoading={isLoading}
                emptyLabel="Không có sản phẩm phù hợp bộ lọc."
                defaultExpandedAll={false}
                manualFiltering
                columnFilters={columnFilters}
                onColumnFiltersChange={handleColumnFiltersChange}
                globalFilter={globalFilter}
                onGlobalFilterChange={setGlobalFilter}
                globalFilterPlaceholder="Tìm nhanh (API): SKU, tên, danh mục, brand…"
                filterToolbarExtra={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 rounded-lg"
                    onClick={clearAllFilters}
                  >
                    <FilterX className="size-4" />
                    Xóa bộ lọc
                  </Button>
                }
                csvExport={{ fileName: "kho-san-pham.csv" }}
                getRowClassName={(row) =>
                  row.original.rowKind === "product"
                    ? row.original.product.stock <= 0
                      ? "bg-destructive/5"
                      : row.original.product.stock < 50
                        ? "bg-warning/5"
                        : undefined
                    : undefined
                }
                footer={inventoryPaginationFooter}
              />
            </>
          )}
        </TabsContent>

        {canWriteProducts ? (
          <TabsContent value="trash" className="mt-0 space-y-4">
            {trashedError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 py-12 text-center">
                <p className="text-lg font-bold text-destructive">
                  Không tải được thùng rác
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {trashedError.message}
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-on-surface-variant">
                  Sản phẩm trong thùng rác không hiển thị ở kho chính và không bán
                  được. Khôi phục để đưa lại danh sách đang hoạt động.
                </p>
                <AdminDataTable<Product>
                  data={trashedItems}
                  columns={trashProductColumns}
                  isLoading={trashedLoading}
                  emptyLabel="Thùng rác trống hoặc không khớp tìm kiếm."
                  defaultExpandedAll={false}
                  manualFiltering
                  globalFilter={trashGlobalFilter}
                  onGlobalFilterChange={setTrashGlobalFilter}
                  globalFilterPlaceholder="Tìm theo SKU, tên, slug danh mục (API)…"
                  filterToolbarExtra={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5 rounded-lg"
                      onClick={clearTrashFilters}
                    >
                      <FilterX className="size-4" />
                      Xóa bộ lọc
                    </Button>
                  }
                  csvExport={{ fileName: "kho-thung-rac.csv" }}
                  footer={trashInventoryPaginationFooter}
                />
              </>
            )}
          </TabsContent>
        ) : null}
      </Tabs>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-[450px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Đưa sản phẩm vào thùng rác?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  Sản phẩm{" "}
                  <strong className="text-foreground">{deleteTarget.name}</strong>{" "}
                  (SKU <span className="font-mono">{deleteTarget.sku}</span>) sẽ
                  ẩn khỏi kho chính. Bạn có thể khôi phục sau trong tab Thùng rác.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteProduct();
              }}
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Xóa tạm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={purgeTarget != null}
        onOpenChange={(o) => {
          if (!o) setPurgeTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-[450px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa vĩnh viễn sản phẩm?</AlertDialogTitle>
            <AlertDialogDescription>
              {purgeTarget ? (
                <>
                  <strong className="text-foreground">{purgeTarget.name}</strong>{" "}
                  (SKU <span className="font-mono">{purgeTarget.sku}</span>) sẽ bị
                  xoá khỏi cơ sở dữ liệu. Thao tác không thể hoàn tác.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                confirmPurgeProduct();
              }}
              disabled={purgeTrashedProduct.isPending}
            >
              {purgeTrashedProduct.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Xóa vĩnh viễn"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={restoreTarget != null}
        onOpenChange={(o) => {
          if (!o) setRestoreTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-[450px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Khôi phục sản phẩm?</AlertDialogTitle>
            <AlertDialogDescription>
              {restoreTarget ? (
                <>
                  Đưa{" "}
                  <strong className="text-foreground">{restoreTarget.name}</strong>{" "}
                  (SKU <span className="font-mono">{restoreTarget.sku}</span>) trở
                  lại kho hàng đang hoạt động.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl"
              onClick={(e) => {
                e.preventDefault();
                confirmRestoreProduct();
              }}
              disabled={restoreProduct.isPending}
            >
              {restoreProduct.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Khôi phục"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
