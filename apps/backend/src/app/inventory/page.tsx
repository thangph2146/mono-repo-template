"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  type Resolver,
} from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
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
import {
  AlertTriangle,
  ChevronDown,
  Filter,
  Layers,
  Minus,
  Package2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { ApiError, type Category, type Product } from "@/lib/api";
import {
  useAdjustStock,
  useCategories,
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "@/hooks/queries";
import { formatVND } from "@/lib/format";
import { resolveCategoryIcon } from "@/lib/category-icons";
import {
  defaultProductForm,
  defaultUnitRow,
  formValuesToCreatePayload,
  productFormSchema,
  productToFormValues,
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

export default function InventoryPage() {
  const { data, isLoading, error } = useProducts();
  const { data: categoriesData } = useCategories();
  const inventory = useMemo(() => data ?? [], [data]);
  const categories = useMemo(() => categoriesData ?? [], [categoriesData]);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const adjustStock = useAdjustStock();

  const defaultCategory = categories[0]?.slug ?? "thuc-pham";

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormValues>,
    defaultValues: defaultProductForm(defaultCategory),
  });

  const { control, register, handleSubmit, reset, formState } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "unitTypes",
  });

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) map.set(c.slug, c);
    return map;
  }, [categories]);

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

  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const toggleExpand = (id: number): void => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

  const filtered = useMemo(
    () =>
      inventory.filter((p) => {
        const matchCat =
          categoryFilter === "ALL" || p.category === categoryFilter;
        const q = searchTerm.toLowerCase().trim();
        const matchSearch =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.brand ?? "").toLowerCase().includes(q);
        return matchCat && matchSearch;
      }),
    [inventory, categoryFilter, searchTerm],
  );

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
        </div>
        <Button
          onClick={openCreate}
          className="flex items-center gap-2 shadow-md h-12 px-6 rounded-xl font-bold"
        >
          <Plus className="w-5 h-5" /> Thêm sản phẩm mới
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={onDialogOpenChange}>
        <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold">
              {editingId != null ? "Sửa sản phẩm" : "Thêm sản phẩm"}
            </DialogTitle>
            <DialogDescription>
              Khai báo SKU, danh mục, ảnh và các đơn vị tính (thùng/can/chai...).
              Mỗi đơn vị tính có giá sỉ &amp; giá lẻ riêng.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(onValidSubmit)}
            className="space-y-6"
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
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="pimg">Ảnh đại diện (URL)</Label>
                <Input
                  id="pimg"
                  {...register("image")}
                  placeholder="https://..."
                />
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
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
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
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex gap-2 flex-wrap">
        {categoryTabs.map((cat) => {
          const Icon = cat.icon;
          const active = categoryFilter === cat.group;
          const count =
            cat.group === "ALL"
              ? inventory.length
              : inventory.filter((p) => p.category === cat.group).length;
          return (
            <button
              key={cat.group}
              type="button"
              onClick={() => setCategoryFilter(cat.group)}
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

      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
          <Input
            placeholder="Tìm SKU, tên sản phẩm, thương hiệu..."
            className="pl-10 bg-background border-outline-variant rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-background border-outline-variant rounded-xl font-semibold"
          >
            <Filter className="w-4 h-4" /> Lọc nâng cao
          </Button>
        </div>
      </div>

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

      {isLoading && !error && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-3">
          {filtered.map((item) => {
            const expanded = expandedIds.has(item.id);
            const status = computeStatus(item.stock);
            const primaryImage = item.images?.[0];
            const units = item.unitTypes ?? [];
            return (
              <div
                key={item.id}
                className="bg-background border border-outline-variant rounded-2xl overflow-hidden shadow-sm"
              >
                <div
                  className="flex flex-wrap items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors select-none"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="w-14 h-14 rounded-xl border border-outline-variant/40 bg-white flex items-center justify-center shrink-0 overflow-hidden">
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt=""
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <Package2 className="w-6 h-6 text-outline-variant" />
                    )}
                  </div>

                  <div className="flex-grow min-w-0">
                    <p className="font-bold text-foreground line-clamp-1">
                      {item.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge className="text-[10px] px-2 py-0 bg-muted text-on-surface-variant border-outline-variant/40 font-semibold">
                        {categoryMap.get(item.category)?.name ?? item.category}
                      </Badge>
                      {item.brand && (
                        <span className="text-xs text-on-surface-variant">
                          {item.brand}
                        </span>
                      )}
                      <span className="text-xs text-on-surface-variant font-mono">
                        {item.sku}
                      </span>
                      {units.length > 0 && (
                        <span className="text-xs text-on-surface-variant">
                          {units.length} đơn vị:{" "}
                          {units.map((u) => u.type).join(" / ")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap justify-end shrink-0">
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => handleAdjust(item, -1)}
                        disabled={adjustStock.isPending || item.stock <= 0}
                        aria-label="Xuất kho 1 đơn vị"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                      <div className="text-right min-w-[64px]">
                        <p className="font-black text-lg text-foreground leading-none">
                          {item.stock.toLocaleString("vi-VN")}
                        </p>
                        <p className="text-[10px] text-on-surface-variant">
                          {item.unit}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => handleAdjust(item, 1)}
                        disabled={adjustStock.isPending}
                        aria-label="Nhập kho 1 đơn vị"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
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
                        <AlertTriangle className="w-3 h-3 mr-1" />
                      )}
                      {status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-bold text-primary hover:bg-primary/10 rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(item);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-bold text-destructive hover:bg-destructive/10 rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <ChevronDown
                      className={`w-4 h-4 text-outline transition-transform ${expanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>

                {expanded && units.length > 0 && (
                  <div className="border-t border-outline-variant/30 px-5 py-4 bg-surface/40">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                      Chi tiết tồn kho theo đơn vị hàng hóa
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {units.map((u) => {
                        const unitStock = Math.floor(
                          item.stock / Math.max(u.qtyPerUnit, 1),
                        );
                        return (
                          <div
                            key={u.type}
                            className="rounded-xl border border-outline-variant/40 bg-background p-4 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-foreground">
                                {u.label}
                              </span>
                              <Badge className="text-[10px] px-2 py-0 bg-primary/10 text-primary border-primary/20 font-bold capitalize">
                                {u.type}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-on-surface-variant">
                                Tồn kho
                              </span>
                              <span className="font-black text-foreground">
                                {unitStock.toLocaleString("vi-VN")} {u.type}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-on-surface-variant">
                                Giá Sỉ
                              </span>
                              <span className="font-bold text-primary">
                                {u.wholesalePrice
                                  ? formatVND(u.wholesalePrice)
                                  : "—"}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-on-surface-variant">
                                Giá Lẻ
                              </span>
                              <span className="font-bold text-foreground">
                                {formatVND(u.retailPrice)}
                              </span>
                            </div>
                            {u.minWholesaleQty > 0 && (
                              <div className="text-[11px] text-on-surface-variant">
                                Mua sỉ tối thiểu {u.minWholesaleQty} {u.type}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-outline-variant">
              <Package2 className="w-16 h-16 mx-auto text-outline-variant opacity-20 mb-4" />
              <p className="text-xl font-bold text-on-surface-variant">
                Không có sản phẩm phù hợp
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
