"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LexicalEditor } from "@thangph2146/lexical-editor";
import type { SerializedEditorState } from "lexical";
import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  RowSelectionState,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Checkbox } from "@ui/components/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@ui/components/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { PageSection } from "@ui/components/layout";
import { Switch } from "@ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Textarea } from "@ui/components/textarea";
import { TypographyH1 } from "@ui/components/typography";
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  CalendarClock,
  ChevronDown,
  FileText,
  Globe,
  ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tags,
  Trash2,
} from "lucide-react";
import { AdminConfirmActionDialog } from "@/components/admin-confirm-action-dialog";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminTablePaginationFooter } from "@/components/admin-table-pagination-footer";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  ADMIN_ALERT_DIALOG_CONTENT_CLASS,
  ADMIN_DIALOG_CONTENT_POST_CLASS,
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";

type TaxonomyOption = {
  id: string;
  name: string;
};

type CategoryTreeOption = TaxonomyOption & {
  parentId?: string | null;
  sortOrder?: number;
  subRows?: CategoryTreeOption[];
};

type PostListRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  categories: TaxonomyOption[];
  tags: TaxonomyOption[];
};

type PostConfirmAction =
  | { kind: "delete"; row: PostListRow }
  | { kind: "restore"; row: PostListRow }
  | { kind: "purge"; row: PostListRow };

type PostDetail = PostListRow & {
  content: unknown;
};

type PagedResult<T> = { items: T[]; total: number };
type ApiEnvelope<T> = { success?: boolean; message?: string; error?: string | null; data?: T };
type PagedApiShape<T> = { data: T[]; pagination?: { total?: number } };
type FormState = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  content: unknown;
  published: boolean;
  publishedAt: string;
  categoryIds: string[];
  tagIds: string[];
};

type EditorTextNodeShape = {
  detail: number;
  format: number;
  mode: "normal";
  style: string;
  text: string;
  type: "text";
  version: 1;
};

type EditorParagraphNodeShape = {
  children: EditorTextNodeShape[];
  direction: null;
  format: string;
  indent: number;
  textFormat: number;
  textStyle: string;
  type: "paragraph";
  version: 1;
};

type EditorStateShape = {
  root: {
    children: EditorParagraphNodeShape[];
    direction: null;
    format: string;
    indent: number;
    type: "root";
    version: 1;
  };
};

function createParagraphNode(text = ""): EditorParagraphNodeShape {
  return {
    children: text
      ? [
        {
          detail: 0,
          format: 0,
          mode: "normal",
          style: "",
          text,
          type: "text",
          version: 1,
        },
      ]
      : [],
    direction: null,
    format: "",
    indent: 0,
    textFormat: 0,
    textStyle: "",
    type: "paragraph",
    version: 1,
  };
}

function createSerializedEditorState(paragraphs: EditorParagraphNodeShape[]): SerializedEditorState {
  const state: EditorStateShape = {
    root: {
      children: paragraphs,
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
  return state as SerializedEditorState;
}

const EMPTY_EDITOR_PARAGRAPHS: EditorParagraphNodeShape[] = [createParagraphNode()];
const EMPTY_EDITOR_STATE = createSerializedEditorState(EMPTY_EDITOR_PARAGRAPHS);

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  image: "",
  content: EMPTY_EDITOR_STATE,
  published: false,
  publishedAt: "",
  categoryIds: [],
  tagIds: [],
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getSeoStatus(length: number, recommendedMin: number, recommendedMax: number) {
  if (length === 0) {
    return {
      label: "Chưa có nội dung",
      tone: "destructive" as const,
      hint: `Nên nhập khoảng ${recommendedMin}-${recommendedMax} ký tự.`,
    };
  }
  if (length < recommendedMin) {
    return {
      label: "Hơi ngắn",
      tone: "secondary" as const,
      hint: `Nên tăng lên khoảng ${recommendedMin}-${recommendedMax} ký tự.`,
    };
  }
  if (length > recommendedMax) {
    return {
      label: "Hơi dài",
      tone: "secondary" as const,
      hint: `Nên rút xuống khoảng ${recommendedMin}-${recommendedMax} ký tự.`,
    };
  }
  return {
    label: "Tốt cho SEO",
    tone: "default" as const,
    hint: `Độ dài đang nằm trong khoảng gợi ý ${recommendedMin}-${recommendedMax} ký tự.`,
  };
}

function buildCategoryOptionTree(rows: CategoryTreeOption[]): CategoryTreeOption[] {
  const byId = new Map<string, CategoryTreeOption>();

  for (const row of rows) {
    byId.set(row.id, {
      ...row,
      subRows: [],
    });
  }

  const roots: CategoryTreeOption[] = [];
  for (const row of byId.values()) {
    const parentId = row.parentId ?? null;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId)?.subRows?.push(row);
      continue;
    }
    roots.push(row);
  }

  const sortTree = (items: CategoryTreeOption[]): CategoryTreeOption[] =>
    [...items]
      .sort((a, b) => {
        const sortDelta = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        if (sortDelta !== 0) return sortDelta;
        return a.name.localeCompare(b.name, "vi");
      })
      .map((item) => ({
        ...item,
        subRows: sortTree(item.subRows ?? []),
      }));

  return sortTree(roots);
}

