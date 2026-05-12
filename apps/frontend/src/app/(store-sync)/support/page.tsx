import Link from "next/link";

/** Nội dung lấy từ API theo từng request — tránh cache RSC sau khi admin chỉnh DB. */
export const dynamic = "force-dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { buttonVariants } from "@ui/components/button";
import { Phone, MessageCircle, User, Clock, ShieldCheck, HelpCircle } from "lucide-react";
import { Container, Page, PageContent } from "@ui/components/layout";
import {
  STORE_CONTAINER_INSET,
  STORE_CONTAINER_MAX_DEFAULT,
  STORE_INTRO_COLUMN_CLASS,
  STORE_PAGE_CONTENT_CLASS,
} from "@ui/lib/layout-shell";
import { cn } from "@ui/lib/utils";
import { DEFAULT_API_URL } from "@workspace/api-client";
import type { DealerSupportPublicPayload } from "@workspace/dealer-support";
import { getDealerSupportPublicPayload } from "@workspace/dealer-support";

async function loadDealerSupportPayload(): Promise<DealerSupportPublicPayload> {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/public/dealer-support`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return getDealerSupportPublicPayload();
    }
    const json: unknown = await res.json();
    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return getDealerSupportPublicPayload();
    }
    return json as DealerSupportPublicPayload;
  } catch {
    return getDealerSupportPublicPayload();
  }
}

export default async function SupportPage() {
  const p = await loadDealerSupportPayload();
  const zaloOaUrl =
    process.env.NEXT_PUBLIC_ZALO_OA_URL?.trim() || p.zalo.oaUrl;

  return (
    <Page>
      <PageContent className={STORE_PAGE_CONTENT_CLASS}>
        <section>
          <Container max={STORE_CONTAINER_MAX_DEFAULT} className={cn(STORE_CONTAINER_INSET, "space-y-10")}>
            <div className={STORE_INTRO_COLUMN_CLASS}>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {p.title}
              </h1>
              <p className="text-lg text-muted-foreground">{p.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              <Card className="group overflow-hidden rounded-[2rem] border-outline-variant shadow-lg transition-all duration-300 hover:shadow-xl">
                <CardHeader className="pb-4 pt-10 text-center">
                  <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-primary/10 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                    <Phone className="h-14 w-14 text-primary" aria-hidden />
                  </div>
                  <CardTitle className="text-3xl font-black text-foreground">
                    {p.hotline.cardTitle}
                  </CardTitle>
                  <CardDescription className="mt-2 text-xl font-medium text-muted-foreground">
                    {p.hotline.cardDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 p-10 pt-4">
                  <div className="w-full rounded-2xl border border-outline-variant/30 bg-surface p-6 text-center shadow-inner">
                    <a
                      href={p.hotline.telHref}
                      className="text-4xl font-black tracking-tighter text-primary hover:underline"
                    >
                      {p.hotline.display}
                    </a>
                    <p className="mt-2 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0" aria-hidden />
                      {p.hotline.hoursLine}
                    </p>
                  </div>
                  <a
                    href={p.hotline.telHref}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "h-20 w-full gap-3 rounded-2xl text-2xl font-black shadow-xl transition-all active:scale-95",
                    )}
                  >
                    <Phone className="h-7 w-7 shrink-0" aria-hidden />
                    {p.hotline.ctaLabel}
                  </a>
                </CardContent>
              </Card>

              <Card className="group overflow-hidden rounded-[2rem] border-outline-variant shadow-lg transition-all duration-300 hover:shadow-xl">
                <CardHeader className="pb-4 pt-10 text-center">
                  <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-emerald-500/10 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                    <MessageCircle className="h-14 w-14 text-emerald-600" aria-hidden />
                  </div>
                  <CardTitle className="text-3xl font-black text-foreground">
                    {p.zalo.cardTitle}
                  </CardTitle>
                  <CardDescription className="mt-2 text-xl font-medium text-muted-foreground">
                    {p.zalo.cardDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 p-10 pt-4">
                  <div className="w-full rounded-2xl border border-outline-variant/30 bg-surface p-6 text-center shadow-inner">
                    <p className="text-2xl font-black uppercase tracking-tight text-emerald-600">
                      {p.zalo.handleLine}
                    </p>
                    <p className="mt-2 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
                      <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                      {p.zalo.responseNote}
                    </p>
                  </div>
                  <a
                    href={zaloOaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "h-20 w-full gap-3 rounded-2xl bg-emerald-600 text-2xl font-black text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95",
                    )}
                  >
                    <MessageCircle className="h-7 w-7 shrink-0" aria-hidden />
                    {p.zalo.ctaLabel}
                  </a>
                </CardContent>
              </Card>
            </div>

            <div className="relative mt-16 overflow-hidden rounded-[2.5rem] border border-outline-variant/50 bg-surface p-10 shadow-sm">
              <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
              <div className="relative z-10 flex flex-col items-center justify-between gap-10 lg:flex-row">
                <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:text-left">
                  <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-primary/10 shadow-xl">
                    <User className="h-16 w-16 text-primary" aria-hidden />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black leading-tight text-foreground">
                      {p.accountManager.sectionTitle}
                    </h2>
                    <p className="text-base text-muted-foreground">{p.accountManager.leadLine}</p>
                    <p className="text-lg font-bold text-primary">
                      {p.accountManager.namePlaceholder}
                    </p>
                    <p className="text-sm text-muted-foreground">{p.accountManager.regionLine}</p>
                  </div>
                </div>

                <div className="w-full min-w-[300px] rounded-3xl border border-primary/20 bg-background/80 p-8 text-center shadow-lg backdrop-blur-sm lg:w-auto">
                  <p className="mb-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    {p.accountManager.directPhoneLabel}
                  </p>
                  <a
                    href={p.accountManager.directTelHref}
                    className="text-3xl font-black text-foreground hover:underline"
                  >
                    {p.accountManager.directPhoneDisplay}
                  </a>
                  <Link
                    href={p.accountManager.helpHrefPath}
                    className="mx-auto mt-4 flex items-center justify-center gap-2 text-lg font-bold text-primary hover:underline"
                  >
                    <HelpCircle className="h-5 w-5 shrink-0" aria-hidden />
                    {p.accountManager.helpCtaLabel}
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </PageContent>
    </Page>
  );
}
