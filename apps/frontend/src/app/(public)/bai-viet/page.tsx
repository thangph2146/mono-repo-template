import type { Metadata } from "next";
import { CalendarDays, Eye } from "lucide-react";
import Link from "next/link";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@ui/components/empty";
import { Container, Page, PageContent } from "@ui/components/layout";
import { Heading, Text } from "@ui/components/typography";
import {
  STORE_CONTAINER_INSET,
  STORE_CONTAINER_MAX_DEFAULT,
  STORE_PAGE_CONTENT_CLASS,
} from "@ui/lib/layout-shell";
import { logDevRouteHit } from "@/lib/dev-route-log";
import { formatPostDate, getPublicPosts } from "@/lib/public-posts";

export const metadata: Metadata = {
  title: "Bài viết",
  description: "Tin tức và thông báo mới nhất từ HUB.",
};

export default async function PostsPage() {
  await logDevRouteHit({
    pathname: "/bai-viet",
    label: "PostsPage",
  });

  const postResponse = await getPublicPosts({
    page: 1,
    limit: 12,
  });
  const posts = postResponse.data;

  return (
    <Page>
      <PageContent className={STORE_PAGE_CONTENT_CLASS}>
        <Container
          max={STORE_CONTAINER_MAX_DEFAULT}
          className={`${STORE_CONTAINER_INSET} space-y-6`}
        >
          <Heading as="h1" size="section">
            Bai viet
          </Heading>
          <Text variant="muted">
            Tin tuc va thong bao moi nhat tu Truong Dai hoc Ngan hang TP.HCM.
          </Text>
          {posts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => {
                const primaryCategory = post.categories[0]?.category;
                const publishedDate = formatPostDate(post.publishedAt);

                return (
                  <Card key={post.id} className="rounded-lg">
                    <CardHeader className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {primaryCategory ? (
                          <Badge variant="secondary">{primaryCategory.name}</Badge>
                        ) : null}
                        {publishedDate ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarDays className="size-3.5" />
                            {publishedDate}
                          </span>
                        ) : null}
                      </div>
                      <CardTitle className="line-clamp-2 text-lg">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Text variant="small" className="line-clamp-3 text-muted-foreground">
                        {post.excerpt?.trim() || "Noi dung bai viet dang duoc cap nhat."}
                      </Text>
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="size-3.5" />
                          {post.viewCount} luot xem
                        </span>
                        <Link href={`/bai-viet/${post.slug}`} prefetch={false}>
                          <Button variant="outline" className="rounded-lg">
                            Xem chi tiet
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Empty className="rounded-lg border border-dashed">
              <EmptyHeader>
                <EmptyTitle>Chua co bai viet</EmptyTitle>
                <EmptyDescription>
                  API da duoc ket noi nhung hien chua co bai viet cong khai de hien thi.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Link href="/" prefetch={false}>
                  <Button variant="outline" className="rounded-lg">
                    Quay ve trang chu
                  </Button>
                </Link>
              </EmptyContent>
            </Empty>
          )}
        </Container>
      </PageContent>
    </Page>
  );
}
