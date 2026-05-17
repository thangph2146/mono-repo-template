"use client";

import { LexicalEditor } from "@thangph2146/lexical-editor";
import type { SerializedEditorState } from "lexical";
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
import { Switch } from "@ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Textarea } from "@ui/components/textarea";
import { TreeMultiSelectInline } from "@ui/components/typing";
import {
  Sparkles,
  Search,
  CalendarClock,
  Tags,
  Plus,
  Globe,
  ImageIcon,
} from "lucide-react";
import type { FormState, CategoryTreeOption, TaxonomyOption } from "../types";

export interface PostsFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: FormState;
  onFormChange: (form: FormState) => void;
  editorTab: "content" | "seo" | "publish" | "taxonomy";
  onEditorTabChange: (tab: "content" | "seo" | "publish" | "taxonomy") => void;
  onSubmit: () => void;
  submitting: boolean;
  categoryTreeOptions: CategoryTreeOption[];
  tagsOptions: TaxonomyOption[];
  slugify: (value: string) => string;
  previewPath: string;
  titleSeo: { label: string; tone: string; hint: string };
  excerptSeo: { label: string; tone: string; hint: string };
  titleLength: number;
  excerptLength: number;
  contentClassName?: string;
}

export function PostsFormDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  editorTab,
  onEditorTabChange,
  onSubmit,
  submitting,
  categoryTreeOptions,
  tagsOptions,
  slugify,
  previewPath,
  titleSeo,
  excerptSeo,
  titleLength,
  excerptLength,
  contentClassName,
}: PostsFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button
            onClick={() => onFormChange({ title: "", slug: "", excerpt: "", image: "", content: {} as SerializedEditorState, published: false, publishedAt: "", categoryIds: [], tagIds: [] })}
            className="flex h-12 items-center gap-2 rounded-lg px-6 font-bold shadow-md"
          />
        }
      >
        <Plus className="size-5" />
        Thêm bài viết
      </DialogTrigger>
      <DialogContent className={`${contentClassName} max-h-[90vh] overflow-hidden p-0`}>
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <DialogTitle className="text-2xl font-extrabold">
            {form.id ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
          </DialogTitle>
          <DialogDescription>
            Soạn nội dung, kiểm tra hiển thị SEO cơ bản và hoàn thiện cấu hình xuất bản trong
            một màn hình rõ ràng hơn.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={editorTab} onValueChange={onEditorTabChange} className="min-h-0 flex-1">
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
                        onFormChange({ ...form, content: value })
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
                            onFormChange({
                              ...form,
                              title,
                              slug: form.id ? form.slug : slugify(title),
                            });
                          }}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>Tieu de nen ro chu de chinh, de doc va thu hut tren ket qua tim kiem.</span>
                          <Badge variant={titleSeo.tone as "default" | "destructive" | "outline" | "secondary"}>{titleLength} ký tự</Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="post-excerpt">Mô tả ngắn gọn</Label>
                        <Textarea
                          id="post-excerpt"
                          value={form.excerpt}
                          placeholder="Đoạn mô tả ngắn để hiển thị danh sách..."
                          onChange={(e) =>
                            onFormChange({ ...form, excerpt: e.target.value })
                          }
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
                          onChange={(e) =>
                            onFormChange({
                              ...form,
                              slug: slugify(e.target.value),
                            })
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
                            onFormChange({ ...form, image: e.target.value })
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
                        onFormChange({ ...form, published: checked })
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
                        onFormChange({ ...form, publishedAt: e.target.value })
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
                      <TreeMultiSelectInline
                        value={form.categoryIds}
                        onChange={(v) =>
                          onFormChange({
                            ...form,
                            categoryIds: (v as string[]) ?? [],
                          })
                        }
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
                      {tagsOptions.map((item) => (
                        <label key={item.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={form.tagIds.includes(item.id)}
                            onCheckedChange={(checked) =>
                              onFormChange({
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

        <DialogFooter className="flex justify-between items-center border-t border-border/70 bg-muted/20 p-8 pt-4">
          <Button
            type="button"
            variant="outline"
            className="mr-auto rounded-lg"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            type="button"
            className="rounded-lg font-bold"
            onClick={() => void onSubmit()}
            disabled={submitting}
          >
            {submitting ? "Đang lưu..." : "Lưu bài viết"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
