import type { Metadata } from "next"
import { CalendarDays, Eye, Filter, ImageIcon, Search } from "lucide-react"
import Link from "next/link"
import { Badge } from "@ui/components/badge"
import { Button } from "@ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@ui/components/empty"
import { Container, Page, PageContent } from "@ui/components/layout"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@ui/components/pagination"
import { Text } from "@ui/components/typography"
import {
  STORE_CONTAINER_INSET,
  STORE_CONTAINER_MAX_DEFAULT,
  STORE_PAGE_CONTENT_CLASS,
} from "@ui/lib/layout-shell"
import { logDevRouteHit } from "@/lib/dev-route-log"
import {
  formatPostDate,
  getPublicCategories,
  getPublicPosts,
} from "@/lib/public-posts"
import { buildSeoMetadata } from "@/lib/seo"

export const metadata: Metadata = buildSeoMetadata({
  title: "Bài viết",
  description: "Tin tức và thông báo mới nhất từ HUB.",
})

type SearchParams = Record<string, string | string[] | undefined>

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ""
  return value ?? ""
}

function toPositiveInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return parsed
}

function buildPaginationItems(
  currentPage: number,
  totalPages: number
): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set<number>([
    1,
    2,
    totalPages - 1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ])
  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
  const output: Array<number | "ellipsis"> = []

  for (let index = 0; index < sorted.length; index += 1) {
    const value = sorted[index]
    const previous = sorted[index - 1]
    if (previous && value - previous > 1) output.push("ellipsis")
    output.push(value)
  }

  return output
}

