"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Badge } from "@ui/components/badge";
import { Switch } from "@ui/components/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import {
  Plus,
  Pencil,
  Trash2,
  Tags,
  Search,
  AlertCircle,
} from "lucide-react";
import { type Category, ApiError } from "@/lib/api";
import {
  useCategories,
  useCategoryUsage,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/hooks/queries";
import {
  CATEGORY_ICON_OPTIONS,
  resolveCategoryIcon,
} from "@/lib/category-icons";

interface FormState {
  id?: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  description: "",
  icon: "Package2",
  sortOrder: 0,
  isActive: true,
};

const slugify = (input: string): string =>
  input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function CategoriesPage() {
  const { data: categoriesData, isLoading: loading, error } = useCategories();
  const { data: usageData } = useCategoryUsage();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const categories = useMemo(() => categoriesData ?? [], [categoriesData]);
  const usageMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of usageData ?? []) map.set(u.slug, u.productCount);
    return map;
  }, [usageData]);

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const submitting = createMutation.isPending || updateMutation.isPending;

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
    );
  }, [categories, searchTerm]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setForm({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      icon: c.icon ?? "Package2",
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async (): Promise<void> => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim() || null,
      icon: form.icon || null,
      sortOrder: Number.isFinite(form.sortOrder) ? form.sortOrder : 0,
      isActive: form.isActive,
    };
    try {
      if (form.id) {
        await updateMutation.mutateAsync({ id: form.id, input: payload });
        toast.success(`Đã cập nhật danh mục "${payload.name}"`);
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(`Đã tạo danh mục "${payload.name}"`);
      }
      setDialogOpen(false);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Đã xảy ra lỗi, vui lòng thử lại";
      toast.error(message);
    }
  };

  const handleDelete = async (c: Category): Promise<void> => {
    const inUse = usageMap.get(c.slug) ?? 0;
    if (inUse > 0) {
      toast.error(
        `Không thể xoá: còn ${inUse} sản phẩm đang sử dụng danh mục này`,
      );
      return;
    }
    if (!confirm(`Xoá danh mục "${c.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(c.id);
      toast.success(`Đã xoá danh mục "${c.name}"`);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Không thể xoá danh mục";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground flex items-center gap-3">
            <Tags className="size-9 text-primary" />
            Loại sản phẩm
          </h1>
          <p className="text-on-surface-variant font-medium mt-1">
            Quản lý danh mục dùng chung cho cả storefront và quản trị viên
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button
                onClick={openCreate}
                className="flex items-center gap-2 shadow-md h-12 px-6 rounded-xl font-bold"
              />
            }
          >
            <Plus className="w-5 h-5" /> Thêm danh mục
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold">
                {form.id ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
              </DialogTitle>
              <DialogDescription>
                Slug được tự động sinh từ tên. Cập nhật slug sẽ tự đồng bộ lại
                tham chiếu trên các sản phẩm liên quan.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cat-name">Tên hiển thị</Label>
                  <Input
                    id="cat-name"
                    placeholder="VD: Đồ uống"
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((f) => ({
                        ...f,
                        name,
                        slug: f.id ? f.slug : slugify(name),
                      }));
                    }}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cat-slug">Slug</Label>
                  <Input
                    id="cat-slug"
                    placeholder="do-uong"
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        slug: slugify(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Biểu tượng</Label>
                  <Select
                    value={form.icon}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, icon: v ?? "Package2" }))
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Chọn biểu tượng" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_ICON_OPTIONS.map((name) => {
                        const Icon = resolveCategoryIcon(name);
                        return (
                          <SelectItem key={name} value={name}>
                            <div className="flex items-center gap-2">
                              <Icon className="size-4" /> {name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-order">Thứ tự</Label>
                  <Input
                    id="cat-order"
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        sortOrder: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cat-desc">Mô tả</Label>
                  <Input
                    id="cat-desc"
                    placeholder="Mô tả ngắn gọn"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between sm:col-span-2 rounded-xl border border-outline-variant px-4 py-3">
                  <div>
                    <p className="font-semibold text-sm">Đang hoạt động</p>
                    <p className="text-xs text-on-surface-variant">
                      Khi tắt, danh mục sẽ ẩn khỏi storefront nhưng giữ lại
                      tham chiếu sản phẩm.
                    </p>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, isActive: v }))
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="mr-auto rounded-xl"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                className="rounded-xl font-bold"
                onClick={() => void handleSave()}
                disabled={submitting}
              >
                {submitting ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
          <Input
            placeholder="Tìm tên hoặc slug..."
            className="pl-10 bg-background border-outline-variant rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <p className="text-sm text-on-surface-variant">
          Tổng cộng:{" "}
          <span className="font-bold text-foreground">{categories.length}</span>{" "}
          danh mục
        </p>
      </div>

      {error && (
        <div className="text-center py-12 bg-destructive/5 border border-destructive/20 rounded-2xl">
          <AlertCircle className="w-10 h-10 mx-auto text-destructive mb-2" />
          <p className="text-lg font-bold text-destructive">
            Không tải được danh mục
          </p>
          <p className="text-sm text-on-surface-variant mt-1">
            {error.message}
          </p>
        </div>
      )}

      {loading && !error && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const Icon = resolveCategoryIcon(c.icon);
            const usage = usageMap.get(c.slug) ?? 0;
            return (
              <div
                key={c.id}
                className="bg-background border border-outline-variant rounded-2xl p-5 shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <Icon className="size-6 text-primary" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-lg text-foreground line-clamp-1">
                        {c.name}
                      </p>
                      {!c.isActive && (
                        <Badge className="text-[10px] bg-muted text-muted-foreground">
                          Ẩn
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant font-mono">
                      {c.slug}
                    </p>
                    {c.description && (
                      <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">
                        {c.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30">
                  <Badge className="bg-primary/10 text-primary border-primary/20 font-semibold">
                    {usage} sản phẩm
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => openEdit(c)}
                    >
                      <Pencil className="w-4 h-4 mr-1" /> Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-destructive hover:bg-destructive/10"
                      onClick={() => void handleDelete(c)}
                      disabled={usage > 0}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-outline-variant">
              <Tags className="w-16 h-16 mx-auto text-outline-variant opacity-20 mb-4" />
              <p className="text-xl font-bold text-on-surface-variant">
                Chưa có danh mục nào
              </p>
              <p className="text-sm text-on-surface-variant mt-1">
                Bấm &quot;Thêm danh mục&quot; để tạo loại sản phẩm đầu tiên
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
