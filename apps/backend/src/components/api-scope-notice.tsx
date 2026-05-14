"use client"

import Link from "next/link"
import { Button } from "@ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card"
import { PageSection } from "@ui/components/layout"
import { TypographyH1 } from "@ui/components/typography"
import {
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell"
import type { LucideIcon } from "lucide-react"
import { Info } from "lucide-react"

export function ApiScopeNotice(props: {
  title: string
  subtitle: string
  icon: LucideIcon
}) {
  const Icon = props.icon

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
            Ngoài phạm vi API HUB Parent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Màn hình này chưa có entity hoặc route tương ứng trong API hiện tại
            của hệ thống liên kết phụ huynh với nhà trường.
          </p>
          <p>
            Để giữ đúng phạm vi quản trị HUB Parent, hãy ưu tiên các nghiệp vụ
            đang có như nhân sự, phân quyền, nội dung, sinh viên, phụ huynh và
            liên hệ hỗ trợ.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/staff">
              <Button variant="outline">Mở nhân sự & phân quyền</Button>
            </Link>
            <Link href="/categories">
              <Button variant="outline">Mở danh mục</Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline">Mở hồ sơ tài khoản</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </PageSection>
  )
}
