"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  GripVertical,
  AlertCircle,
  Loader2,
  ImagePlus,
  X,
} from "lucide-react";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Badge } from "@ui/components/badge";
import { Switch } from "@ui/components/switch";
import { Skeleton } from "@ui/components/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { PageSection } from "@ui/components/layout";
import { TypographyH1 } from "@ui/components/typography";
import {
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_SUBTITLE_CLASS,
} from "@ui/lib/layout-shell";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DEFAULT_API_URL } from "@workspace/api-client";
import { api } from "@/lib/api";
import { readAdminSession } from "@/lib/auth-session";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { ScrollArea } from "@ui/components/scroll-area";

interface GuideStep {
  order: number;
  title: string;
  description: string;
  imageUrl?: string;
}

interface GuideGroup {
  id: string;
  pageKey: string;
  sectionKey: string;
  isVisible: boolean;
  content: {
    title?: string;
    description?: string;
    order?: number;
    steps?: GuideStep[];
  };
}

interface ListResult {
  data: GuideGroup[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const PAGE_KEY = "huong-dan-su-dung";

function parseContent(raw: unknown): GuideGroup["content"] {
  if (typeof raw === "string") {
    try { raw = JSON.parse(raw); } catch { return { title: "", description: "", order: 0, steps: [] }; }
  }
  if (raw == null || typeof raw !== "object") return { title: "", description: "", order: 0, steps: [] };
  const r = raw as Record<string, unknown>;
  return {
    title: typeof r.title === "string" ? r.title : "",
    description: typeof r.description === "string" ? r.description : "",
    order: typeof r.order === "number" ? r.order : 0,
    steps: Array.isArray(r.steps)
      ? (r.steps as Record<string, unknown>[]).map((s, i) => ({
          order: typeof s.order === "number" ? s.order : i + 1,
          title: typeof s.title === "string" ? s.title : "",
          description: typeof s.description === "string" ? s.description : "",
          imageUrl: typeof s.imageUrl === "string" ? s.imageUrl : undefined,
        }))
      : [],
  };
}

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "");
}

function authHeaders(): Record<string, string> {
  const uid = readAdminSession()?.id;
  return uid ? { "X-User-Id": String(uid) } : {};
}

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folderPath", "guides");
  const res = await fetch(`${apiBase()}/admin/uploads`, {
    method: "POST",
    headers: authHeaders(),
    body: fd,
  });
  if (!res.ok) throw new Error("Upload thất bại");
  const json = (await res.json()) as { data?: { url?: string } };
  const url = json.data?.url;
  if (!url) throw new Error("Không nhận được URL ảnh");
  return url;
}

function ImageUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch {
      toast.error("Upload ảnh thất bại");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>Hình ảnh minh họa</Label>
      {value ? (
        <div className="relative w-full overflow-hidden rounded-lg border">
          <img src={value} alt="" className="h-80 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex h-24 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-60"
        >
          {uploading
            ? <><Loader2 className="size-4 animate-spin" />Đang tải…</>
            : <><ImagePlus className="size-4" />Chọn ảnh</>}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      {value && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL ảnh"
          className="h-7 text-xs font-mono"
        />
      )}
    </div>
  );
}

function StepEditor({
  steps,
  onChange,
}: {
  steps: GuideStep[];
  onChange: (steps: GuideStep[]) => void;
}) {
  const addStep = () =>
    onChange([...steps, { order: steps.length + 1, title: "", description: "", imageUrl: "" }]);

  const removeStep = (i: number) =>
    onChange(steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx + 1 })));

  const update = (i: number, patch: Partial<GuideStep>) =>
    onChange(steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next.map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div key={i} className="rounded-lg border bg-muted/20 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronUp className="size-3.5" />
              </button>
              <GripVertical className="size-3.5 text-muted-foreground/40" />
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === steps.length - 1}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronDown className="size-3.5" />
              </button>
            </div>
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {step.order}
            </span>
            <Input
              value={step.title}
              onChange={(e) => update(i, { title: e.target.value })}
              placeholder="Tiêu đề bước"
              className="h-7 flex-1 text-sm"
            />
            <button
              type="button"
              onClick={() => removeStep(i)}
              className="shrink-0 rounded p-1 text-muted-foreground hover:text-rose-500"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
          <Textarea
            value={step.description}
            onChange={(e) => update(i, { description: e.target.value })}
            placeholder="Mô tả chi tiết bước này…"
            rows={2}
            className="resize-none text-sm"
          />
          <ImageUploadField
            value={step.imageUrl ?? ""}
            onChange={(url) => update(i, { imageUrl: url })}
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addStep} className="gap-1.5">
        <Plus className="size-3.5" />
        Thêm bước
      </Button>
    </div>
  );
}

