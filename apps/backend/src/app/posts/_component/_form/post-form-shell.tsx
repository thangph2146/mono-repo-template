"use client";

import { useState, type ReactNode } from "react";
import { LexicalEditor } from "@thangph2146/lexical-editor";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { FieldError } from "@ui/components/field";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Textarea } from "@ui/components/textarea";
import { FormFieldCol, TreeMultiSelectInline } from "@ui/components/typing";
import { DatePicker } from "@ui/components/pickers";
import { TypographyH1 } from "@ui/components/typography";
import { cn } from "@ui/lib/utils";
import { ADMIN_PAGE_SUBTITLE_CLASS, ADMIN_PAGE_TITLE_PRIMARY_CLASS } from "@ui/lib/layout-shell";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Sparkles, Search, CalendarClock, Tags, ArrowLeft, Globe, ImageIcon } from "lucide-react";
import { getSeoStatus, slugify as defaultSlugify } from "../utils";
import type { PostFormValues } from "../_hooks";
import type { CategoryTreeOption, TaxonomyOption } from "../types";

export interface PostFormShellProps {
  form: UseFormReturn<PostFormValues>;
  onSubmit: (values: PostFormValues) => Promise<void>;
  submitting: boolean;
  editingId: string | null;
  categoryTreeOptions: CategoryTreeOption[];
  tagsOptions: TaxonomyOption[];
  onBack: () => void;
  onReset: () => void;
}

