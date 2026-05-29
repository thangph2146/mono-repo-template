"use client";

import { useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Search } from "lucide-react";
import { PageSection } from "@ui/components/layout";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import { TypographyH1 } from "@ui/components/typography";
import { ADMIN_PAGE_SUBTITLE_CLASS, ADMIN_PAGE_TITLE_PRIMARY_CLASS } from "@ui/lib/layout-shell";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { seoMetaFormSchema, useSeoMetaDetailQuery } from "../../_component";
import type { SeoMetaFormValues } from "../../_component";

function EditSeoMetaPageInner() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SeoMetaFormValues>({
    resolver: zodResolver(seoMetaFormSchema),
  });

  const { data: detail, isLoading, isError } = useSeoMetaDetailQuery(api, id);

  useEffect(() => {
    if (isError) {
      toast.error("Không tải được SEO metadata");
      router.push("/seo-metas");
    }
  }, [isError, router]);

  useEffect(() => {
    if (!detail) return;
    reset({
      page: detail.page ?? "",
      title: detail.title ?? "",
      description: detail.description ?? "",
      keywords: detail.keywords ?? "",
      ogTitle: detail.ogTitle ?? "",
      ogDescription: detail.ogDescription ?? "",
      ogImage: detail.ogImage ?? "",
      status: detail.status,
    });
  }, [detail, reset]);

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["seo-metas"] });
  };

  const updateMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) =>
      api.seoMetas.update(id, input),
    onSuccess: async () => {
      await invalidateAll();
      toast.success("Đã cập nhật SEO metadata");
      router.push(`/seo-metas/${id}`);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể cập nhật";
      toast.error(message);
    },
  });

  const onSubmit = useCallback(
    async (values: SeoMetaFormValues) => {
      await updateMutation.mutateAsync(values as unknown as Record<string, unknown>);
    },
    [updateMutation],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" className="h-10 gap-2 rounded-lg" onClick={() => router.push(`/seo-metas/${id}`)}>
          <ArrowLeft className="size-4" />
          Quay lại
        </Button>
        <div>
          <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            <Search className="inline size-6 mr-2" />
            Chỉnh sửa SEO: {detail?.page ?? ""}
          </TypographyH1>
          <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
            Cập nhật thông tin SEO metadata.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin SEO</CardTitle>
            <CardDescription>Cập nhật thông tin SEO cho trang.</CardDescription>
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
            {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(`/seo-metas/${id}`)}>
            Hủy
          </Button>
        </div>
      </form>
    </PageSection>
  );
}

export default function EditSeoMetaPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <EditSeoMetaPageInner />
    </AdminPageGuard>
  );
}
