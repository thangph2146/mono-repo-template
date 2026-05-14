import type { Metadata } from "next";
import { BookOpen, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@ui/components/card";
import { Container, Page, PageContent } from "@ui/components/layout";
import { Heading, Text } from "@ui/components/typography";
import {
  STORE_CONTAINER_INSET,
  STORE_CONTAINER_MAX_DEFAULT,
  STORE_PAGE_CONTENT_CLASS,
} from "@ui/lib/layout-shell";
import { GuideSections } from "./guide-sections";

export const metadata: Metadata = {
  title: "Hướng dẫn sử dụng",
  description: "Hướng dẫn sử dụng hệ thống HUB.",
};

interface GuideStep {
  order: number;
  title: string;
  description: string;
  imageUrl?: string;
}

interface GuideSection {
  id: string;
  pageKey: string;
  sectionKey: string;
  isVisible: boolean;
  content: {
    title?: string;
    description?: string;
    order?: number;
    steps?: GuideStep[];
  };
}

function safeParseContent(raw: unknown): GuideSection["content"] {
  if (typeof raw === "string") {
    try { raw = JSON.parse(raw); } catch { return {}; }
  }
  if (raw == null || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  return {
    title: typeof r.title === "string" ? r.title : undefined,
    description: typeof r.description === "string" ? r.description : undefined,
    order: typeof r.order === "number" ? r.order : 0,
    steps: Array.isArray(r.steps)
      ? (r.steps as Record<string, unknown>[]).map((s, i) => ({
          order: typeof s.order === "number" ? s.order : i + 1,
          title: typeof s.title === "string" ? s.title : "",
          description: typeof s.description === "string" ? s.description : "",
          imageUrl: typeof s.imageUrl === "string" && s.imageUrl ? s.imageUrl : undefined,
        }))
      : [],
  };
}

async function fetchGuides(): Promise<GuideSection[]> {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api").replace(/\/$/, "");
  try {
    const res = await fetch(`${apiUrl}/public/page-contents/huong-dan-su-dung`, {
      next: { revalidate: 60 },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: unknown[] | unknown };
    if (!json.data) return [];
    const rows = Array.isArray(json.data) ? json.data : [json.data];
    return (rows as Record<string, unknown>[]).map((r) => ({
      id: String(r.id ?? ""),
      pageKey: String(r.pageKey ?? ""),
      sectionKey: String(r.sectionKey ?? ""),
      isVisible: r.isVisible !== false,
      content: safeParseContent(r.content),
    }));
  } catch {
    return [];
  }
}

export default async function GuidePage() {
  const sections = (await fetchGuides())
    .filter((s) => s.isVisible)
    .sort((a, b) => (a.content.order ?? 0) - (b.content.order ?? 0));

  return (
    <Page>
      <PageContent className={STORE_PAGE_CONTENT_CLASS}>
        <Container
          max={STORE_CONTAINER_MAX_DEFAULT}
          className={`${STORE_CONTAINER_INSET} space-y-10`}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="size-5" />
              </div>
              <Heading as="h1" size="section">
                Hướng dẫn sử dụng
              </Heading>
            </div>
            <Text variant="small" className="text-muted-foreground">
              Các hướng dẫn thao tác giúp bạn sử dụng hệ thống HUB hiệu quả.
            </Text>
          </div>

          {sections.length === 0 ? (
            <Card className="py-12 text-center">
              <CardContent className="flex flex-col items-center gap-3">
                <AlertCircle className="size-8 text-muted-foreground" />
                <p className="font-semibold">Chưa có hướng dẫn nào</p>
                <p className="text-sm text-muted-foreground">
                  Nội dung đang được cập nhật. Vui lòng quay lại sau.
                </p>
              </CardContent>
            </Card>
          ) : (
            <GuideSections sections={sections} />
          )}
        </Container>
      </PageContent>
    </Page>
  );
}