export function PostFormShell({
  form,
  onSubmit,
  submitting,
  editingId,
  categoryTreeOptions,
  tagsOptions,
  onBack,
  onReset,
}: PostFormShellProps) {
  const [editorTab, setEditorTab] = useState<"content" | "seo" | "publish" | "taxonomy">("content");
  const { control, watch } = form;

  const watchedTitle = watch("title");
  const watchedSlug = watch("slug");
  const watchedExcerpt = watch("excerpt");
  const watchedImage = watch("image");

  const titleLength = watchedTitle.trim().length;
  const excerptLength = watchedExcerpt.trim().length;
  const normalizedSlug = watchedSlug.trim() || defaultSlugify(watchedTitle);
  const previewPath = normalizedSlug ? `/bai-viet/${normalizedSlug}` : "/bai-viet/ten-bai-viet";
  const titleSeo = getSeoStatus(titleLength, 30, 65);
  const excerptSeo = getSeoStatus(excerptLength, 70, 160);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 gap-2 rounded-lg"
            onClick={onBack}
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
          <div>
            <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
              {editingId ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
            </TypographyH1>
            <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
              {editingId
                ? watchedTitle || "Đang tải..."
                : "Soạn nội dung, kiểm tra SEO và cấu hình xuất bản"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg"
            onClick={onReset}
            disabled={submitting}
          >
            Đặt lại
          </Button>
          <Button
            type="submit"
            form="post-form"
            className="h-10 rounded-lg font-bold"
            disabled={submitting}
          >
            {submitting ? "Đang lưu..." : editingId ? "Cập nhật" : "Xuất bản"}
          </Button>
        </div>
      </div>

      <form id="post-form" onSubmit={form.handleSubmit(onSubmit)}>
        <Tabs value={editorTab} onValueChange={(v) => setEditorTab(v as typeof editorTab)} className="mt-6">
          <TabsList className="h-auto min-h-10 flex-wrap gap-1 rounded-lg bg-muted/70 p-1">
            <TabTrigger value="content">Nội dung</TabTrigger>
            <TabTrigger value="seo">SEO</TabTrigger>
            <TabTrigger value="publish">Xuất bản</TabTrigger>
            <TabTrigger value="taxonomy">Phân loại</TabTrigger>
          </TabsList>

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
                  <Controller
                    name="content"
                    control={control}
                    render={({ field }) => (
                      <LexicalEditor
                        value={field.value}
                        placeholder="Nhập nội dung bài viết..."
                        onChange={(value) => field.onChange(value)}
                        uploadsContext={undefined}
                      />
                    )}
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
                    <Controller
                      name="title"
                      control={control}
                      render={({ field, fieldState }) => (
                        <FormFieldCol label="Tiêu đề bài viết" required>
                          <Input
                            placeholder="VD: Thông báo tuyển sinh 2026"
                            {...field}
                            onChange={(e) => {
                              const { value } = e.target;
                              field.onChange(value);
                              if (!editingId) form.setValue("slug", defaultSlugify(value));
                            }}
                            className={cn(fieldState.error && "border-destructive")}
                          />
                          {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                            <span>Tiêu đề nên rõ chủ đề chính, dễ đọc và thu hút trên kết quả tìm kiếm.</span>
                            <Badge variant={titleSeo.tone} className="mt-1">{titleLength} ký tự</Badge>
                          </div>
                        </FormFieldCol>
                      )}
                    />

                    <Controller
                      name="excerpt"
                      control={control}
                      render={({ field }) => (
                        <FormFieldCol label="Mô tả ngắn gọn">
                          <Textarea
                            placeholder="Đoạn mô tả ngắn để hiển thị danh sách..."
                            {...field}
                          />
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                            <span>Phần này thường được dùng làm mô tả tóm tắt và preview SEO.</span>
                            <Badge variant={excerptSeo.tone} className="mt-1">{excerptLength} ký tự</Badge>
                          </div>
                        </FormFieldCol>
                      )}
                    />

                    <Controller
                      name="slug"
                      control={control}
                      render={({ field }) => (
                        <FormFieldCol label="Slug / đường dẫn">
                          <Input
                            placeholder="thong-bao-tuyen-sinh-2026"
                            {...field}
                            onChange={(e) => field.onChange(defaultSlugify(e.target.value))}
                          />
                          <p className="text-xs text-muted-foreground">
                            Slug nên ngắn, dễ đọc và bám đúng từ khóa chính của bài viết.
                          </p>
                        </FormFieldCol>
                      )}
                    />
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
                      Ảnh đại diện ảnh hưởng trực tiếp tới preview chia sẻ và cảm nhận trực quan.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Controller
                      name="image"
                      control={control}
                      render={({ field }) => (
                        <FormFieldCol label="URL ảnh đại diện">
                          <Input placeholder="https://..." {...field} />
                        </FormFieldCol>
                      )}
                    />
                    {watchedImage.trim() ? (
                      <div className="overflow-hidden rounded-lg border border-border/70 bg-background">
                        <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
                          <p className="text-sm font-semibold text-foreground">Xem trước hình ảnh</p>
                          <span className="text-xs text-muted-foreground">Preview từ URL hiện tại</span>
                        </div>
                        <div className="bg-muted/20 p-3">
                          <img
                            src={watchedImage.trim()}
                            alt={watchedTitle.trim() || "Ảnh đại diện bài viết"}
                            className="max-h-100 w-full rounded-lg border border-border/60 object-contain bg-background"
                          />
                        </div>
                      </div>
                    ) : null}
                    <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
                      {watchedImage.trim()
                        ? "Đã có URL ảnh đại diện. Kiểm tra lại tỉ lệ và nội dung ảnh trước khi xuất bản."
                        : "Chưa có ảnh đại diện. Nên bổ sung ảnh ngang rõ nội dung để preview bài viết tốt hơn."}
                    </div>
                  </CardContent>
                </Card>

                <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
                  <p className="text-sm font-semibold text-foreground">Preview kết quả tìm kiếm</p>
                  <p className="mt-2 line-clamp-2 text-sm font-medium text-primary">
                    {watchedTitle.trim() || "Tiêu đề bài viết sẽ hiển thị tại đây"}
                  </p>
                  <p className="mt-1 break-all text-xs text-emerald-700 dark:text-emerald-400">
                    hub.local{previewPath}
                  </p>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
                    {watchedExcerpt.trim() ||
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
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    name="published"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-lg border border-outline-variant px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold">Trạng thái hiển thị</p>
                          <p className="text-xs text-muted-foreground">
                            {field.value
                              ? "Bài viết đang ở chế độ xuất bản."
                              : "Bài viết đang là bản nháp, chưa hiển thị công khai."}
                          </p>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked)}
                        />
                      </div>
                    )}
                  />

                  <Controller
                    name="publishedAt"
                    control={control}
                    render={({ field }) => (
                      <FormFieldCol label="Ngày xuất bản">
                        <DatePicker
                          value={field.value}
                          onChange={(v) => field.onChange(v ?? "")}
                          placeholder="Chọn ngày"
                        />
                      </FormFieldCol>
                    )}
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
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    name="categoryIds"
                    control={control}
                    render={({ field }) => (
                      <FormFieldCol label={<div className="flex items-center justify-between gap-2">
                        <Label>Danh mục dùng chung</Label>
                        <Badge variant="outline">{field.value.length} mục</Badge>
                      </div>}>
                        <div className="rounded-lg border border-outline-variant p-3">
                          <p className="mb-3 text-xs text-muted-foreground">
                            Danh mục được hiển thị theo tree cha-con để dễ nhìn đúng cấu trúc nội dung.
                          </p>
                          <TreeMultiSelectInline
                            value={field.value}
                            onChange={(v) => field.onChange((v as string[]) ?? [])}
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
                      </FormFieldCol>
                    )}
                  />

                  <Controller
                    name="tagIds"
                    control={control}
                    render={({ field }) => (
                      <FormFieldCol label={<div className="flex items-center justify-between gap-2">
                        <Label>Thẻ</Label>
                        <Badge variant="outline">{field.value.length} thẻ</Badge>
                      </div>}>
                        <div className="rounded-lg border border-outline-variant p-3">
                          <TreeMultiSelectInline
                            value={field.value}
                            onChange={(v) => field.onChange((v as string[]) ?? [])}
                            options={(tagsOptions ?? []).map((t) => ({
                              value: t.id,
                              label: t.name,
                            }))}
                          />
                        </div>
                      </FormFieldCol>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </>
  );
}

function TabTrigger({ value, children }: { value: string; children: ReactNode }) {
  return (
    <TabsTrigger
      value={value}
      className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
    >
      {children}
    </TabsTrigger>
  );
}
