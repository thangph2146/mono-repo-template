"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Container } from "@ui/components/layout";
import { Heading, Text } from "@ui/components/typography";
import { STORE_CONTAINER_INSET_WIDE, STORE_CONTAINER_MAX_DEFAULT } from "@ui/lib/layout-shell";
import { cn } from "@ui/lib/utils";
import { HOME_ROUTES } from "../constants";

export interface FeaturedPostsSectionProps {
  featuredPosts?: Array<{ id: string; title: string; excerpt: string; href: string }>;
  className?: string;
}

const ViewAllButton = ({ mobile = false }: { mobile?: boolean }) => (
  <Link href={HOME_ROUTES.posts} prefetch={false}>
    <Button variant={mobile ? "outline" : "ghost"} size="default" className={cn(mobile && "w-full")}>
      <span className="inline-flex items-center gap-2">
        <Text>{mobile ? "Xem tất cả tin tức" : "Xem tất cả"}</Text>
        <ArrowRight className={cn(!mobile && "transition-transform group-hover:translate-x-1")} />
      </span>
    </Button>
  </Link>
);

export const FeaturedPostsSection = ({ featuredPosts = [], className }: FeaturedPostsSectionProps) => {
  const posts = featuredPosts.length
    ? featuredPosts
    : [
        { id: "1", title: "Thông báo lịch học kỳ mới", excerpt: "Các mốc thời gian quan trọng dành cho phụ huynh và sinh viên.", href: "/bai-viet" },
        { id: "2", title: "Hướng dẫn tra cứu kết quả học tập", excerpt: "Các bước xem kết quả học tập và thông báo học vụ mới nhất.", href: "/huong-dan-su-dung" },
        { id: "3", title: "Thông tin hỗ trợ phụ huynh", excerpt: "Kênh liên hệ và quy trình tiếp nhận hỗ trợ từ nhà trường.", href: "/lien-he" },
      ];

  return (
    <section className={cn("bg-background py-16 sm:py-20", className)}>
      <Container
        max={STORE_CONTAINER_MAX_DEFAULT}
        className={`${STORE_CONTAINER_INSET_WIDE} space-y-8`}
      >
        <div className="flex items-center justify-between gap-4 border-b pb-6">
          <div className="space-y-1">
            <Heading as="h2" size="section">
              Tin tức và sự kiện
            </Heading>
            <Text variant="muted">Cập nhật nhanh các thông tin mới từ nhà trường</Text>
          </div>
          <div className="hidden md:block">
            <ViewAllButton />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
            <Card key={post.id} className="rounded-lg border-border/70 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">{post.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Text variant="small" className="text-muted-foreground">
                  {post.excerpt}
                </Text>
                <Link href={post.href}>
                  <Button variant="outline" className="w-full rounded-lg">
                    Xem chi tiết
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="md:hidden">
          <ViewAllButton mobile />
        </div>
      </Container>
    </section>
  );
};