function buildPostsHref(
  current: {
    search?: string
    categorySlug?: string
    tagSlug?: string
    page: number
    limit: number
  },
  next: Partial<{
    search: string
    categorySlug: string
    tagSlug: string
    page: number
    limit: number
  }>
): string {
  const merged = { ...current, ...next }
  const params = new URLSearchParams()

  if (merged.search?.trim()) params.set("search", merged.search.trim())
  if (merged.categorySlug?.trim())
    params.set("categorySlug", merged.categorySlug.trim())
  if (merged.tagSlug?.trim()) params.set("tagSlug", merged.tagSlug.trim())
  if (merged.limit > 0) params.set("limit", String(merged.limit))
  if (merged.page > 1) params.set("page", String(merged.page))

  const query = params.toString()
  return query ? `/bai-viet?${query}` : "/bai-viet"
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const query = (await searchParams) ?? {}
  const search = firstValue(query.search).trim()
  const categorySlug = firstValue(query.categorySlug).trim()
  const tagSlug = firstValue(query.tagSlug).trim()
  const page = toPositiveInt(firstValue(query.page), 1)
  const limit = Math.min(
    24,
    Math.max(6, toPositiveInt(firstValue(query.limit), 12))
  )

  await logDevRouteHit({
    pathname: buildPostsHref(
      { search, categorySlug, tagSlug, page, limit },
      {}
    ),
    label: "PostsPage",
  })

  const [postResponse, categories] = await Promise.all([
    getPublicPosts({
      page,
      limit,
      categorySlug: categorySlug || undefined,
      tagSlug: tagSlug || undefined,
      search: search || undefined,
    }),
    getPublicCategories(),
  ])

  const posts = postResponse.data
  const meta = postResponse.meta
  const popularCategories = categories
    .filter((item) => item.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 12)

  const popularTags = Array.from(
    posts
      .flatMap((post) => post.tags.map((entry) => entry.tag))
      .reduce((acc, tag) => {
        if (!acc.has(tag.slug)) acc.set(tag.slug, tag)
        return acc
      }, new Map<string, { name: string; slug: string }>())
      .values()
  ).slice(0, 16)

  const pagerItems = buildPaginationItems(meta.page, meta.totalPages)

  const baseQuery = { search, categorySlug, tagSlug, page, limit }

  return (
    <Page>
      <PageContent className={STORE_PAGE_CONTENT_CLASS}>
        <Container
          max={STORE_CONTAINER_MAX_DEFAULT}
          className={`${STORE_CONTAINER_INSET} space-y-6`}
        >
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
              <Card className="rounded-lg">
                <CardHeader className="space-y-2 pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Filter className="size-4" />
                    Bộ lọc bài viết
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form action="/bai-viet" className="space-y-3">
                    <label className="text-sm font-medium">
                      Tìm theo tên bài viết
                    </label>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3">
                      <Search className="size-4 text-muted-foreground" />
                      <input
                        name="search"
                        defaultValue={search}
                        placeholder="Nhập từ khóa..."
                        className="h-10 w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                    {categorySlug ? (
                      <input
                        type="hidden"
                        name="categorySlug"
                        value={categorySlug}
                      />
                    ) : null}
                    {tagSlug ? (
                      <input type="hidden" name="tagSlug" value={tagSlug} />
                    ) : null}
                    <input type="hidden" name="limit" value={String(limit)} />
                    <Button type="submit" className="w-full rounded-lg">
                      Áp dụng tìm kiếm
                    </Button>
                  </form>

                  <div className="space-y-2">
                    <Text variant="small" className="font-medium">
                      Danh mục
                    </Text>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={buildPostsHref(baseQuery, {
                          categorySlug: "",
                          page: 1,
                        })}
                        prefetch={false}
                      >
                        <Badge variant={categorySlug ? "outline" : "default"}>
                          Tất cả
                        </Badge>
                      </Link>
                      {popularCategories.map((category) => (
                        <Link
                          key={category.id}
                          href={buildPostsHref(baseQuery, {
                            categorySlug: category.slug,
                            page: 1,
                          })}
                          prefetch={false}
                          className="max-w-full"
                        >
                          <Badge
                            variant={
                              categorySlug === category.slug
                                ? "default"
                                : "outline"
                            }
                            className="h-auto max-w-full items-start justify-start text-left leading-snug break-words whitespace-normal"
                          >
                            {category.name} ({category.postCount})
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {popularTags.length > 0 ? (
                    <div className="space-y-2">
                      <Text variant="small" className="font-medium">
                        Từ khóa nổi bật
                      </Text>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={buildPostsHref(baseQuery, {
                            tagSlug: "",
                            page: 1,
                          })}
                          prefetch={false}
                        >
                          <Badge variant={tagSlug ? "outline" : "default"}>
                            Tất cả
                          </Badge>
                        </Link>
                        {popularTags.map((tag) => (
                          <Link
                            key={tag.slug}
                            href={buildPostsHref(baseQuery, {
                              tagSlug: tag.slug,
                              page: 1,
                            })}
                            prefetch={false}
                          >
                            <Badge
                              variant={
                                tagSlug === tag.slug ? "default" : "outline"
                              }
                            >
                              #{tag.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </aside>

            <section className="space-y-4">
              {posts.length > 0 ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {posts.map((post, postIndex) => {
                      const primaryCategory = post.categories[0]?.category
                      const publishedDate = formatPostDate(post.publishedAt)

                      return (
                        <Card
                          key={post.id}
                          className="overflow-hidden rounded-lg pt-0"
                        >
                          {post.image?.trim() ? (
                            <div className="relative aspect-[16/9] w-full bg-muted">
                              <img
                                src={post.image}
                                alt={post.title}
                                className="absolute inset-0 h-full w-full object-cover"
                                loading={postIndex < 3 ? "eager" : "lazy"}
                                decoding="async"
                                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                              />
                            </div>
                          ) : (
                            <div className="flex aspect-[16/9] w-full items-center justify-center bg-muted">
                              <ImageIcon className="size-10 text-muted-foreground/40" />
                            </div>
                          )}
                          <CardHeader className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              {primaryCategory ? (
                                <Badge variant="secondary">
                                  {primaryCategory.name}
                                </Badge>
                              ) : null}
                              {publishedDate ? (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <CalendarDays className="size-3.5" />
                                  {publishedDate}
                                </span>
                              ) : null}
                            </div>
                            <CardTitle className="line-clamp-2 text-lg">
                              {post.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Text
                              variant="small"
                              className="line-clamp-3 text-muted-foreground"
                            >
                              {post.excerpt?.trim() ||
                                "Nội dung bài viết đang được cập nhật."}
                            </Text>
                            <div className="flex items-center justify-between gap-3">
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Eye className="size-3.5" />
                                {post.viewCount} lượt xem
                              </span>
                              <Link
                                href={`/bai-viet/${post.slug}`}
                                prefetch={false}
                              >
                                <Button
                                  variant="outline"
                                  className="rounded-lg"
                                >
                                  Xem chi tiết
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  <Card className="rounded-lg">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <Text
                            variant="small"
                            className="text-muted-foreground"
                          >
                            Hiển thị {posts.length} / {meta.total} bài viết
                          </Text>
                          <Text
                            variant="small"
                            className="text-muted-foreground"
                          >
                            Trang {meta.page} / {meta.totalPages}
                          </Text>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-1">
                          {[6, 12, 18].map((limitOption) => (
                            <Link
                              key={limitOption}
                              href={buildPostsHref(baseQuery, {
                                limit: limitOption,
                                page: 1,
                              })}
                              prefetch={false}
                              className={
                                limit === limitOption
                                  ? "pointer-events-none"
                                  : ""
                              }
                            >
                              <Button
                                variant={
                                  limitOption === limit ? "default" : "ghost"
                                }
                                size="sm"
                                className="h-8 rounded-md px-3"
                              >
                                {limitOption}/trang
                              </Button>
                            </Link>
                          ))}
                        </div>
                      </div>
                      <Pagination className="justify-center">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href={buildPostsHref(baseQuery, {
                                page: Math.max(1, meta.page - 1),
                              })}
                              text="Trước"
                              aria-disabled={meta.page <= 1}
                              className={
                                meta.page <= 1
                                  ? "pointer-events-none opacity-40"
                                  : ""
                              }
                            />
                          </PaginationItem>
                          {pagerItems.map((item, index) => (
                            <PaginationItem key={`${item}-${index}`}>
                              {item === "ellipsis" ? (
                                <PaginationEllipsis />
                              ) : (
                                <PaginationLink
                                  href={buildPostsHref(baseQuery, {
                                    page: item,
                                  })}
                                  isActive={item === meta.page}
                                >
                                  {item}
                                </PaginationLink>
                              )}
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              href={buildPostsHref(baseQuery, {
                                page: Math.min(meta.totalPages, meta.page + 1),
                              })}
                              text="Sau"
                              aria-disabled={meta.page >= meta.totalPages}
                              className={
                                meta.page >= meta.totalPages
                                  ? "pointer-events-none opacity-40"
                                  : ""
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Empty className="rounded-lg border border-dashed">
                  <EmptyHeader>
                    <EmptyTitle>Không tìm thấy bài viết phù hợp</EmptyTitle>
                    <EmptyDescription>
                      Thử đổi bộ lọc, từ khóa tìm kiếm hoặc quay về danh sách
                      tất cả bài viết.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Link href="/bai-viet" prefetch={false}>
                      <Button variant="outline" className="rounded-lg">
                        Đặt lại bộ lọc
                      </Button>
                    </Link>
                  </EmptyContent>
                </Empty>
              )}
            </section>
          </div>
        </Container>
      </PageContent>
    </Page>
  )
}
