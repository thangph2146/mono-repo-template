"use client";

import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@ui/components/dialog";
import { Label } from "@ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/select";
import {
  Search, Plus, Filter, Download, ImagePlus, Star, Trash2,
  Layers, Droplets, Soup, Milk, Package2, ChevronDown, AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CATEGORIES = [
  { key: "Tất cả",           group: "ALL",       icon: Layers },
  { key: "Nước giải khát",   group: "do-uong",   icon: Droplets },
  { key: "Thực phẩm khô",    group: "thuc-pham", icon: Soup },
  { key: "Sữa và chế phẩm",  group: "sua-bot",   icon: Milk },
  { key: "Gia vị & Dầu ăn",  group: "gia-vi",    icon: Package2 },
];

type UnitStock = { unitType: string; unitLabel: string; stock: number; wholesalePrice: string; retailPrice: string };

type Product = {
  id: string;
  name: string;
  category: string;
  categoryGroup: string;
  brand: string;
  sku: string;
  status: "Còn hàng" | "Sắp hết" | "Hết hàng";
  unitStocks: UnitStock[];
  images: number;
  primaryImage: string;
};

const INITIAL_INVENTORY: Product[] = [
  {
    id: "PROD-001",
    name: "Nước Ngọt Có Ga Coca-Cola 320ml",
    category: "Nước giải khát",
    categoryGroup: "do-uong",
    brand: "Coca-Cola",
    sku: "CC-320-24",
    status: "Còn hàng",
    images: 2,
    primaryImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuB-5MIMJYegmXMs4WyemXVbNzwCVDSBCPEE5Q45ACmYPfLmOVzjdqQv5rGqXkwG0AeU9B_RsEXVVXOXHXmjdbx_kgLpuIf3tiqUZWrUT1ISeVW4URC4pmq7dFJf6dF9ObCBU5TfdxBu0ARsPhzJ8OG_kaEPEguZYM12n-ZLvT8nL_wQxJIztupPlWNx_yUZIAfchDxZ5oDctVMM-ipK-XabO5I-rTLUuYo-kmAsbnkXehFso2IDImjDe85FcC8KRoo0T1zbvh3Z70E",
    unitStocks: [
      { unitType: "thùng", unitLabel: "Thùng (24 lon)", stock: 450, wholesalePrice: "185.000đ", retailPrice: "200.000đ" },
      { unitType: "lon",   unitLabel: "Lẻ từng lon",    stock: 450 * 24, wholesalePrice: "—", retailPrice: "9.500đ" },
    ],
  },
  {
    id: "PROD-002",
    name: "Mì Hảo Hảo Tôm Chua Cay 75g",
    category: "Thực phẩm khô",
    categoryGroup: "thuc-pham",
    brand: "Acecook",
    sku: "HH-TCC-30",
    status: "Còn hàng",
    images: 1,
    primaryImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDyrWT2YwfoQjQ8JTUUKPO3oUThhOjabvaCaigudtT2AnT4Fl9KwMhwru5roS76Xpb9l743b81FU605aOA3ISWCL-ZWih9Sg4pIypvMlyXAgQ_RvKkoFrneEL-i3fZZl66BkSVLvdjCMZefKV2Iv5gygNggGqyJyGk71dTHmnuLfv251bdNIAUbqoikJIdk8ewGjNBsBFwdHYpJkBCoFsjlT0JHTYsYcyrxj_n9aXf1ptJFDkTlRjks3OvZydi28RNe69etc6zGIDY",
    unitStocks: [
      { unitType: "thùng", unitLabel: "Thùng (30 gói)", stock: 1200, wholesalePrice: "110.000đ", retailPrice: "130.000đ" },
      { unitType: "gói",   unitLabel: "Lẻ từng gói",    stock: 1200 * 30, wholesalePrice: "—", retailPrice: "4.500đ" },
    ],
  },
  {
    id: "PROD-003",
    name: "Sữa Tươi Tiệt Trùng Vinamilk Có Đường 180ml",
    category: "Sữa và chế phẩm",
    categoryGroup: "sua-bot",
    brand: "Vinamilk",
    sku: "VNM-SUA-180-4",
    status: "Còn hàng",
    images: 1,
    primaryImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDO4v4rA6d4KabXIZqz7possiXK9y5KZ9P-3DLUMOQ9X2rZtoCBKSPuhI3nK9w03TVpgcEDAzqRUx-oAOeGWUQzcwvzWmWOj7wTgSbqT95MmbqwxqnRNTEewnwcq9qOia_4fZ3r1ZZ5opS5zM79rvMdD36lbmdYuROXv20RzDM0B9-a6hzPrGTS7GVmoFyHNOTBMHhZDBxwO7rydvxxIxBOu-a1kFvVWeGDh_W8AExEZ7jf7JSbrdFm4LAQOs03L5DmO9PyfC4fQhI",
    unitStocks: [
      { unitType: "thùng", unitLabel: "Thùng (48 hộp)", stock: 950,      wholesalePrice: "342.000đ", retailPrice: "384.000đ" },
      { unitType: "lốc",   unitLabel: "Lốc (4 hộp)",    stock: 950 * 12, wholesalePrice: "28.500đ",  retailPrice: "32.000đ" },
      { unitType: "hộp",   unitLabel: "Lẻ từng hộp",    stock: 950 * 48, wholesalePrice: "—",         retailPrice: "8.500đ" },
    ],
  },
  {
    id: "PROD-004",
    name: "Dầu ăn Tường An Cooking Oil 1 Lít",
    category: "Gia vị & Dầu ăn",
    categoryGroup: "gia-vi",
    brand: "Tường An",
    sku: "TA-OIL-1L",
    status: "Sắp hết",
    images: 1,
    primaryImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBkgLbfndvipRk3_pZ5TM8pADd0a20PN-oPdnHBEbIBWl38y6HA66dHyyiOuT9pKejs16kMAWN2AGmxV2o7CxReLU2ozBr1JalwbiJ1hQaZtZDNMxizt8rFiK1RtCmggUElOsIfk4XAF88jp41vhUU2QplYB-F7FCvjTWHT8Kk8eU_7jS6Ux9s5m6CxzzyMIo78Y-H8PlEeG8Ge_GW7NONcq9VHUfBoAYILXXkOYPAUT-EWWPjUTHnladjUwdrt55KIPs4oJw2x9Pk",
    unitStocks: [
      { unitType: "thùng", unitLabel: "Thùng (12 chai)", stock: 15,   wholesalePrice: "540.000đ", retailPrice: "600.000đ" },
      { unitType: "can",   unitLabel: "Can (5 lít)",      stock: 30,   wholesalePrice: "210.000đ", retailPrice: "230.000đ" },
      { unitType: "chai",  unitLabel: "Lẻ từng chai (1L)",stock: 15*12,wholesalePrice: "—",         retailPrice: "50.000đ" },
    ],
  },
];

export default function InventoryPage() {
  const [inventory] = useState<Product[]>(INITIAL_INVENTORY);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);

  const [modalImages, setModalImages] = useState([
    { id: 1, url: "https://via.placeholder.com/150/006a61/ffffff?text=Ảnh+1", isPrimary: true },
    { id: 2, url: "https://via.placeholder.com/150/eaf1ff/0b1c30?text=Ảnh+2", isPrimary: false },
  ]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const setPrimaryImage = (id: number) =>
    setModalImages((imgs) => imgs.map((img) => ({ ...img, isPrimary: img.id === id })));

  const handleSave = () => {
    toast.success("Đã lưu sản phẩm thành công!");
    setDialogOpen(false);
  };

  const filtered = inventory.filter((p) => {
    const matchCat = categoryFilter === "ALL" || p.categoryGroup === categoryFilter;
    const q = searchTerm.toLowerCase().trim();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground">Quản lý Hàng hóa & Kho</h1>
          <p className="text-on-surface-variant font-medium mt-1">Phân loại danh mục, quản lý đơn vị (thùng / can / chai / lốc / gói) và theo dõi tồn kho</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="flex items-center gap-2 shadow-md h-12 px-6 rounded-xl font-bold" />}>
            <Plus className="w-5 h-5" /> Thêm sản phẩm mới
          </DialogTrigger>
          <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold">Thêm / Sửa sản phẩm</DialogTitle>
              <DialogDescription>Điền đầy đủ thông tin sản phẩm, chọn danh mục, đơn vị tính và tải ảnh lên.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-2">
              {/* Basic info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pname">Tên sản phẩm</Label>
                  <Input id="pname" placeholder="VD: Coca-Cola 320ml" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pbrand">Thương hiệu</Label>
                  <Input id="pbrand" placeholder="VD: Coca-Cola" />
                </div>
                <div className="space-y-2">
                  <Label>Danh mục</Label>
                  <Select>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="do-uong">Nước giải khát</SelectItem>
                      <SelectItem value="thuc-pham">Thực phẩm khô</SelectItem>
                      <SelectItem value="sua-bot">Sữa và chế phẩm</SelectItem>
                      <SelectItem value="gia-vi">Gia vị & Dầu ăn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="psku">Mã SKU</Label>
                  <Input id="psku" placeholder="VD: CC-320-24" />
                </div>
              </div>

              {/* Unit types */}
              <div className="border border-outline-variant rounded-xl p-4 space-y-3 bg-muted/10">
                <p className="font-bold text-sm text-foreground">Đơn vị tính & Giá theo loại hàng</p>
                <p className="text-xs text-on-surface-variant">Định nghĩa các đơn vị bán (thùng, can, chai, lốc, gói...) cùng giá sỉ và giá lẻ tương ứng.</p>
                {(["thùng", "can", "chai"] as const).map((unit) => (
                  <div key={unit} className="grid grid-cols-3 gap-3 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs capitalize">{unit.charAt(0).toUpperCase() + unit.slice(1)} – Mô tả</Label>
                      <Input placeholder={`VD: Thùng (24 lon)`} className="h-9 text-sm rounded-lg" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Giá Sỉ / {unit}</Label>
                      <Input placeholder="VD: 185.000" className="h-9 text-sm rounded-lg" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Giá Lẻ / {unit}</Label>
                      <Input placeholder="VD: 200.000" className="h-9 text-sm rounded-lg" />
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg">
                  <Plus className="w-3 h-3 mr-1" /> Thêm đơn vị khác
                </Button>
              </div>

              {/* Images */}
              <div className="border border-outline-variant rounded-xl p-4 space-y-3 bg-muted/10">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-sm text-foreground">Ảnh sản phẩm</p>
                  <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg">
                    <ImagePlus className="w-3.5 h-3.5 mr-1.5" /> Tải ảnh lên
                  </Button>
                </div>
                <p className="text-xs text-on-surface-variant">Tải nhiều ảnh. Nhấn ⭐ để đặt ảnh đại diện (Primary).</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {modalImages.map((img) => (
                    <div key={img.id} className={`relative group border-2 rounded-xl overflow-hidden aspect-square bg-white ${img.isPrimary ? "border-warning shadow-md" : "border-outline-variant"}`}>
                      <img src={img.url} alt="Ảnh sản phẩm" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                        {!img.isPrimary && (
                          <Button variant="secondary" size="sm" className="h-7 text-[10px] font-bold" onClick={() => setPrimaryImage(img.id)}>
                            <Star className="w-2.5 h-2.5 mr-1" /> Đặt chính
                          </Button>
                        )}
                        <Button variant="destructive" size="icon" className="h-7 w-7">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      {img.isPrimary && (
                        <div className="absolute top-1.5 left-1.5 bg-warning text-warning-foreground text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center">
                          <Star className="w-2.5 h-2.5 mr-0.5 fill-current" /> Chính
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="border-2 border-dashed border-outline-variant rounded-xl aspect-square flex flex-col items-center justify-center text-on-surface-variant hover:bg-muted/50 cursor-pointer transition-colors">
                    <Plus className="w-6 h-6 mb-1 opacity-50" />
                    <span className="text-[10px] font-medium">Thêm ảnh</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="mr-auto rounded-xl" onClick={() => setDialogOpen(false)}>Hủy</Button>
              <Button className="rounded-xl font-bold" onClick={handleSave}>Lưu sản phẩm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active = categoryFilter === cat.group;
          const count = cat.group === "ALL" ? inventory.length : inventory.filter((p) => p.categoryGroup === cat.group).length;
          return (
            <button
              key={cat.group}
              onClick={() => setCategoryFilter(cat.group)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-all ${
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-background border-outline-variant text-on-surface-variant hover:bg-muted"
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.key}
              <Badge className={`text-[10px] px-1.5 py-0 ml-0.5 ${active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                {count}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Search + actions */}
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
          <Input
            placeholder="Tìm mã SP, tên sản phẩm, thương hiệu..."
            className="pl-10 bg-background border-outline-variant rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex items-center gap-2 bg-background border-outline-variant rounded-xl font-semibold">
            <Filter className="w-4 h-4" /> Lọc
          </Button>
          <Button variant="outline" className="flex items-center gap-2 bg-background border-outline-variant rounded-xl font-semibold">
            <Download className="w-4 h-4" /> Xuất CSV
          </Button>
        </div>
      </div>

      {/* Product cards */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const expanded = expandedIds.has(item.id);
          const mainUnit = item.unitStocks[0];
          return (
            <div key={item.id} className="bg-background border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
              {/* Row */}
              <div
                className="flex flex-wrap items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors select-none"
                onClick={() => toggleExpand(item.id)}
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-xl border border-outline-variant/40 bg-white flex items-center justify-center shrink-0 overflow-hidden">
                  <img src={item.primaryImage} alt="" className="w-full h-full object-contain p-1" />
                </div>

                {/* Name + meta */}
                <div className="flex-grow min-w-0">
                  <p className="font-bold text-foreground line-clamp-1">{item.name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge className="text-[10px] px-2 py-0 bg-muted text-on-surface-variant border-outline-variant/40 font-semibold">
                      {item.category}
                    </Badge>
                    <span className="text-xs text-on-surface-variant">{item.brand}</span>
                    <span className="text-xs text-on-surface-variant font-mono">{item.sku}</span>
                    <span className="text-xs text-on-surface-variant">
                      {item.unitStocks.length} đơn vị: {item.unitStocks.map((u) => u.unitType).join(" / ")}
                    </span>
                  </div>
                </div>

                {/* Stock + status + expand */}
                <div className="flex items-center gap-3 flex-wrap justify-end shrink-0">
                  <div className="text-right">
                    <p className="font-black text-lg text-foreground">{mainUnit.stock}</p>
                    <p className="text-xs text-on-surface-variant">{mainUnit.unitType}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      item.status === "Còn hàng" ? "bg-success/15 text-success border-success/20" :
                      item.status === "Sắp hết"  ? "bg-warning/15 text-warning border-warning/20" :
                                                    "bg-destructive/15 text-destructive border-destructive/20"
                    }
                  >
                    {item.status === "Sắp hết" && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {item.status}
                  </Badge>
                  <Button variant="ghost" size="sm" className="font-bold text-primary hover:bg-primary/10 rounded-xl"
                    onClick={(e) => { e.stopPropagation(); toast.success(`Đang sửa ${item.name}`); }}>
                    Sửa
                  </Button>
                  {expanded
                    ? <ChevronDown className="w-4 h-4 text-outline rotate-180 transition-transform" />
                    : <ChevronDown className="w-4 h-4 text-outline transition-transform" />}
                </div>
              </div>

              {/* Expanded: unit breakdown */}
              {expanded && (
                <div className="border-t border-outline-variant/30 px-5 py-4 bg-surface/40">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                    Chi tiết tồn kho theo đơn vị hàng hóa
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {item.unitStocks.map((u) => (
                      <div key={u.unitType} className="rounded-xl border border-outline-variant/40 bg-background p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-foreground">{u.unitLabel}</span>
                          <Badge className="text-[10px] px-2 py-0 bg-primary/10 text-primary border-primary/20 font-bold capitalize">
                            {u.unitType}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-on-surface-variant">Tồn kho</span>
                          <span className="font-black text-foreground">{u.stock.toLocaleString()} {u.unitType}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-on-surface-variant">Giá Sỉ</span>
                          <span className="font-bold text-primary">{u.wholesalePrice}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-on-surface-variant">Giá Lẻ</span>
                          <span className="font-bold text-foreground">{u.retailPrice}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-outline-variant">
          <Package2 className="w-16 h-16 mx-auto text-outline-variant opacity-20 mb-4" />
          <p className="text-xl font-bold text-on-surface-variant">Không có sản phẩm phù hợp</p>
        </div>
      )}
    </div>
  );
}
