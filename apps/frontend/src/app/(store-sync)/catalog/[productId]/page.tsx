"use client";

import { notFound, useParams } from "next/navigation";
import { Container, Page, PageContent } from "@ui/components/layout";
import {
  STORE_CONTAINER_INSET,
  STORE_CONTAINER_MAX_DEFAULT,
  STORE_PAGE_CONTENT_CLASS,
} from "@ui/lib/layout-shell";
import { ProductDetail } from "@/components/shared/product-detail";
import { useProduct, useProductBySku } from "@/hooks/queries";

export default function ProductDetailPage() {
  const params = useParams<{ productId: string }>();
  const numericId = Number(params.productId);
  const isNumeric = Number.isFinite(numericId) && numericId > 0;

  const byId = useProduct(isNumeric ? numericId : null);
  const bySku = useProductBySku(!isNumeric ? params.productId : null);

  const data = isNumeric ? byId.data : bySku.data;
  const isLoading = isNumeric ? byId.isLoading : bySku.isLoading;
  const error = isNumeric ? byId.error : bySku.error;

  if (!isLoading && !data && !error) {
    notFound();
  }

  return (
    <Page>
      <PageContent className={STORE_PAGE_CONTENT_CLASS}>
        <section>
          <Container max={STORE_CONTAINER_MAX_DEFAULT} className={`${STORE_CONTAINER_INSET} space-y-6`}>
            {isLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="aspect-square rounded-3xl bg-muted/40 animate-pulse" />
                <div className="space-y-4">
                  <div className="h-10 rounded-xl bg-muted/40 animate-pulse" />
                  <div className="h-32 rounded-xl bg-muted/40 animate-pulse" />
                  <div className="h-14 rounded-xl bg-muted/40 animate-pulse" />
                </div>
              </div>
            )}
            {error && (
              <div className="text-center py-12 bg-destructive/5 border border-destructive/20 rounded-2xl">
                <p className="text-lg font-bold text-destructive">Không tải được sản phẩm</p>
                <p className="text-sm text-on-surface-variant mt-1">{error.message}</p>
              </div>
            )}
            {data && <ProductDetail product={data} />}
          </Container>
        </section>
      </PageContent>
    </Page>
  );
}
