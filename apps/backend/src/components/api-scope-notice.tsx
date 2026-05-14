"use client";

import Link from "next/link";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { PageSection } from "@ui/components/layout";
import { TypographyH1 } from "@ui/components/typography";
import {
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";
import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";

export function ApiScopeNotice(props: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
}) {
  const Icon = props.icon;

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div>
        <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
          <Icon className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
          {props.title}
        </TypographyH1>
        <p className={ADMIN_PAGE_SUBTITLE_CLASS}>{props.subtitle}</p>
      </div>

      <Card className="border-outline-variant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="size-5 text-primary" aria-hidden />
            Ngoai pham vi API HUB
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Man hinh nay thuoc bo store-sync cu va khong co entity/route tuong
            ung trong `apps/api/src/entities`.
          </p>
          <p>
            De clean dung pham vi dang nhap va quan tri cua HUB, cac phu thuoc
            `products`, `orders`, `dealer-support` da duoc tach
            khoi `@workspace/api-client`.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/staff">
              <Button variant="outline">Mo nhan su & phan quyen</Button>
            </Link>
            <Link href="/categories">
              <Button variant="outline">Mo danh muc</Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline">Mo ho so tai khoan</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </PageSection>
  );
}
