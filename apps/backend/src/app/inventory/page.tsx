"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Label } from "@ui/components/label";
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
  ChevronLeft,
  ChevronRight,
  FilterX,
  ImageIcon,
  Layers,
  Minus,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { ApiError, type Category, type Product } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
import {
  useAdjustStock,
  useCategories,
  useCategoryUsage,
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "@/hooks/queries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatVND } from "@/lib/format";
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

const PAGE_SIZE = 20;

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

  useEffect(() => {
    setPage(1);
  }, [filterSignature]);

  const productListParams = useMemo(
    () => ({
      ...productListParamsBase,
      page,
      limit: PAGE_SIZE,
    }),
    [productListParamsBase, page],
  );

  const { data, isLoading, error } = useProducts({
    listParams: productListParams,
  });
  const inventory = useMemo(() => data?.items ?? [], [data?.items]);
  const totalProducts = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));

  const clearAllFilters = (): void => {
    setCategoryFilter("ALL");
    setColumnFilters([]);
    setGlobalFilter("");
    setPage(1);
  };

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
  const adjustStock = useAdjustStock();

  const defaultCategory = categories[0]?.slug ?? "thuc-pham";

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormValues>,
    defaultValues: defaultProductForm(defaultCategory),
  });

  const { control, register, handleSubmit, reset, formState, watch, setValue } =
    form;
  const { fields, append, remove } = useFieldArray<
    ProductFormValues,
    "unitTypes"
  >({
    control,
    name: "unitTypes",
  });

  const imageList = watch("images") ?? [];
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

  const handleDelete = (product: Product): void => {
    if (!confirm(`Xoá sản phẩm "${product.name}" khỏi kho?`)) return;
    toast.promise(deleteProduct.mutateAsync(product.id), {
      loading: `Đang xoá ${product.name}...`,
      success: `Đã xoá ${product.name}`,
      error: (err: unknown) =>
        err instanceof ApiError ? err.message : "Xoá sản phẩm thất bại",
    });
  };

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
      header: "Giá lẻ",
      filterFn: (row, id, v) => {
        if (v == null || v === "") return true;
        return Number(row.getValue(id)) === Number(v);
      },
      cell: ({ getValue }) => formatVND(Number(getValue())),
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
                  onClick={() => handleDelete(item)}
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
        <DialogContent className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-[90vw]">
          <div className="shrink-0 space-y-1.5 px-4 pt-4 pr-12">
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold">
                {editingId != null ? "Sửa sản phẩm" : "Thêm sản phẩm"}
              </DialogTitle>
              <DialogDescription>
                Khai báo SKU, danh mục, ảnh và các đơn vị tính (thùng/can/chai...).
                Mỗi đơn vị tính có giá sỉ &amp; giá lẻ riêng.
              </DialogDescription>
            </DialogHeader>
          </div>
          <ScrollArea className="min-h-0 flex-1 max-h-[70vh] overflow-y-auto">
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
            </div>

            <div className="border border-outline-variant rounded-xl p-4 space-y-3 bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-foreground">
                    Đơn vị tính &amp; giá theo loại hàng
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Mỗi đơn vị có số lượng quy đổi, giá sỉ và giá lẻ riêng.
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
                    <Label className="text-xs">Giá lẻ</Label>
                    <Input
                      type="number"
                      min={0}
                      {...register(`unitTypes.${idx}.retailPrice`)}
                      className="h-9 text-sm rounded-lg"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Giá sỉ</Label>
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
                    <Label className="text-xs">Min sỉ</Label>
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

      <div className="flex gap-2 flex-wrap">
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-all ${
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-background border-outline-variant text-on-surface-variant hover:bg-muted"
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.key}
              <Badge
                className={`text-[10px] px-1.5 py-0 ml-0.5 ${active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}
              >
                {count}
              </Badge>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-on-surface-variant">
        Dòng <span className="font-semibold">sản phẩm</span> mở rộng thành cây{" "}
        <span className="font-semibold">đơn vị tính</span> (bấm mũi tên để mở).
        Tab danh mục và ô lọc « Danh mục » luôn đồng bộ; cùng ô lọc / tìm nhanh gọi
        API (phân trang {PAGE_SIZE} SP/trang); badge tab là tổng SP trong DB theo
        danh mục.
      </p>

      {error && (
        <div className="text-center py-12 bg-destructive/5 border border-destructive/20 rounded-2xl">
          <p className="text-lg font-bold text-destructive">
            Không tải được dữ liệu kho
          </p>
          <p className="text-sm text-on-surface-variant mt-1">
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
                className="h-9 rounded-lg gap-1.5"
                onClick={clearAllFilters}
              >
                <FilterX className="size-4" />
                Xóa bộ lọc
              </Button>
            }
            getRowClassName={(row) =>
              row.original.rowKind === "product"
                ? row.original.product.stock <= 0
                  ? "bg-destructive/5"
                  : row.original.product.stock < 50
                    ? "bg-warning/5"
                    : undefined
                : undefined
            }
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {totalProducts === 0
                ? "Không có sản phẩm"
                : `Hiển thị ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalProducts)} / ${totalProducts} sản phẩm`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-lg"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
                Trước
              </Button>
              <span className="text-sm tabular-nums px-2">
                Trang {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-lg"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
