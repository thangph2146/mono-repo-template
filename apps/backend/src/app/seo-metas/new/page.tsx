"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageSection } from "@ui/components/layout";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { ArrowLeft, Search } from "lucide-react";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import { TypographyH1 } from "@ui/components/typography";
import { ADMIN_PAGE_SUBTITLE_CLASS, ADMIN_PAGE_TITLE_PRIMARY_CLASS } from "@ui/lib/layout-shell";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { seoMetaFormSchema, type SeoMetaFormValues } from "../_component";

function NewSeoMetaPageInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SeoMetaFormValues>({
    resolver: zodResolver(seoMetaFormSchema),
    defaultValues: {
      page: "",
      title: "",
      description: "",
      keywords: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      status: 1,
    },
  });

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["seo-metas"] });
  };

  const createMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) =>
      api.seoMetas.create(input),
    onSuccess: async () => {
      await invalidateAll();
      toast.success("Đã tạo SEO metadata");
      router.push("/seo-metas");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể tạo SEO metadata";
      toast.error(message);
    },
  });

  const onSubmit = useCallback(
    async (values: SeoMetaFormValues) => {
      await createMutation.mutateAsync(values as unknown as Record<string, unknown>);
    },
    [createMutation],
  );

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" className="h-10 gap-2 rounded-lg" onClick={() => router.push("/seo-metas")}>
          <ArrowLeft className="size-4" />
          Quay lại
        </Button>
        <div>
          <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            <Search className="inline size-6 mr-2" />
            Thêm SEO metadata
          </TypographyH1>
          <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
            Tạo SEO metadata mới cho một trang.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin SEO</CardTitle>
            <CardDescription>Nhập thông tin SEO cho trang.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="page">Đường dẫn *</Label>
              <Input id="page" placeholder="/vi du" {...register("page")} />
              {errors.page && <p className="text-sm text-destructive">{errors.page.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title SEO</Label>
              <Input id="title" placeholder="Title hiển thị trên SEO" {...register("title")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Input id="description" placeholder="Mô tả meta" {...register("description")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">Từ khóa</Label>
              <Input id="keywords" placeholder="Từ khóa, cách nhau bằng dấu phẩy" {...register("keywords")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open Graph</CardTitle>
            <CardDescription>Tùy chỉnh hiển thị khi chia sẻ lên mạng xã hội.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ogTitle">OG Title</Label>
              <Input id="ogTitle" placeholder="Open Graph title" {...register("ogTitle")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ogDescription">OG Mô tả</Label>
              <Input id="ogDescription" placeholder="Open Graph description" {...register("ogDescription")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ogImage">OG Ảnh (URL)</Label>
              <Input id="ogImage" placeholder="https://..." {...register("ogImage")} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang tạo..." : "Tạo SEO metadata"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/seo-metas")}>
            Hủy
          </Button>
        </div>
      </form>
    </PageSection>
  );
}

export default function NewSeoMetaPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <NewSeoMetaPageInner />
    </AdminPageGuard>
  );
}
