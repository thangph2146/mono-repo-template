import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@ui/components/badge";
import { Container, Page, PageContent } from "@ui/components/layout";
import { Heading } from "@ui/components/typography";
import {
  STORE_CONTAINER_INSET,
  STORE_CONTAINER_MAX_DEFAULT,
  STORE_PAGE_CONTENT_CLASS,
} from "@ui/lib/layout-shell";
import { logDevRouteHit } from "@/lib/dev-route-log";
import { formatPostDate, getPublicPostBySlug } from "@/lib/public-posts";
import { PostContentRenderer } from "@/components/shared/post-content-renderer";
import { PublicPostViewBadge } from "@/components/shared/public-post-view-badge";

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
            <PublicPostViewBadge slug={post.slug} initialCount={post.viewCount} />
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
