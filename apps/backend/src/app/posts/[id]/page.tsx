"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LexicalEditor } from "@thangph2146/lexical-editor";
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
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Textarea } from "@ui/components/textarea";
import { TreeMultiSelectInline } from "@ui/components/typing";
import {
  Sparkles,
  Search,
  CalendarClock,
  Tags,
  ArrowLeft,
  Globe,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { PageSection } from "@ui/components/layout";
import { TypographyH1 } from "@ui/components/typography";
import { api } from "@/lib/api";
import {
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";
import {
  createParagraphNode,
  createSerializedEditorState,
  slugify,
  getSeoStatus,
  buildCategoryOptionTree,
  unwrapEnvelope,
  normalizeContentForEditor,
  toLocalInputValue,
} from "../_component";
import { useCategoriesQuery, useTagsQuery } from "../_component/_query";
import type { FormState, TaxonomyOption, PostDetail } from "../_component/types";

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  image: "",
  content: createSerializedEditorState([createParagraphNode()]),
  published: false,
  publishedAt: "",
  categoryIds: [],
  tagIds: [],
};

function EditPostPageInner() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const queryClient = useQueryClient();
  const [editorTab, setEditorTab] = useState<"content" | "seo" | "publish" | "taxonomy">("content");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);

  const categoriesQuery = useCategoriesQuery(api);
  const tagsQuery = useTagsQuery(api);

  const categoryTreeOptions = useMemo(
    () => buildCategoryOptionTree(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadPost() {
      try {
        setLoading(true);
        const detail = unwrapEnvelope<PostDetail>(
          await api.http.get(`/admin/posts/${postId}`),
        );
        if (!cancelled) {
          setForm({
            id: detail.id,
            title: detail.title,
            slug: detail.slug,
            excerpt: detail.excerpt ?? "",
            image: detail.image ?? "",
            content: normalizeContentForEditor(detail.content),
            published: detail.published,
            publishedAt: toLocalInputValue(detail.publishedAt ?? ""),
            categoryIds: detail.categories.map((item) => item.id),
            tagIds: detail.tags.map((item) => item.id),
          });
        }
      } catch {
        if (!cancelled) {
          toast.error("Không tải được bài viết");
          router.push("/posts");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadPost();
    return () => { cancelled = true; };
  }, [postId, router]);

  const updateMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) =>
      api.http.put(`/admin/posts/${postId}`, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["media", "posts"] });
      toast.success(`Đã cập nhật bài viết "${form.title.trim()}"`);
      router.push("/posts");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể cập nhật bài viết";
      toast.error(message);
    },
  });

  const submitting = updateMutation.isPending;
  const normalizedSlug = form.slug.trim() || slugify(form.title);
  const titleLength = form.title.trim().length;
  const excerptLength = form.excerpt.trim().length;
  const titleSeo = getSeoStatus(titleLength, 30, 65);
  const excerptSeo = getSeoStatus(excerptLength, 70, 160);
  const previewPath = normalizedSlug ? `/bai-viet/${normalizedSlug}` : "/bai-viet/ten-bai-viet";

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài viết");
      return;
    }
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      excerpt: form.excerpt.trim() || null,
      image: form.image.trim() || null,
      content: form.content,
      published: form.published,
      publishedAt: form.publishedAt || null,
      categoryIds: form.categoryIds,
      tagIds: form.tagIds,
    };
    await updateMutation.mutateAsync(payload);
  }, [form, updateMutation]);

  if (loading) {
    return (
      <PageSection max="full" className="min-w-0 flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </PageSection>
    );
  }

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 gap-2 rounded-lg"
            onClick={() => router.push("/posts")}
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
          <div>
            <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
              Chỉnh sửa bài viết
            </TypographyH1>
            <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
              {form.title || "Đang tải..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg"
            onClick={() => {
              if (postId) {
                setLoading(true);
                api.http.get(`/admin/posts/${postId}`).then((res) => {
                  const detail = unwrapEnvelope<PostDetail>(res);
                  setForm({
                    id: detail.id,
                    title: detail.title,
                    slug: detail.slug,
                    excerpt: detail.excerpt ?? "",
                    image: detail.image ?? "",
                    content: normalizeContentForEditor(detail.content),
                    published: detail.published,
                    publishedAt: toLocalInputValue(detail.publishedAt ?? ""),
                    categoryIds: detail.categories.map((item) => item.id),
                    tagIds: detail.tags.map((item) => item.id),
                  });
                  setEditorTab("content");
                  setLoading(false);
                }).catch(() => {
                  toast.error("Không tải lại được bài viết");
                  setLoading(false);
                });
              }
            }}
            disabled={submitting}
          >
            Đặt lại
          </Button>
          <Button
            type="button"
            className="h-10 rounded-lg font-bold"
            onClick={() => void handleSave()}
            disabled={submitting}
          >
            {submitting ? "Đang lưu..." : "Cập nhật"}
          </Button>
        </div>
      </div>

      <Tabs value={editorTab} onValueChange={(v) => setEditorTab(v as typeof editorTab)}>
        <TabsList className="h-auto min-h-10 flex-wrap gap-1 rounded-lg bg-muted/70 p-1">
          <TabsTrigger
            value="content"
            className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Nội dung
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
            Xuất bản
          </TabsTrigger>
          <TabsTrigger
            value="taxonomy"
            className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Phân loại
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="content" className="mt-0 space-y-4">
            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="size-5 text-primary" />
                  Biên tập nội dung
                </CardTitle>
                <CardDescription>
                  Tập trung vào phần thân bài và bố cục nội dung.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-w-6xl mx-auto">
                  <LexicalEditor
                    value={form.content}
                    placeholder="Nhập nội dung bài viết..."
                    onChange={(value) => setForm({ ...form, content: value })}
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
                          setForm({
                            ...form,
                            title,
                            slug: form.id ? form.slug : slugify(title),
                          });
                        }}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>Tiêu đề nên rõ chủ đề chính, dễ đọc và thu hút trên kết quả tìm kiếm.</span>
                        <Badge variant={titleSeo.tone as "default" | "destructive" | "outline" | "secondary"}>{titleLength} ký tự</Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="post-excerpt">Mô tả ngắn gọn</Label>
                      <Textarea
                        id="post-excerpt"
                        value={form.excerpt}
                        placeholder="Đoạn mô tả ngắn để hiển thị danh sách..."
                        onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>Phần này thường được dùng làm mô tả tóm tắt và preview SEO.</span>
                        <Badge variant={excerptSeo.tone as "default" | "destructive" | "outline" | "secondary"}>{excerptLength} ký tự</Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="post-slug">Slug / đường dẫn</Label>
                      <Input
                        id="post-slug"
                        value={form.slug}
                        placeholder="thong-bao-tuyen-sinh-2026"
                        onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
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
                          <Badge variant={titleSeo.tone as "default" | "destructive" | "outline" | "secondary"}>{titleLength} ký tự</Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{titleSeo.hint}</p>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-background p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">Mô tả SEO</p>
                          <Badge variant={excerptSeo.tone as "default" | "destructive" | "outline" | "secondary"}>{excerptLength} ký tự</Badge>
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
                      Ảnh đại diện ảnh hưởng trực tiếp tới preview chia sẻ và cảm nhận trực quan.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="post-image">URL ảnh đại diện</Label>
                      <Input
                        id="post-image"
                        value={form.image}
                        placeholder="https://..."
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
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
                            alt={form.title.trim() || "Ảnh đại diện bài viết"}
                            className="max-h-64 w-full rounded-lg border border-border/60 object-contain bg-background"
                          />
                        </div>
                      </div>
                    ) : null}
                    <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
                      {form.image.trim()
                        ? "Đã có URL ảnh đại diện. Kiểm tra lại tỉ lệ và nội dung ảnh trước khi xuất bản."
                        : "Chưa có ảnh đại diện. Nên bổ sung ảnh ngang rõ nội dung để preview bài viết tốt hơn."}
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
                    onCheckedChange={(checked) => setForm({ ...form, published: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="post-published-at">Thời điểm xuất bản</Label>
                  <Input
                    id="post-published-at"
                    type="datetime-local"
                    value={form.publishedAt}
                    onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
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
                    <TreeMultiSelectInline
                      value={form.categoryIds}
                      onChange={(v) => setForm({ ...form, categoryIds: (v as string[]) ?? [] })}
                      options={categoryTreeOptions.map((c) => ({
                        value: c.id,
                        label: c.name,
                        children: c.subRows?.map((s) => ({
                          value: s.id,
                          label: s.name,
                          children: s.subRows?.map((ss) => ({ value: ss.id, label: ss.name })),
                        })),
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Thẻ</Label>
                    <Badge variant="outline">{form.tagIds.length} thẻ</Badge>
                  </div>
                  <div className="grid gap-2 rounded-lg border border-outline-variant p-3 sm:grid-cols-2">
                    {(tagsQuery.data ?? []).map((item: TaxonomyOption) => (
                      <label key={item.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={form.tagIds.includes(item.id)}
                          onCheckedChange={(checked) =>
                            setForm({
                              ...form,
                              tagIds: checked
                                ? [...form.tagIds, item.id]
                                : form.tagIds.filter((id) => id !== item.id),
                            })
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
    </PageSection>
  );
}

export default function EditPostPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <EditPostPageInner />
    </AdminPageGuard>
  );
}
