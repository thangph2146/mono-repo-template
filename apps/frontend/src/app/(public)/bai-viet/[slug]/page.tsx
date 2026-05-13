import type { Metadata } from "next";
import { CalendarDays, Eye } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { Container, Page, PageContent } from "@ui/components/layout";
import { Heading, Text } from "@ui/components/typography";
import {
  STORE_CONTAINER_INSET,
  STORE_CONTAINER_MAX_DEFAULT,
  STORE_PAGE_CONTENT_CLASS,
} from "@ui/lib/layout-shell";
import { logDevRouteHit } from "@/lib/dev-route-log";
import { formatPostDate, getPublicPostBySlug } from "@/lib/public-posts";
import { PostContentRenderer } from "@/components/shared/post-content-renderer";

export const metadata: Metadata = {
  title: "Chi tiết bài viết",
};

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PostDetailPage({ params }: Props) {
  const { slug } = await params;
  await logDevRouteHit({
    pathname: `/bai-viet/${slug}`,
    label: "PostDetailPage",
  });
  const post = await getPublicPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const publishedDate = formatPostDate(post.publishedAt);
  const primaryCategory = post.categories[0]?.category;

  return (
    <Page>
      <PageContent className={STORE_PAGE_CONTENT_CLASS}>
        <Container
          max={STORE_CONTAINER_MAX_DEFAULT}
          className={`${STORE_CONTAINER_INSET} space-y-4`}
        >
          <div className="flex flex-wrap items-center gap-2">
            {primaryCategory ? <Badge variant="secondary">{primaryCategory.name}</Badge> : null}
            {publishedDate ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                {publishedDate}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="size-3.5" />
              {post.viewCount} luot xem
            </span>
          </div>
          <Heading as="h1" size="section">
            {post.title}
          </Heading>
          <PostContentRenderer content={post.content} />
        </Container>
      </PageContent>
    </Page>
  );
}