function SortableGroupCard({
  grp,
  expandedId,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  grp: GuideGroup;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onEdit: (grp: GuideGroup) => void;
  onDelete: (grp: GuideGroup) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: grp.id });
  const c = parseContent(grp.content);
  const isExpanded = expandedId === grp.id;

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex flex-col overflow-hidden"
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
              aria-label="Kéo để sắp xếp"
            >
              <GripVertical className="size-4" />
            </button>
            <div className="min-w-0">
              <CardTitle className="truncate text-sm">{c.title || grp.sectionKey}</CardTitle>
              <CardDescription className="font-mono text-xs">{grp.sectionKey}</CardDescription>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={`shrink-0 ${grp.isVisible
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"}`}
          >
            {grp.isVisible
              ? <><Eye className="mr-1 size-3" />Hiện</>
              : <><EyeOff className="mr-1 size-3" />Ẩn</>}
          </Badge>
        </div>
        {c.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-3 pt-0">
        {(c.steps?.length ?? 0) > 0 && (
          <>
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
              onClick={() => onToggleExpand(grp.id)}
            >
              {isExpanded
                ? <><ChevronUp className="size-3.5" />Ẩn bước</>
                : <><ChevronDown className="size-3.5" />{c.steps!.length} bước</>}
            </button>

            {isExpanded && (
              <div className="space-y-2">
                {c.steps!.map((step) => (
                  <div key={step.order} className="overflow-hidden rounded-lg border bg-muted/20">
                    {step.imageUrl && (
                      <img src={step.imageUrl} alt={step.title} className="h-50 w-full object-cover" />
                    )}
                    <div className="space-y-0.5 p-2">
                      <div className="flex items-center gap-1.5">
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                          {step.order}
                        </span>
                        <p className="text-xs font-semibold">{step.title}</p>
                      </div>
                      {step.description && (
                        <p className="pl-5 text-[11px] text-muted-foreground">{step.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => onEdit(grp)}
          >
            <Pencil className="size-3" />
            Sửa
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-rose-600"
            onClick={() => onDelete(grp)}
          >
            <Trash2 className="size-3" />
            Xóa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GroupFormDialog({
  open,
  initial,
  onClose,
  onSave,
  isSaving,
}: {
  open: boolean;
  initial: GuideGroup | null;
  onClose: () => void;
  onSave: (data: {
    sectionKey: string;
    isVisible: boolean;
    content: GuideGroup["content"];
  }) => void;
  isSaving: boolean;
}) {
  const isEdit = !!initial?.id;

  const [sectionKey, setSectionKey] = useState(initial?.sectionKey ?? "");
  const [isVisible, setIsVisible] = useState(initial?.isVisible ?? true);
  const [content, setContent] = useState<GuideGroup["content"]>(
    initial ? parseContent(initial.content) : { title: "", description: "", order: 0, steps: [] },
  );

  const reset = () => {
    setSectionKey(initial?.sectionKey ?? "");
    setIsVisible(initial?.isVisible ?? true);
    setContent(
      initial ? parseContent(initial.content) : { title: "", description: "", order: 0, steps: [] },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="size-5" />
            {isEdit ? "Chỉnh sửa nhóm hướng dẫn" : "Thêm nhóm hướng dẫn mới"}
          </DialogTitle>
          <DialogDescription>
            Mỗi nhóm gồm tiêu đề, mô tả và danh sách các bước kèm ảnh minh họa.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="px-2 max-h-[70vh] overflow-y-auto">
        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="sectionKey">
              Mã nhóm (sectionKey) <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="sectionKey"
              value={sectionKey}
              onChange={(e) => setSectionKey(e.target.value)}
              placeholder="vd: dang-nhap, xem-diem"
              disabled={isEdit}
            />
            <p className="text-xs text-muted-foreground">Slug duy nhất, không dấu, dùng gạch ngang.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Tiêu đề nhóm</Label>
            <Input
              id="title"
              value={content.title ?? ""}
              onChange={(e) => setContent((c) => ({ ...c, title: e.target.value }))}
              placeholder="vd: Hướng dẫn đăng nhập hệ thống"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc">Mô tả nhóm</Label>
            <Textarea
              id="desc"
              value={content.description ?? ""}
              onChange={(e) => setContent((c) => ({ ...c, description: e.target.value }))}
              placeholder="Mô tả ngắn về nhóm hướng dẫn này…"
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Các bước thực hiện</Label>
            <StepEditor
              steps={content.steps ?? []}
              onChange={(steps) => setContent((c) => ({ ...c, steps }))}
            />
          </div>

          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Switch id="visible" checked={isVisible} onCheckedChange={setIsVisible} />
            <div>
              <Label htmlFor="visible" className="cursor-pointer">Hiển thị công khai</Label>
              <p className="text-xs text-muted-foreground">Tắt để ẩn nhóm này khỏi trang frontend.</p>
            </div>
          </div>
        </div>
        </ScrollArea> 
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Hủy</Button>
          <Button
            disabled={!sectionKey.trim() || isSaving}
            onClick={() => onSave({ sectionKey: sectionKey.trim(), isVisible, content })}
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : isEdit ? "Lưu thay đổi" : "Tạo mới"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GuidesPageInner() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GuideGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GuideGroup | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localGroups, setLocalGroups] = useState<GuideGroup[]>([]);
  const isReorderingRef = useRef(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data, isLoading } = useQuery<ListResult>({
    queryKey: ["admin", "guides", page, search],
    queryFn: async () => {
      const qs = new URLSearchParams({ page: String(page), limit: "50", search: `${PAGE_KEY}` });
      if (search.trim()) qs.set("search", search.trim());
      const payload = await api.http.get<unknown>(`/admin/page-contents?${qs}`);
      const env = payload as { data?: ListResult };
      return env.data ?? { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
    },
    staleTime: 15_000,
  });

  const serverGroups = (data?.data ?? [])
    .filter((g) => g.pageKey === PAGE_KEY)
    .sort((a, b) => (parseContent(a.content).order ?? 0) - (parseContent(b.content).order ?? 0));

  // sync localGroups từ server chỉ khi không đang reorder
  useEffect(() => {
    if (!isReorderingRef.current && serverGroups.length > 0) {
      setLocalGroups(serverGroups);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const groups = localGroups.length > 0 ? localGroups : serverGroups;

  const createMutation = useMutation({
    mutationFn: async (body: { sectionKey: string; isVisible: boolean; content: GuideGroup["content"] }) => {
      const nextOrder = groups.length + 1;
      await api.http.post("/admin/page-contents", {
        pageKey: PAGE_KEY,
        ...body,
        content: { ...body.content, order: nextOrder },
      });
    },
    onSuccess: () => {
      toast.success("Đã tạo nhóm hướng dẫn");
      setFormOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["admin", "guides"] });
    },
    onError: () => toast.error("Không thể tạo nhóm"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: { isVisible: boolean; content: GuideGroup["content"] } }) => {
      await api.http.put(`/admin/page-contents/${id}`, body);
    },
    onSuccess: () => {
      toast.success("Đã cập nhật");
      setFormOpen(false);
      setEditTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "guides"] });
    },
    onError: () => toast.error("Không thể cập nhật"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.http.delete(`/admin/page-contents/${id}`);
    },
    onSuccess: () => {
      toast.success("Đã xóa nhóm");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "guides"] });
    },
    onError: () => toast.error("Không thể xóa"),
  });

  const reorderMutation = useMutation({
    mutationFn: async (ordered: GuideGroup[]) => {
      isReorderingRef.current = true;
      for (let idx = 0; idx < ordered.length; idx++) {
        const grp = ordered[idx];
        const c = parseContent(grp.content);
        await api.http.put(`/admin/page-contents/${grp.id}`, {
          isVisible: grp.isVisible,
          content: { ...c, order: idx + 1 },
        });
      }
    },
    onSuccess: () => {
      isReorderingRef.current = false;
      toast.success("Đã lưu thứ tự");
      void queryClient.invalidateQueries({ queryKey: ["admin", "guides"] });
    },
    onError: () => {
      isReorderingRef.current = false;
      toast.error("Không thể lưu thứ tự");
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = groups.findIndex((g) => g.id === active.id);
    const newIndex = groups.findIndex((g) => g.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(groups, oldIndex, newIndex);
    setLocalGroups(reordered);
    reorderMutation.mutate(reordered);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = (formData: { sectionKey: string; isVisible: boolean; content: GuideGroup["content"] }) => {
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, body: { isVisible: formData.isVisible, content: formData.content } });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            <BookOpen className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
            Hướng dẫn sử dụng
          </TypographyH1>
          <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
            Quản lý nhóm hướng dẫn — kéo thả để sắp xếp thứ tự hiển thị.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {reorderMutation.isPending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          <Button onClick={() => { setEditTarget(null); setFormOpen(true); }} className="gap-2">
            <Plus className="size-4" />
            Thêm nhóm
          </Button>
        </div>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Tìm theo sectionKey hoặc tiêu đề…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      )}

      {!isLoading && groups.length === 0 && (
        <Card className="py-12 text-center">
          <CardContent className="flex flex-col items-center gap-3">
            <AlertCircle className="size-8 text-muted-foreground" />
            <p className="font-semibold">Chưa có nhóm hướng dẫn nào</p>
            <p className="text-sm text-muted-foreground">Nhấn &ldquo;Thêm nhóm&rdquo; để bắt đầu.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && groups.length > 0 && (
        <div className="space-y-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={groups.map((g) => g.id)} strategy={rectSortingStrategy}>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {groups.map((grp) => (
                  <SortableGroupCard
                    key={grp.id}
                    grp={grp}
                    expandedId={expandedId}
                    onToggleExpand={(id) => setExpandedId((prev) => (prev === id ? null : id))}
                    onEdit={(g) => { setEditTarget(g); setFormOpen(true); }}
                    onDelete={(g) => setDeleteTarget(g)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {(data?.pagination.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</Button>
              <span className="text-sm text-muted-foreground">{page} / {data?.pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= (data?.pagination.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}>Tiếp</Button>
            </div>
          )}
        </div>
      )}

      <GroupFormDialog
        key={editTarget?.id ?? "new"}
        open={formOpen}
        initial={editTarget}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Xóa nhóm hướng dẫn <strong>{deleteTarget?.sectionKey}</strong>? Thao tác không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageSection>
  );
}

export default function GuidesPage() {
  return (
    <AdminPageGuard permission="page_contents:view">
      <GuidesPageInner />
    </AdminPageGuard>
  );
}
