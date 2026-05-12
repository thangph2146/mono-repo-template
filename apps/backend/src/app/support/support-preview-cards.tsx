"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { buttonVariants } from "@ui/components/button";
import {
  Clock,
  HelpCircle,
  MessageCircle,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import type { DealerSupportPublicPayload } from "@workspace/api-client";
import { cn } from "@ui/lib/utils";

export function SupportPreviewCards(props: {
  payload: DealerSupportPublicPayload;
  zaloOaUrl: string;
  storefrontBase: string;
}) {
  const { payload, zaloOaUrl, storefrontBase } = props;
  const helpPath = payload.accountManager.helpHrefPath.startsWith("/")
    ? payload.accountManager.helpHrefPath
    : `/${payload.accountManager.helpHrefPath}`;
  const helpHref = `${storefrontBase}${helpPath}`;

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-10">
      <div className="mx-auto max-w-3xl space-y-3 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {payload.title}
        </h2>
        <p className="text-lg text-muted-foreground">{payload.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <Card className="group overflow-hidden rounded-[2rem] border-outline-variant shadow-lg transition-all duration-300 hover:shadow-xl">
          <CardHeader className="pb-4 pt-10 text-center">
            <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-primary/10 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
              <Phone className="h-14 w-14 text-primary" aria-hidden />
            </div>
            <CardTitle className="text-3xl font-black text-foreground">
              {payload.hotline.cardTitle}
            </CardTitle>
            <CardDescription className="mt-2 text-xl font-medium text-muted-foreground">
              {payload.hotline.cardDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 p-10 pt-4">
            <div className="w-full rounded-2xl border border-outline-variant/30 bg-surface p-6 text-center shadow-inner">
              <a
                href={payload.hotline.telHref}
                className="text-4xl font-black tracking-tighter text-primary hover:underline"
              >
                {payload.hotline.display}
              </a>
              <p className="mt-2 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" aria-hidden />
                {payload.hotline.hoursLine}
              </p>
            </div>
            <a
              href={payload.hotline.telHref}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-20 w-full gap-3 rounded-2xl text-2xl font-black shadow-xl transition-all active:scale-95",
              )}
            >
              <Phone className="size-10 shrink-0" aria-hidden />
              {payload.hotline.ctaLabel}
            </a>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden rounded-[2rem] border-outline-variant shadow-lg transition-all duration-300 hover:shadow-xl">
          <CardHeader className="pb-4 pt-10 text-center">
            <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-emerald-500/10 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
              <MessageCircle className="h-14 w-14 text-emerald-600" aria-hidden />
            </div>
            <CardTitle className="text-3xl font-black text-foreground">
              {payload.zalo.cardTitle}
            </CardTitle>
            <CardDescription className="mt-2 text-xl font-medium text-muted-foreground">
              {payload.zalo.cardDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 p-10 pt-4">
            <div className="w-full rounded-2xl border border-outline-variant/30 bg-surface p-6 text-center shadow-inner">
              <p className="text-2xl font-black uppercase tracking-tight text-emerald-600">
                {payload.zalo.handleLine}
              </p>
              <p className="mt-2 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                {payload.zalo.responseNote}
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
              <MessageCircle className="size-10 shrink-0" aria-hidden />
              {payload.zalo.ctaLabel}
            </a>
          </CardContent>
        </Card>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-[2.5rem] border border-outline-variant/50 bg-surface p-10 shadow-sm">
        <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative z-10 flex flex-col items-center justify-between gap-10 lg:flex-row">
          <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:text-left">
            <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-primary/10 shadow-xl">
              <User className="h-16 w-16 text-primary" aria-hidden />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black leading-tight text-foreground">
                {payload.accountManager.sectionTitle}
              </h3>
              <p className="text-base text-muted-foreground">{payload.accountManager.leadLine}</p>
              <p className="text-lg font-bold text-primary">
                {payload.accountManager.namePlaceholder}
              </p>
              <p className="text-sm text-muted-foreground">{payload.accountManager.regionLine}</p>
            </div>
          </div>

          <div className="w-full min-w-[300px] rounded-3xl border border-primary/20 bg-background/80 p-8 text-center shadow-lg backdrop-blur-sm lg:w-auto">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              {payload.accountManager.directPhoneLabel}
            </p>
            <a
              href={payload.accountManager.directTelHref}
              className="text-3xl font-black text-foreground hover:underline"
            >
              {payload.accountManager.directPhoneDisplay}
            </a>
            <a
              href={helpHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto mt-4 flex items-center justify-center gap-2 text-lg font-bold text-primary hover:underline"
            >
              <HelpCircle className="h-5 w-5 shrink-0" aria-hidden />
              {payload.accountManager.helpCtaLabel}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