function CategoryTreeChecklist({
  rows,
  selectedIds,
  onToggle,
  depth = 0,
}: {
  rows: CategoryTreeOption[];
  selectedIds: string[];
  onToggle: (id: string, checked: boolean) => void;
  depth?: number;
}) {
  return (
    <div className="space-y-2">
      {rows.map((item) => (
        <CategoryTreeChecklistItem
          key={item.id}
          item={item}
          selectedIds={selectedIds}
          onToggle={onToggle}
          depth={depth}
        />
      ))}
    </div>
  );
}

function CategoryTreeChecklistItem({
  item,
  selectedIds,
  onToggle,
  depth,
}: {
  item: CategoryTreeOption;
  selectedIds: string[];
  onToggle: (id: string, checked: boolean) => void;
  depth: number;
}) {
  const hasChildren = (item.subRows?.length ?? 0) > 0;
  const isSelected = selectedIds.includes(item.id);

  return (
    <Collapsible defaultOpen className="space-y-2">
      <div
        className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-2 py-1 text-sm"
        style={{ marginLeft: `${depth * 16}px` }}
      >
        {hasChildren ? (
          <CollapsibleTrigger
            className="flex size-5 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={`An hien danh muc con cua ${item.name}`}
          >
            <ChevronDown className="size-4" />
          </CollapsibleTrigger>
        ) : (
          "")}
        {hasChildren ? (
          ""
        ) : (
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onToggle(item.id, checked === true)}
            aria-label={`Chon danh muc ${item.name}`}
          />
        )}
        <span className="min-w-0 flex-1 truncate">{item.name}</span>
        {hasChildren ? (
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {item.subRows?.length} muc con
          </Badge>
        ) : null}
      </div>

      {hasChildren ? (
        <CollapsibleContent>
          <CategoryTreeChecklist
            rows={item.subRows ?? []}
            selectedIds={selectedIds}
            onToggle={onToggle}
            depth={depth + 1}
          />
        </CollapsibleContent>
      ) : null}
    </Collapsible>
  );
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (!payload || typeof payload !== "object") return payload as T;
  const envelope = payload as ApiEnvelope<T>;
  if (envelope.success === false) {
    throw new Error(envelope.message || envelope.error || "Yeu cau that bai");
  }
  return "data" in envelope ? (envelope.data as T) : (payload as T);
}

function normalizePaged<T>(payload: unknown): PagedResult<T> {
  const data = unwrapEnvelope<PagedApiShape<T> | T[]>(payload);
  if (Array.isArray(data)) return { items: data, total: data.length };
  if (data && typeof data === "object" && Array.isArray(data.data)) {
    return {
      items: data.data,
      total:
        typeof data.pagination?.total === "number"
          ? data.pagination.total
          : data.data.length,
    };
  }
  return { items: [], total: 0 };
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}

function toLocalInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function fromLocalInputValue(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isSerializedEditorState(value: unknown): value is SerializedEditorState {
  return (
    value !== null &&
    typeof value === "object" &&
    "root" in value &&
    value.root !== null &&
    typeof value.root === "object" &&
    "type" in (value.root as Record<string, unknown>) &&
    (value.root as Record<string, unknown>).type === "root"
  );
}

function createEditorStateFromPlainText(raw: string): SerializedEditorState {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line, index, arr) => line !== "" || index < arr.length - 1);
  const paragraphs =
    lines.length > 0 ? lines.map((line) => createParagraphNode(line)) : EMPTY_EDITOR_PARAGRAPHS;

  return createSerializedEditorState(paragraphs);
}

function normalizeContentForEditor(value: unknown): SerializedEditorState {
  if (isSerializedEditorState(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (isSerializedEditorState(parsed)) {
          return parsed;
        }
      } catch {
        // Fallback to plain text import below.
      }
    }

    const plainText =
      typeof window !== "undefined" && /<[^>]+>/.test(value)
        ? new DOMParser().parseFromString(value, "text/html").body.textContent ?? value
        : value;
    return createEditorStateFromPlainText(plainText);
  }
  return EMPTY_EDITOR_STATE;
}

