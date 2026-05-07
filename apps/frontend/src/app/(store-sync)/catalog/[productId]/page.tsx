"use client";

import { notFound, useParams } from "next/navigation";
import products from "@/data/products.json";
import { Container, Page, PageContent } from "@/components/shared/layout";
import { ProductDetail } from "@/components/shared/product-detail";

export default function ProductDetailPage() {
  const params = useParams<{ productId: string }>();
  const product = products.find((item) => item.id === params.productId);

  if (!product) {
    notFound();
  }

  return (
    <Page>
      <PageContent className="px-0 md:px-0 py-8 md:py-10 space-y-0">
        <section>
          <Container max="8xl" className="px-4 md:px-8 space-y-6">
            <ProductDetail product={product} />
          </Container>
        </section>
      </PageContent>
    </Page>
  );
}
