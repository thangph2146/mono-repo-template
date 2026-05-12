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
import { PageSection } from "@ui/components/layout";
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
  AlertCircle,
  AlertTriangle,
  Archive,
  ArchiveRestore,
  FilterX,
  ImageIcon,
  Info,
  Layers,
  Loader2,
  Minus,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { ApiError, type Product, type ProductUnitType } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
import {
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
import { cn } from "@ui/lib/utils";
import {
  ADMIN_ALERT_DIALOG_CONTENT_CLASS,
  ADMIN_DIALOG_CONTENT_INVENTORY_FULL_CLASS,
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";
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

  const { data, isLoading, error, refetch, isFetching } = useProducts({
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

  const {
    data: trashedData,
    isLoading: trashedLoading,
    error: trashedError,
    refetch: refetchTrashedProducts,
    isFetching: trashedProductsFetching,
  } = useTrashedProducts({
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
  const watchedBaseStock = Number(watch("stock") ?? 0);
  const watchedBaseUnit = String(watch("unit") ?? "").trim() || "đơn vị chuẩn";
  const normalizedBaseStock = Math.max(0, Math.floor(watchedBaseStock || 0));
  const stockByUnits = useMemo(
    () =>
      (watchedUnitTypes ?? []).map((u, idx) => {
        const unitType = String(u?.type ?? "").trim() || `đơn vị ${idx + 1}`;
        const qtyPerUnit = Math.max(
          1,
          Math.floor(Number(u?.qtyPerUnit ?? 1) || 1),
        );
        const availableQty = Math.floor(normalizedBaseStock / qtyPerUnit);
        const remainderBase = normalizedBaseStock % qtyPerUnit;
        return { unitType, qtyPerUnit, availableQty, remainderBase };
      }),
    [watchedUnitTypes, normalizedBaseStock],
  );
  const generatedGiftNotePreview = useMemo(() => {
    const giftRules = (watchedUnitTypes ?? [])
      .filter((u) => u?.promoMode === "gift")
      .map((u) => {
        const unitType = String(u?.type ?? "").trim() || "đơn vị";
        const minQty = Math.max(1, Math.floor(Number(u?.minWholesaleQty ?? 0) || 0));
        const giftQty = Math.max(1, Math.floor(Number(u?.giftQty ?? 1) || 1));
        const giftName = String(u?.giftProductName ?? "").trim();
        const giftSku = String(u?.giftProductSku ?? "").trim();
        const giftUnitType = String(u?.giftProductUnitType ?? "").trim();
        if (!giftName) return null;
        return `- Từ ${minQty} ${unitType}: tặng ${giftQty} ${giftName}${giftSku ? ` (SKU: ${giftSku})` : ""}${giftUnitType ? ` - đơn vị quà: ${giftUnitType}` : ""}.`;
      })
      .filter((line): line is string => Boolean(line));

    if (giftRules.length === 0) return "";
    return `KM quà tặng theo đơn vị:\n${giftRules.join("\n")}`;
  }, [watchedUnitTypes]);
  const generatedPriceNotePreview = useMemo(() => {
    const priceRules = (watchedUnitTypes ?? [])
      .filter((u) => u?.promoMode === "price")
      .map((u) => {
        const unitType = String(u?.type ?? "").trim() || "đơn vị";
        const minQty = Math.max(1, Math.floor(Number(u?.minWholesaleQty ?? 0) || 0));
        const retail = Math.max(0, Math.floor(Number(u?.retailPrice ?? 0) || 0));
        const wholesale = Math.max(0, Math.floor(Number(u?.wholesalePrice ?? 0) || 0));
        if (retail <= 0 || wholesale <= 0 || wholesale >= retail) return null;
        const pct = Math.round(((retail - wholesale) / retail) * 100);
        if (pct <= 0) return null;
        return `- Từ ${minQty} ${unitType}: giảm ${pct}% (${retail}đ -> ${wholesale}đ).`;
      })
      .filter((line): line is string => Boolean(line));
    if (priceRules.length === 0) return "";
    return `KM giá theo đơn vị:\n${priceRules.join("\n")}`;
  }, [watchedUnitTypes]);
  const autoGiftTagsPreview = useMemo(() => {
    const tags = new Set<string>();
    (watchedUnitTypes ?? []).forEach((u) => {
      if (u?.promoMode !== "gift") return;
      const giftName = String(u?.giftProductName ?? "").trim();
      const giftQty = Math.max(1, Math.floor(Number(u?.giftQty ?? 1) || 1));
      const minQty = Math.max(1, Math.floor(Number(u?.minWholesaleQty ?? 0) || 0));
      const unitLabel = String(u?.type ?? "").trim() || "đơn vị";
      if (giftName) tags.add(`tặng ${giftQty} ${giftName} khi mua từ ${minQty} ${unitLabel}`);
    });
    return Array.from(tags).filter(Boolean);
  }, [watchedUnitTypes]);
  const autoPriceTagsPreview = useMemo(() => {
    const tags = new Set<string>();
    (watchedUnitTypes ?? []).forEach((u) => {
      if (u?.promoMode !== "price") return;
      const retail = Math.max(0, Math.floor(Number(u?.retailPrice ?? 0) || 0));
      const wholesale = Math.max(0, Math.floor(Number(u?.wholesalePrice ?? 0) || 0));
      if (retail <= 0 || wholesale <= 0 || wholesale >= retail) return;
      const pct = Math.round(((retail - wholesale) / retail) * 100);
      if (pct > 0) {
        const unitLabel = String(u?.type ?? "").trim() || "đơn vị";
        const minQty = Math.max(1, Math.floor(Number(u?.minWholesaleQty ?? 0) || 0));
        tags.add(`giảm ${pct}% khi mua từ ${minQty} ${unitLabel}`);
      }
    });
    return Array.from(tags).filter(Boolean);
  }, [watchedUnitTypes]);

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
  const giftProductOptions = useMemo(
    () =>
      inventory
        .filter((p) => p.id !== editingId)
        .map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          label: `${p.name} (${p.sku})`,
          unitOptions:
            p.unitTypes && p.unitTypes.length > 0
              ? p.unitTypes.map((u) => ({
                  value: u.type,
                  label: u.label?.trim() || u.type,
                }))
              : [{ value: p.unit || "đơn vị", label: p.unit || "đơn vị" }],
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "vi")),
    [inventory, editingId],
  );

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
                className="max-w-full whitespace-normal break-words text-left h-auto border-destructive/25 bg-destructive/10 text-[10px] font-semibold text-destructive"
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
                  size="sm"
                  className="h-8 gap-1 rounded-lg"
                  onClick={() => openEdit(item)}
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Sửa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => requestDeleteProduct(item)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa
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
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            <Package className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
            Quản lý Hàng hóa &amp; Kho
          </h1>
          <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
            Phân loại danh mục, quản lý đơn vị (thùng / can / chai / lốc / gói)
            và theo dõi tồn kho theo thời gian thực
          </p>
          {user && !canWriteProducts && (
            <p className="mt-2 text-sm font-medium text-amber-800 dark:text-amber-200/90">
              Chế độ chỉ xem: tài khoản không có quyền{" "}
              <span className="font-mono">products.write</span> — không thể
              thêm/sửa/xoá hay điều chỉnh tồn.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex h-12 items-center gap-2 rounded-xl border-outline-variant px-4 font-semibold hover:bg-muted"
            onClick={() => {
              void refetch();
              void refetchTrashedProducts();
            }}
          >
            <RefreshCw
              className={cn(
                "size-5",
                (isFetching || trashedProductsFetching) && "animate-spin",
              )}
              aria-hidden
            />
            Làm mới
          </Button>
          {canWriteProducts ? (
            <Button
              type="button"
              onClick={openCreate}
              className="flex h-12 items-center gap-2 rounded-xl px-6 font-bold shadow-md"
            >
              <Plus className="size-5" aria-hidden /> Thêm sản phẩm mới
            </Button>
          ) : null}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={onDialogOpenChange}>
        <DialogContent className={ADMIN_DIALOG_CONTENT_INVENTORY_FULL_CLASS}>
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
              <div className="space-y-2 sm:col-span-2">
                <Label>Tồn kho theo đơn vị</Label>
                <div className="rounded-xl border border-outline-variant/60 bg-muted/20 p-3">
                  <div className="mb-3 space-y-1 rounded-lg border border-outline-variant/40 bg-background p-2.5">
                    <Label htmlFor="pstock">Số lượng tồn kho (đơn vị chuẩn)</Label>
                    <Input
                      id="pstock"
                      type="number"
                      min={0}
                      {...register("stock")}
                      aria-invalid={!!formState.errors.stock}
                      className="h-9 text-sm rounded-lg"
                    />
                    {fieldError(formState.errors.stock) && (
                      <p className="text-xs text-destructive">
                        {formState.errors.stock?.message}
                      </p>
                    )}
                  </div>
                  {stockByUnits.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {stockByUnits.map((u, idx) => {
                        return (
                          <div
                            key={`${u.unitType}-${idx}`}
                            className="flex items-center justify-between rounded-lg border border-outline-variant/40 bg-background px-2.5 py-1.5 text-xs"
                          >
                            <span className="font-medium text-muted-foreground leading-tight">
                              {u.unitType}
                              <span className="block text-[10px] opacity-80">
                                1 {u.unitType} = {u.qtyPerUnit} {watchedBaseUnit}
                              </span>
                            </span>
                            <span className="text-right">
                              <span className="block font-bold text-foreground">
                                {u.availableQty.toLocaleString("vi-VN")}
                              </span>
                              {u.remainderBase > 0 && (
                                <span className="block text-[10px] text-muted-foreground">
                                  dư {u.remainderBase} {watchedBaseUnit}
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Thêm đơn vị tính để hiển thị tồn kho tương ứng.
                    </p>
                  )}
                </div>
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
                  {autoGiftTagsPreview.length > 0 ||
                  autoPriceTagsPreview.length > 0 ? (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2">
                      <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                        Tag KM tự động từ cấu hình:
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground break-words">
                        {[...autoGiftTagsPreview, ...autoPriceTagsPreview].join(", ")}
                      </p>
                    </div>
                  ) : null}
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
                {generatedGiftNotePreview ? (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2">
                    <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                      Ghi chú KM tự động theo cấu hình quà tặng:
                    </p>
                    <pre className="mt-1 whitespace-pre-wrap break-words text-[11px] text-muted-foreground">
                      {generatedGiftNotePreview}
                    </pre>
                  </div>
                ) : null}
                {generatedPriceNotePreview ? (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-2">
                    <p className="text-[11px] font-medium text-primary">
                      Ghi chú KM tự động theo giá khuyến mãi:
                    </p>
                    <pre className="mt-1 whitespace-pre-wrap break-words text-[11px] text-muted-foreground">
                      {generatedPriceNotePreview}
                    </pre>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border border-outline-variant rounded-xl p-4 space-y-3 bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-foreground">
                    Đơn vị tính &amp; giá theo loại hàng
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Mỗi loại hàng chọn một cơ chế khuyến mãi:{" "}
                    <strong>Giá khuyến mãi</strong> hoặc{" "}
                    <strong>Quà tặng</strong>. &quot;SL tối thiểu (KM)&quot; áp cho{" "}
                    <em>đúng loại hàng này</em> của <em>đúng sản phẩm này</em>.
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
                  <div className="space-y-1 sm:col-span-2 min-w-0">
                    <Label className="text-xs">Quy đổi</Label>
                    <Controller
                      name={`unitTypes.${idx}.qtyPerUnit`}
                      control={control}
                      render={({ field }) => (
                        <NumberStepperInput
                          value={field.value}
                          min={1}
                          step={1}
                          className="min-w-[60px] h-9 text-sm rounded-lg"
                          ariaInvalid={
                            !!formState.errors.unitTypes?.[idx]?.qtyPerUnit
                          }
                          onChange={field.onChange}
                        />
                      )}
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
                    <Label className="text-xs">Cơ chế khuyến mãi</Label>
                    <select
                      {...register(`unitTypes.${idx}.promoMode`)}
                      className="h-9 w-full rounded-lg border border-outline-variant bg-background px-2 text-sm"
                    >
                      <option value="none">Không áp</option>
                      <option value="price">Giá khuyến mãi</option>
                      <option value="gift">Quà tặng</option>
                    </select>
                  </div>
                  {watchedUnitTypes?.[idx]?.promoMode === "price" && (
                    <div className="space-y-1 sm:col-span-3">
                      <Label className="text-xs">Giá khuyến mãi</Label>
                      <p className="text-[10px] text-muted-foreground leading-snug">
                        Chỉ áp khi đủ{" "}
                        <span className="font-semibold text-foreground">
                          SL tối thiểu (KM)
                        </span>{" "}
                        bên phải (theo cùng loại{" "}
                        <span className="font-mono">
                          {String(watchedUnitTypes?.[idx]?.type ?? "").trim() ||
                            "…"}
                        </span>
                        ).
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
                              field.onChange(raw === "" ? null : Number(raw));
                            }}
                          />
                        )}
                      />
                      {fieldError(
                        formState.errors.unitTypes?.[idx]?.wholesalePrice,
                      ) && (
                        <p className="text-[10px] text-destructive">
                          {formState.errors.unitTypes?.[idx]?.wholesalePrice
                            ?.message as string}
                        </p>
                      )}
                    </div>
                  )}
                  {watchedUnitTypes?.[idx]?.promoMode === "gift" && (
                    <div className="space-y-1 sm:col-span-12">
                      <Label className="text-xs">Sản phẩm quà tặng</Label>
                      <Controller
                        name={`unitTypes.${idx}.giftProductId`}
                        control={control}
                        render={({ field }) => (
                          <>
                            <Select
                              value={field.value == null ? "" : String(field.value)}
                              onValueChange={(value) => {
                                const selected = giftProductOptions.find(
                                  (o) => String(o.id) === value,
                                );
                                field.onChange(value === "" ? null : Number(value));
                                setValue(
                                  `unitTypes.${idx}.giftProductName`,
                                  selected?.name ?? "",
                                  { shouldValidate: true, shouldDirty: true },
                                );
                                setValue(
                                  `unitTypes.${idx}.giftProductSku`,
                                  selected?.sku ?? "",
                                  { shouldValidate: true, shouldDirty: true },
                                );
                                setValue(
                                  `unitTypes.${idx}.giftProductUnitType`,
                                  selected?.unitOptions?.[0]?.value ?? "",
                                  { shouldValidate: true, shouldDirty: true },
                                );
                              }}
                            >
                              <SelectTrigger className="h-9 text-sm rounded-lg w-full">
                                <SelectValue placeholder="Chọn sản phẩm quà tặng">
                                  {(() => {
                                    const selected = giftProductOptions.find(
                                      (o) => o.id === field.value,
                                    );
                                    if (selected) return selected.label;
                                    const fallbackName = (
                                      watchedUnitTypes?.[idx]?.giftProductName ?? ""
                                    ).trim();
                                    const fallbackSku = (
                                      watchedUnitTypes?.[idx]?.giftProductSku ?? ""
                                    ).trim();
                                    if (!fallbackName) return undefined;
                                    return fallbackSku
                                      ? `${fallbackName} (${fallbackSku})`
                                      : fallbackName;
                                  })()}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {giftProductOptions.map((opt) => (
                                  <SelectItem key={opt.id} value={String(opt.id)}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Controller
                              name={`unitTypes.${idx}.giftProductUnitType`}
                              control={control}
                              render={({ field: unitField }) => {
                                const selected = giftProductOptions.find(
                                  (o) =>
                                    String(o.id) ===
                                    String(
                                      watchedUnitTypes?.[idx]?.giftProductId ?? "",
                                    ),
                                );
                                const unitOptions = selected?.unitOptions ?? [];
                                return (
                                  <div className="mt-2 space-y-1">
                                    <Label className="text-xs">Đơn vị quà tặng</Label>
                                    <Select
                                      value={unitField.value ?? ""}
                                      onValueChange={(value) =>
                                        unitField.onChange(value)
                                      }
                                      disabled={unitOptions.length === 0}
                                    >
                                      <SelectTrigger className="h-9 text-sm rounded-lg w-full">
                                        <SelectValue placeholder="Chọn đơn vị quà tặng" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {unitOptions.map((unitOpt) => (
                                          <SelectItem
                                            key={unitOpt.value}
                                            value={unitOpt.value}
                                          >
                                            {unitOpt.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                );
                              }}
                            />
                          </>
                        )}
                      />
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                        <Input
                          {...register(`unitTypes.${idx}.giftProductName`)}
                          placeholder="Tên quà"
                          className="h-9 text-sm rounded-lg sm:col-span-3"
                        />
                        <Controller
                          name={`unitTypes.${idx}.giftQty`}
                          control={control}
                          render={({ field }) => (
                            <NumberStepperInput
                              value={field.value}
                              min={1}
                              step={1}
                              placeholder="SL quà"
                              className="h-9 text-sm rounded-lg"
                              onChange={field.onChange}
                            />
                          )}
                        />
                      </div>
                      <Input
                        {...register(`unitTypes.${idx}.giftProductSku`)}
                        placeholder="SKU quà (tuỳ chọn)"
                        className="h-9 text-sm rounded-lg"
                      />
                      {fieldError(
                        formState.errors.unitTypes?.[idx]?.giftProductUnitType,
                      ) && (
                        <p className="text-[10px] text-destructive">
                          {formState.errors.unitTypes?.[idx]?.giftProductUnitType
                            ?.message as string}
                        </p>
                      )}
                      {fieldError(
                        formState.errors.unitTypes?.[idx]?.giftProductName,
                      ) && (
                        <p className="text-[10px] text-destructive">
                          {formState.errors.unitTypes?.[idx]?.giftProductName
                            ?.message as string}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="space-y-1 sm:col-span-2 min-w-0">
                    <Label className="text-xs leading-tight">
                      SL tối thiểu (KM)
                    </Label>
                    <p className="text-[9px] text-muted-foreground leading-tight">
                      {watchedUnitTypes?.[idx]?.promoMode === "none"
                        ? "Không áp khuyến mãi: để 0."
                        : "Số lượng tối thiểu để kích hoạt cơ chế KM ở dòng này."}
                    </p>
                    <Controller
                      name={`unitTypes.${idx}.minWholesaleQty`}
                      control={control}
                      render={({ field }) => (
                        <NumberStepperInput
                          value={field.value}
                          min={0}
                          step={1}
                          className="h-9 text-sm rounded-lg"
                          onChange={field.onChange}
                        />
                      )}
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
                  {watchedUnitTypes?.[idx] != null &&
                    watchedUnitTypes[idx]!.promoMode === "price" && (
                      <UnitRowSaleHint {...watchedUnitTypes[idx]!} />
                    )}
                  {watchedUnitTypes?.[idx] != null &&
                    watchedUnitTypes[idx]!.promoMode === "gift" && (
                      <p className="text-[10px] text-muted-foreground sm:col-span-12 -mt-1">
                        Quà tặng kích hoạt khi đạt SL tối thiểu của loại{" "}
                        <span className="font-mono">
                          {watchedUnitTypes[idx]!.type || "đơn vị"}
                        </span>
                        . Hệ thống tự ghi chú vào phần hướng dẫn kho/shipper.
                      </p>
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
          <TabsTrigger
            value="inventory"
            className="flex items-center gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Layers className="size-4" aria-hidden />
            Kho hàng
          </TabsTrigger>
          {canWriteProducts ? (
            <TabsTrigger
              value="trash"
              className="flex items-center gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <ArchiveRestore className="size-4" aria-hidden />
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
                <Button
                  key={cat.group}
                  type="button"
                  variant="ghost"
                  onClick={() => applyCategoryTab(cat.group)}
                  className={cn(
                    "h-auto gap-2 rounded-xl border px-4 py-2 text-sm font-bold shadow-none",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:text-primary-foreground"
                      : "border-outline-variant bg-background text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {cat.key}
                  <Badge
                    className={`ml-0.5 px-1.5 py-0 text-[10px] ${active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 shadow-sm">
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span className="text-muted-foreground">
                Dòng <span className="font-semibold text-foreground">sản phẩm</span>{" "}
                mở rộng thành cây{" "}
                <span className="font-semibold text-foreground">đơn vị tính</span>{" "}
                (bấm mũi tên để mở). Tab danh mục và ô lọc « Danh mục » luôn đồng bộ;
                ô lọc / tìm nhanh gọi API (phân trang ở cuối bảng); badge tab là tổng
                SP trong DB theo danh mục.
                {canWriteProducts ? (
                  <>
                    {" "}
                    Xóa sản phẩm là{" "}
                    <span className="font-semibold text-foreground">xóa tạm</span> —
                    khôi phục ở tab Thùng rác.
                  </>
                ) : null}
              </span>
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">Không tải được dữ liệu kho</p>
                  <p className="mt-1 text-sm opacity-90">{error.message}</p>
                </div>
              </div>
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
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <div>
                    <p className="font-semibold">Không tải được thùng rác</p>
                    <p className="mt-1 text-sm opacity-90">
                      {trashedError.message}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>
                    Sản phẩm trong thùng rác không hiển thị ở kho chính và không bán
                    được. Khôi phục để đưa lại danh sách đang hoạt động.
                  </span>
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
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 rounded-lg"
                        onClick={() => void refetchTrashedProducts()}
                      >
                        <RefreshCw
                          className={cn(
                            "size-4",
                            trashedProductsFetching && "animate-spin",
                          )}
                          aria-hidden
                        />
                        Làm mới
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 rounded-lg"
                        onClick={clearTrashFilters}
                      >
                        <FilterX className="size-4" aria-hidden />
                        Xóa bộ lọc
                      </Button>
                    </div>
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
        <AlertDialogContent className={ADMIN_ALERT_DIALOG_CONTENT_CLASS}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-left">
              <Archive className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              Đưa sản phẩm vào thùng rác?
            </AlertDialogTitle>
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
        <AlertDialogContent className={ADMIN_ALERT_DIALOG_CONTENT_CLASS}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-left text-destructive">
              <Trash2 className="size-5 shrink-0" aria-hidden />
              Xóa vĩnh viễn sản phẩm?
            </AlertDialogTitle>
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
        <AlertDialogContent className={ADMIN_ALERT_DIALOG_CONTENT_CLASS}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-left">
              <ArchiveRestore className="size-5 shrink-0 text-primary" aria-hidden />
              Khôi phục sản phẩm?
            </AlertDialogTitle>
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
    </PageSection>
  );
}

function NumberStepperInput({
  value,
  onChange,
  min,
  step = 1,
  placeholder,
  className,
  ariaInvalid,
}: {
  value: unknown;
  onChange: (v: number) => void;
  min: number;
  step?: number;
  placeholder?: string;
  className?: string;
  ariaInvalid?: boolean;
}) {
  const normalized = Number.isFinite(Number(value))
    ? Math.max(min, Math.floor(Number(value)))
    : min;
  return (
    <div className="flex min-w-0 items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-lg"
        onClick={() => onChange(Math.max(min, normalized - step))}
        disabled={normalized <= min}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        type="number"
        min={min}
        value={normalized}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onChange(min);
            return;
          }
          const n = Number(raw);
          onChange(Number.isFinite(n) ? Math.max(min, Math.floor(n)) : min);
        }}
        placeholder={placeholder}
        className={`min-w-0 flex-1 text-center ${className ?? ""}`.trim()}
        aria-invalid={ariaInvalid}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-lg"
        onClick={() => onChange(normalized + step)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