function buildPostsFilterQuery(columnFilters: ColumnFiltersState): Record<string, string> {
  const query: Record<string, string> = {};
  for (const filter of columnFilters) {
    const value = String(filter.value ?? "").trim();
    if (!value) continue;
    if (filter.id === "title") query.title = value;
    else if (filter.id === "published") query.published = value;
  }
  return query;
}

function SummaryBadges({ items }: { items: TaxonomyOption[] }) {
  if (!items.length) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {items.slice(0, 2).map((item) => (
        <Badge key={item.id} variant="outline" className="text-[10px]">
          {item.name}
        </Badge>
      ))}
      {items.length > 2 ? (
        <Badge variant="secondary" className="text-[10px]">
          +{items.length - 2}
        </Badge>
      ) : null}
    </div>
  );
}

function PostsPageInner() {
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState<"list" | "trash">("list");
  const [editorTab, setEditorTab] = useState<"content" | "seo" | "publish" | "taxonomy">("content");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [globalFilter, setGlobalFilter] = useState("");
  const [trashPage, setTrashPage] = useState(1);
  const [trashPageSize, setTrashPageSize] = useState(10);
  const [trashGlobalFilter, setTrashGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [confirmAction, setConfirmAction] = useState<PostConfirmAction | null>(null);
  const [listPostSelection, setListPostSelection] = useState<RowSelectionState>({});
  const [trashPostSelection, setTrashPostSelection] = useState<RowSelectionState>({});
  const debouncedQ = useDebouncedValue(globalFilter, 350);
  const debouncedTrashQ = useDebouncedValue(trashGlobalFilter, 350);
  const postColumnFilterQuery = useMemo(
    () => buildPostsFilterQuery(columnFilters),
    [columnFilters],
  );

  const postsQuery = useQuery({
    queryKey: ["media", "posts", "list", page, pageSize, debouncedQ, postColumnFilterQuery],
    queryFn: async (): Promise<PagedResult<PostListRow>> =>
      normalizePaged(
        await api.http.get("/admin/posts", {
          query: {
            page,
            limit: pageSize,
            search: debouncedQ.trim() || undefined,
            status: "active",
            ...Object.fromEntries(
              Object.entries(postColumnFilterQuery).map(([key, value]) => [
                `filter[${key}]`,
                value,
              ]),
            ),
          },
        }),
      ),
  });

  const trashQuery = useQuery({
    queryKey: ["media", "posts", "trash", trashPage, trashPageSize, debouncedTrashQ],
    enabled: mainTab === "trash",
    queryFn: async (): Promise<PagedResult<PostListRow>> =>
      normalizePaged(
        await api.http.get("/admin/posts", {
          query: {
            page: trashPage,
            limit: trashPageSize,
            search: debouncedTrashQ.trim() || undefined,
            status: "deleted",
          },
        }),
      ),
  });

  const categoriesQuery = useQuery({
    queryKey: ["media", "categories", "options"],
    queryFn: async (): Promise<CategoryTreeOption[]> => {
      const paged = normalizePaged<CategoryTreeOption>(
        await api.http.get("/admin/categories", {
          query: { page: 1, limit: 200, status: "active" },
        }),
      );
      return paged.items.map((item) => ({
        id: String(item.id),
        name: item.name,
        parentId: item.parentId ?? null,
        sortOrder: item.sortOrder ?? 0,
      }));
    },
  });

  const tagsQuery = useQuery({
    queryKey: ["media", "tags", "options"],
    queryFn: async (): Promise<TaxonomyOption[]> => {
      const paged = normalizePaged<TaxonomyOption>(
        await api.http.get("/admin/tags", {
          query: { page: 1, limit: 200, status: "active" },
        }),
      );
      return paged.items;
    },
  });

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["media", "posts"] });
  };
  const categoryTreeOptions = useMemo(
    () => buildCategoryOptionTree(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );

  const createMutation = useMutation({
    mutationFn: async (input: Omit<FormState, "id">) =>
      unwrapEnvelope<PostDetail>(
        await api.http.post("/admin/posts", {
          title: input.title,
          slug: input.slug,
          excerpt: input.excerpt || null,
          image: input.image || null,
          content: input.content,
          published: input.published,
          publishedAt: fromLocalInputValue(input.publishedAt),
          categoryIds: input.categoryIds,
          tagIds: input.tagIds,
        }),
      ),
    onSuccess: invalidateAll,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Omit<FormState, "id"> }) =>
      unwrapEnvelope<PostDetail>(
        await api.http.put(`/admin/posts/${id}`, {
          title: input.title,
          slug: input.slug,
          excerpt: input.excerpt || null,
          image: input.image || null,
          content: input.content,
          published: input.published,
          publishedAt: fromLocalInputValue(input.publishedAt),
          categoryIds: input.categoryIds,
          tagIds: input.tagIds,
        }),
      ),
    onSuccess: invalidateAll,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.http.delete(`/admin/posts/${id}`),
    onSuccess: invalidateAll,
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) =>
      unwrapEnvelope<PostListRow>(await api.http.post(`/admin/posts/${id}/restore`)),
    onSuccess: invalidateAll,
  });

  const purgeMutation = useMutation({
    mutationFn: async (id: string) => api.http.delete(`/admin/posts/${id}/hard-delete`),
    onSuccess: invalidateAll,
  });

  const bulkMutation = useMutation({
    mutationFn: async (input: {
      action: "delete" | "restore" | "hard-delete";
      ids: string[];
    }) => api.http.post("/admin/posts/bulk", input),
    onSuccess: invalidateAll,
  });

  useEffect(() => {
    setPage(1);
  }, [columnFilters, debouncedQ, pageSize]);

  useEffect(() => {
    setTrashPage(1);
  }, [debouncedTrashQ, trashPageSize]);

  useEffect(() => {
    setListPostSelection({});
    setTrashPostSelection({});
  }, [mainTab]);

  const handleColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>(
    (updater) => {
      setColumnFilters((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      );
    },
    [],
  );

  const openCreate = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditorTab("content");
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback(async (row: PostListRow) => {
    try {
      setLoadingDetail(true);
      const detail = unwrapEnvelope<PostDetail>(
        await api.http.get(`/admin/posts/${row.id}`),
      );
      setForm({
        id: detail.id,
        title: detail.title,
        slug: detail.slug,
        excerpt: detail.excerpt ?? "",
        image: detail.image ?? "",
        content: normalizeContentForEditor(detail.content),
        published: detail.published,
        publishedAt: toLocalInputValue(detail.publishedAt),
        categoryIds: detail.categories.map((item) => item.id),
        tagIds: detail.tags.map((item) => item.id),
      });
      setEditorTab("content");
      setDialogOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được bài viết");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const submitting =
    createMutation.isPending || updateMutation.isPending || loadingDetail;
  const normalizedSlug = form.slug.trim() || slugify(form.title);
  const titleLength = form.title.trim().length;
  const excerptLength = form.excerpt.trim().length;
  const titleSeo = getSeoStatus(titleLength, 30, 65);
  const excerptSeo = getSeoStatus(excerptLength, 70, 160);
  const previewPath = normalizedSlug ? `/bai-viet/${normalizedSlug}` : "/bai-viet/ten-bai-viet";

  const handleSave = async () => {
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      excerpt: form.excerpt.trim(),
      image: form.image.trim(),
      content: form.content,
      published: form.published,
      publishedAt: form.publishedAt,
      categoryIds: form.categoryIds,
      tagIds: form.tagIds,
    };

    if (!payload.title) {
      toast.error("Vui lòng nhập tiêu đề bài viết");
      return;
    }

    try {
      if (form.id) {
        await updateMutation.mutateAsync({ id: form.id, input: payload });
        toast.success(`Đã cập nhật bài viết "${payload.title}"`);
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(`Đã tạo bài viết "${payload.title}"`);
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được bài viết");
    }
  };

  const handleConfirmAction = useCallback(async (): Promise<void> => {
    if (!confirmAction) return;
    const { kind, row } = confirmAction;
    try {
      if (kind === "delete") {
        await deleteMutation.mutateAsync(row.id);
        toast.success(`Đã đưa «${row.title}» vào thùng rác`);
      } else if (kind === "restore") {
        await restoreMutation.mutateAsync(row.id);
        toast.success(`Đã khôi phục «${row.title}»`);
      } else {
        await purgeMutation.mutateAsync(row.id);
        toast.success(`Đã xóa vĩnh viễn «${row.title}»`);
      }
      setConfirmAction(null);
    } catch (error) {
      const fallback =
        kind === "delete"
          ? "Không xóa được bài viết"
          : kind === "restore"
            ? "Không khôi phục được bài viết"
            : "Không xóa hẳn được bài viết";
      toast.error(error instanceof Error ? error.message : fallback);
    }
  }, [confirmAction, deleteMutation, purgeMutation, restoreMutation]);

  const columns = useMemo<ColumnDef<PostListRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Tiêu đề",
        meta: { filterPlaceholder: "Lọc tiêu đề…" },
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium">{row.original.title}</p>
            <p className="text-xs text-muted-foreground">{row.original.slug}</p>
          </div>
        ),
      },
      {
        id: "categories",
        header: "Danh mục",
        cell: ({ row }) => <SummaryBadges items={row.original.categories} />,
      },
      {
        id: "tags",
        header: "Thẻ",
        cell: ({ row }) => <SummaryBadges items={row.original.tags} />,
      },
      {
        accessorKey: "published",
        header: "Trạng thái",
        cell: ({ row }) =>
          row.original.published ? (
            <Badge className="text-xs">Đã xuất bản</Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              Bản nháp
            </Badge>
          ),
        filterFn: (row, id, v) => {
          if (v == null || v === "") return true;
          return String(row.getValue(id)) === String(v);
        },
        meta: {
          filterVariant: "select",
          selectOptions: [
            { value: "true", label: "Đã xuất bản" },
            { value: "false", label: "Bản nháp" },
          ],
        },
      },
      {
        accessorKey: "updatedAt",
        header: "Cập nhật",
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {formatDateTime(getValue() as string)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg"
              onClick={() => void openEdit(row.original)}
            >
              <Pencil className="size-3.5" />
              Sửa
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmAction({ kind: "delete", row: row.original })}
            >
              <Trash2 className="size-3.5" />
              Xóa tạm
            </Button>
          </div>
        ),
      },
    ],
    [openEdit],
  );

  const trashColumns = useMemo<ColumnDef<PostListRow>[]>(
    () => [
      { accessorKey: "title", header: "Tiêu đề" },
      {
        accessorKey: "deletedAt",
        header: "Xóa lúc",
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {formatDateTime(getValue() as string)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg"
              onClick={() => setConfirmAction({ kind: "restore", row: row.original })}
            >
              <ArchiveRestore className="size-3.5" />
              Khôi phục
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmAction({ kind: "purge", row: row.original })}
            >
              <Trash2 className="size-3.5" />
              Xóa hẳn
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            <FileText className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
            Bài viết
          </TypographyH1>
          <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
            Quản lý bài viết truyền thông, gắn danh mục và thẻ dùng chung
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex h-12 items-center gap-2 rounded-lg border-outline-variant px-4 font-semibold hover:bg-muted"
            onClick={() => {
              void postsQuery.refetch();
              void trashQuery.refetch();
            }}
          >
            <RefreshCw
              className={
                postsQuery.isFetching || trashQuery.isFetching
                  ? "size-5 animate-spin"
                  : "size-5"
              }
            />
            Làm mới
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button
                  onClick={openCreate}
                  className="flex h-12 items-center gap-2 rounded-lg px-6 font-bold shadow-md"
                />
              }
            >
              <Plus className="size-5" />
              Thêm bài viết
            </DialogTrigger>
            <DialogContent
              className={`${ADMIN_DIALOG_CONTENT_POST_CLASS} max-h-[90vh] overflow-hidden p-0`}
            >
              <DialogHeader className="border-b border-border/70 px-6 py-5">
                <DialogTitle className="text-2xl font-extrabold">
                  {form.id ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
                </DialogTitle>
                <DialogDescription>
                  Soạn nội dung, kiểm tra hiển thị SEO cơ bản và hoàn thiện cấu hình xuất bản trong
                  một màn hình rõ ràng hơn.
                </DialogDescription>
              </DialogHeader>

              <Tabs
                value={editorTab}
                onValueChange={(value) => {
                  if (
                    value === "content" ||
                    value === "seo" ||
                    value === "publish" ||
                    value === "taxonomy"
                  ) {
                    setEditorTab(value);
                  }
                }}
                className="min-h-0 flex-1"
              >
                <div className="border-b border-border/70 px-6 pt-0 pb-3">
                  <TabsList className="h-auto min-h-10 flex-wrap gap-1 rounded-lg bg-muted/70 p-1">
                    <TabsTrigger
                      value="content"
                      className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Nội dung
                    </TabsTrigger>
                    <TabsTrigger
                      value="seo"
                      className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      SEO
                    </TabsTrigger>
                    <TabsTrigger
                      value="publish"
                      className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Xuất bản
                    </TabsTrigger>
                    <TabsTrigger
                      value="taxonomy"
                      className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Phân loại
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="max-h-[calc(90vh-14.5rem)] overflow-y-auto px-6 py-5">
                  <TabsContent value="content" className="mt-0 space-y-4">
                    <Card className="border border-border/70 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Sparkles className="size-5 text-primary" />
                          Biên tập nội dung
                        </CardTitle>
                        <CardDescription>
                          Tập trung vào phần thân bài và bố cục nội dung. Các trường hiển thị SEO đã
                          được chuyển sang tab `SEO`.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="max-w-6xl mx-auto">
                          <LexicalEditor
                            value={form.content}
                            placeholder="Nhập nội dung bài viết..."
                            onChange={(value) =>
                              setForm((current) => ({
                                ...current,
                                content: value,
                              }))
                            }
                            uploadsContext={undefined}
                          />
                        </div>
                      </CardContent>
                    </Card>


                  </TabsContent>

                  <TabsContent value="seo" className="mt-0 space-y-4">
                    <Card className="border border-border/70 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Search className="size-5 text-primary" />
                          SEO cơ bản
                        </CardTitle>
                        <CardDescription>
                          Xem nhanh slug, độ dài tiêu đề và mô tả trước khi lưu bài viết.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="post-title">Tiêu đề bài viết</Label>
                              <Input
                                id="post-title"
                                value={form.title}
                                placeholder="VD: Thông báo tuyển sinh 2026"
                                onChange={(e) => {
                                  const title = e.target.value;
                                  setForm((current) => ({
                                    ...current,
                                    title,
                                    slug: current.id ? current.slug : slugify(title),
                                  }));
                                }}
                              />
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                <span>Tieu de nen ro chu de chinh, de doc va thu hut tren ket qua tim kiem.</span>
                                <Badge variant={titleSeo.tone}>{titleLength} ký tự</Badge>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="post-excerpt">Mô tả ngắn gọn</Label>
                              <Textarea
                                id="post-excerpt"
                                value={form.excerpt}
                                placeholder="Đoạn mô tả ngắn để hiển thị danh sách..."
                                onChange={(e) =>
                                  setForm((current) => ({ ...current, excerpt: e.target.value }))
                                }
                              />
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                <span>Phần này thường được dùng làm mô tả tóm tắt và preview SEO.</span>
                                <Badge variant={excerptSeo.tone}>{excerptLength} ký tự</Badge>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="post-slug">Slug / đường dẫn</Label>
                              <Input
                                id="post-slug"
                                value={form.slug}
                                placeholder="thong-bao-tuyen-sinh-2026"
                                onChange={(e) =>
                                  setForm((current) => ({
                                    ...current,
                                    slug: slugify(e.target.value),
                                  }))
                                }
                              />
                              <p className="text-xs text-muted-foreground">
                                Slug nên ngắn, dễ đọc và bám đúng từ khóa chính của bài viết.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Globe className="size-4 text-primary" />
                                Preview đường dẫn
                              </div>
                              <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                                {previewPath}
                              </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                              <div className="rounded-lg border border-border/70 bg-background p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold">Tiêu đề SEO</p>
                                  <Badge variant={titleSeo.tone}>{titleLength} ký tự</Badge>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">{titleSeo.hint}</p>
                              </div>
                              <div className="rounded-lg border border-border/70 bg-background p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold">Mô tả SEO</p>
                                  <Badge variant={excerptSeo.tone}>{excerptLength} ký tự</Badge>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">{excerptSeo.hint}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Card className="border border-border/70 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <ImageIcon className="size-4 text-primary" />
                              Hình ảnh đại diện
                            </CardTitle>
                            <CardDescription>
                              Ảnh đại diện ảnh hưởng trực tiếp tới preview chia sẻ và cảm nhận trực quan của bài viết.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="post-image">URL ảnh đại diện</Label>
                              <Input
                                id="post-image"
                                value={form.image}
                                placeholder="https://..."
                                onChange={(e) =>
                                  setForm((current) => ({ ...current, image: e.target.value }))
                                }
                              />
                            </div>
                            {form.image.trim() ? (
                              <div className="overflow-hidden rounded-lg border border-border/70 bg-background">
                                <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
                                  <p className="text-sm font-semibold text-foreground">
                                    Xem trước hình ảnh
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    Preview từ URL hiện tại
                                  </span>
                                </div>
                                <div className="bg-muted/20 p-3">
                                  <img
                                    src={form.image.trim()}
                                    alt={form.title.trim() || "Anh dai dien bai viet"}
                                    className="max-h-64 w-full rounded-lg border border-border/60 object-contain bg-background"
                                  />
                                </div>
                              </div>
                            ) : null}
                            <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
                              {form.image.trim()
                                ? "Da co URL anh dai dien. Kiem tra lai ti le va noi dung anh truoc khi xuat ban."
                                : "Chua co anh dai dien. Nen bo sung anh ngang ro noi dung de preview bai viet tot hon."}
                            </div>
                          </CardContent>
                        </Card>

                        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
                          <p className="text-sm font-semibold text-foreground">Preview kết quả tìm kiếm</p>
                          <p className="mt-2 line-clamp-2 text-sm font-medium text-primary">
                            {form.title.trim() || "Tiêu đề bài viết sẽ hiển thị tại đây"}
                          </p>
                          <p className="mt-1 break-all text-xs text-emerald-700 dark:text-emerald-400">
                            hub.local{previewPath}
                          </p>
                          <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
                            {form.excerpt.trim() ||
                              "Mô tả ngắn của bài viết sẽ hiển thị ở đây để bạn kiểm tra cách trình bày SEO cơ bản."}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="publish" className="mt-0 space-y-4">
                    <Card className="border border-border/70 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <CalendarClock className="size-5 text-primary" />
                          Xuất bản
                        </CardTitle>
                        <CardDescription>
                          Kiểm soát trạng thái hiển thị và thời điểm bài viết được phát hành.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border border-outline-variant px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold">Trạng thái hiển thị</p>
                            <p className="text-xs text-muted-foreground">
                              {form.published
                                ? "Bài viết đang ở chế độ xuất bản."
                                : "Bài viết đang là bản nháp, chưa hiển thị công khai."}
                            </p>
                          </div>
                          <Switch
                            checked={form.published}
                            onCheckedChange={(checked) =>
                              setForm((current) => ({ ...current, published: checked }))
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="post-published-at">Thời điểm xuất bản</Label>
                          <Input
                            id="post-published-at"
                            type="datetime-local"
                            value={form.publishedAt}
                            onChange={(e) =>
                              setForm((current) => ({
                                ...current,
                                publishedAt: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="taxonomy" className="mt-0 space-y-4">
                    <Card className="border border-border/70 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Tags className="size-5 text-primary" />
                          Phân loại nội dung
                        </CardTitle>
                        <CardDescription>
                          Gắn danh mục và thẻ để bài viết dễ tìm hơn trong quản trị và ngoài công khai.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Label>Danh mục dùng chung</Label>
                            <Badge variant="outline">{form.categoryIds.length} mục</Badge>
                          </div>
                          <div className="rounded-lg border border-outline-variant p-3">
                            <p className="mb-3 text-xs text-muted-foreground">
                              Danh mục được hiển thị theo tree cha-con để dễ nhìn đúng cấu trúc nội dung.
                            </p>
                            <CategoryTreeChecklist
                              rows={categoryTreeOptions}
                              selectedIds={form.categoryIds}
                              onToggle={(id, checked) =>
                                setForm((current) => ({
                                  ...current,
                                  categoryIds: checked
                                    ? [...current.categoryIds, id]
                                    : current.categoryIds.filter((value) => value !== id),
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Label>Thẻ</Label>
                            <Badge variant="outline">{form.tagIds.length} thẻ</Badge>
                          </div>
                          <div className="grid gap-2 rounded-lg border border-outline-variant p-3 sm:grid-cols-2">
                            {(tagsQuery.data ?? []).map((item) => (
                              <label key={item.id} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={form.tagIds.includes(item.id)}
                                  onCheckedChange={(checked) =>
                                    setForm((current) => ({
                                      ...current,
                                      tagIds: checked
                                        ? [...current.tagIds, item.id]
                                        : current.tagIds.filter((id) => id !== item.id),
                                    }))
                                  }
                                />
                                <span>{item.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>

              <DialogFooter className="flex justify-between items-center border-t border-border/70 bg-muted/20 p-8 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="mr-auto rounded-lg"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  className="rounded-lg font-bold"
                  onClick={() => void handleSave()}
                  disabled={submitting}
                >
                  {submitting ? "Đang lưu..." : "Lưu bài viết"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={(v) => v === "list" || v === "trash" ? setMainTab(v) : null}>
        <TabsList className="h-auto min-h-9 flex-wrap gap-1 rounded-lg p-1">
          <TabsTrigger value="list" className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Danh sách
          </TabsTrigger>
          <TabsTrigger value="trash" className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Thùng rác
            {(trashQuery.data?.total ?? 0) > 0 ? (
              <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-[10px] tabular-nums">
                {trashQuery.data?.total}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4 space-y-4">
          {postsQuery.error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="font-semibold">Không tải được bài viết</p>
                  <p className="mt-1 text-sm opacity-90">{postsQuery.error.message}</p>
                </div>
              </div>
            </div>
          ) : null}

          <AdminDataTable<PostListRow>
            data={postsQuery.data?.items ?? []}
            getRowId={(row) => String(row.id)}
            columns={columns}
            isLoading={postsQuery.isLoading}
            emptyLabel='Chưa có bài viết — bấm "Thêm bài viết".'
            manualFiltering
            columnFilters={columnFilters}
            onColumnFiltersChange={handleColumnFiltersChange}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            globalFilterPlaceholder="Tìm theo tiêu đề, slug..."
            csvExport={{ fileName: "bai-viet-dang-hoat-dong.csv" }}
            rowSelectionEnabled
            selectedRowIds={listPostSelection}
            onSelectedRowIdsChange={setListPostSelection}
            bulkActions={[
              {
                id: "bulk-post-delete",
                label: "Xóa tạm đã chọn",
                variant: "outline",
                className: "border-destructive/40 text-destructive",
                onAction: async (rows) => {
                  const ids = rows.map((r) => String(r.id));
                  if (!ids.length) return;
                  await bulkMutation.mutateAsync({ action: "delete", ids });
                  toast.success(`Đã đưa ${ids.length} bài viết vào thùng rác`);
                },
              },
            ]}
            footer={
              <AdminTablePaginationFooter
                page={page}
                pageSize={pageSize}
                total={postsQuery.data?.total ?? 0}
                isLoading={postsQuery.isLoading}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                emptySummary="Không có bài viết"
                itemLabel="bài viết"
              />
            }
          />
        </TabsContent>

        <TabsContent value="trash" className="mt-4 space-y-4">
          <AdminDataTable<PostListRow>
            data={trashQuery.data?.items ?? []}
            getRowId={(row) => String(row.id)}
            columns={trashColumns}
            isLoading={trashQuery.isLoading}
            emptyLabel="Thùng rác trống."
            manualFiltering
            globalFilter={trashGlobalFilter}
            onGlobalFilterChange={setTrashGlobalFilter}
            globalFilterPlaceholder="Tìm trong thùng rác..."
            csvExport={{ fileName: "bai-viet-thung-rac.csv" }}
            rowSelectionEnabled
            selectedRowIds={trashPostSelection}
            onSelectedRowIdsChange={setTrashPostSelection}
            bulkActions={[
              {
                id: "bulk-post-restore",
                label: "Khôi phục đã chọn",
                onAction: async (rows) => {
                  const ids = rows.map((r) => String(r.id));
                  if (!ids.length) return;
                  await bulkMutation.mutateAsync({ action: "restore", ids });
                  toast.success(`Đã khôi phục ${ids.length} bài viết`);
                },
              },
              {
                id: "bulk-post-purge",
                label: "Xóa vĩnh viễn đã chọn",
                variant: "outline",
                className: "border-destructive/40 text-destructive",
                onAction: async (rows) => {
                  const ids = rows.map((r) => String(r.id));
                  if (!ids.length) return;
                  await bulkMutation.mutateAsync({ action: "hard-delete", ids });
                  toast.success(`Đã xóa vĩnh viễn ${ids.length} bài viết`);
                },
              },
            ]}
            footer={
              <AdminTablePaginationFooter
                page={trashPage}
                pageSize={trashPageSize}
                total={trashQuery.data?.total ?? 0}
                isLoading={trashQuery.isLoading}
                onPageChange={setTrashPage}
                onPageSizeChange={setTrashPageSize}
                emptySummary="Không có bài viết trong thùng rác"
                itemLabel="bài viết"
              />
            }
          />
        </TabsContent>
      </Tabs>

      <AdminConfirmActionDialog
        open={confirmAction != null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        footerClassName="gap-2"
        icon={
          confirmAction?.kind === "delete" ? (
            <Archive className="size-5 shrink-0 text-destructive" />
          ) : confirmAction?.kind === "restore" ? (
            <ArchiveRestore className="size-5 shrink-0 text-primary" />
          ) : confirmAction?.kind === "purge" ? (
            <Trash2 className="size-5 shrink-0 text-destructive" />
          ) : null
        }
        title={
          confirmAction?.kind === "delete"
            ? "Đưa bài viết vào thùng rác?"
            : confirmAction?.kind === "restore"
              ? "Khôi phục bài viết?"
              : confirmAction?.kind === "purge"
                ? "Xóa vĩnh viễn bài viết?"
                : ""
        }
        description={
          confirmAction?.kind === "delete"
            ? `«${confirmAction.row.title}» sẽ bị xóa tạm. Có thể khôi phục từ tab Thùng rác.`
            : confirmAction?.kind === "restore"
              ? `Khôi phục «${confirmAction.row.title}» về danh sách đang hoạt động.`
              : confirmAction?.kind === "purge"
                ? `«${confirmAction.row.title}» sẽ bị xóa khỏi cơ sở dữ liệu và không thể hoàn tác.`
                : null
        }
        confirmLabel={
          confirmAction?.kind === "delete"
            ? "Xóa tạm"
            : confirmAction?.kind === "restore"
              ? "Khôi phục"
              : confirmAction?.kind === "purge"
                ? "Xóa vĩnh viễn"
                : "Xác nhận"
        }
        confirmDestructive={
          confirmAction?.kind === "delete" || confirmAction?.kind === "purge"
        }
        confirmDisabled={
          deleteMutation.isPending || restoreMutation.isPending || purgeMutation.isPending
        }
        confirmLoading={
          confirmAction?.kind === "delete"
            ? deleteMutation.isPending
            : confirmAction?.kind === "restore"
              ? restoreMutation.isPending
              : confirmAction?.kind === "purge"
                ? purgeMutation.isPending
                : false
        }
        onConfirm={() => {
          void handleConfirmAction();
        }}
      />
    </PageSection>
  );
}

export default function PostsPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <PostsPageInner />
    </AdminPageGuard>
  );
}
