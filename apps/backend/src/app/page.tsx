"use client"

import dynamic from "next/dynamic"
import type React from "react"
import Link from "next/link"
import {
  FileText,
  FolderOpen,
  Headset,
  LayoutDashboard,
  ShieldCheck,
  Tags,
  TrendingUp,
  Users,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card"
import { PageSection } from "@ui/components/layout"
import { Skeleton } from "@ui/components/skeleton"
import { TypographyH1 } from "@ui/components/typography"
import {
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell"
import { PERMISSION_CODES } from "@workspace/api-client"
import { useAuth } from "@/providers/auth-provider"
import { api } from "@/lib/api"
import type { DashboardStatsDto, DashboardOverviewDto } from "@/types/dashboard"

const MonthlyLineChart = dynamic(
  () => import("@/components/dashboard-charts").then((m) => m.MonthlyLineChart),
  { ssr: false }
)
const MonthlyBarChart = dynamic(
  () => import("@/components/dashboard-charts").then((m) => m.MonthlyBarChart),
  { ssr: false }
)
const CategoryDoughnutChart = dynamic(
  () =>
    import("@/components/dashboard-charts").then(
      (m) => m.CategoryDoughnutChart
    ),
  { ssr: false }
)
const TopPostsChart = dynamic(
  () => import("@/components/dashboard-charts").then((m) => m.TopPostsChart),
  { ssr: false }
)

type StatCard = {
  label: string
  value: number | undefined
  isLoading: boolean
  icon: React.ElementType
  href: string
  color: string
  change?: number
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-1 h-8 w-16" />
        <Skeleton className="h-3 w-28" />
      </CardContent>
    </Card>
  )
}

function StatCardItem({ card }: { card: StatCard }) {
  const Icon = card.icon
  return (
    <Link href={card.href} className="group block">
      <Card className="transition-all duration-200 group-hover:border-primary/30 hover:-translate-y-px hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {card.label}
          </CardTitle>
          <div
            className={`flex size-8 items-center justify-center rounded-lg ${card.color}`}
          >
            <Icon className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-extrabold tracking-tight text-foreground">
            {card.value ?? "—"}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">Xem chi tiết →</p>
        </CardContent>
      </Card>
    </Link>
  )
}

type QuickLink = {
  href: string
  label: string
  description: string
  icon: React.ElementType
  permission: (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES] | null
}

export const QUICK_LINKS: QuickLink[] = [
  {
    href: "/posts",
    label: "Quản lý bài viết",
    description: "Tạo, chỉnh sửa và xuất bản bài viết",
    icon: FileText,
    permission: null,
  },
  {
    href: "/categories",
    label: "Danh mục nội dung",
    description: "Cây danh mục phân cấp cho bài viết",
    icon: FolderOpen,
    permission: null,
  },
  {
    href: "/tags",
    label: "Thẻ nội dung",
    description: "Gán thẻ phân loại bài viết",
    icon: Tags,
    permission: PERMISSION_CODES.TAGS_VIEW,
  },
  {
    href: "/staff",
    label: "Nhân sự & tài khoản",
    description: "Quản lý tài khoản nhân viên",
    icon: Users,
    permission: PERMISSION_CODES.USERS_MANAGE,
  },
  {
    href: "/rbac",
    label: "Vai trò & phân quyền",
    description: "Cấu hình quyền truy cập hệ thống",
    icon: ShieldCheck,
    permission: PERMISSION_CODES.RBAC_READ,
  },
  {
    href: "/contact-requests",
    label: "Yêu cầu liên hệ",
    description: "Xử lý yêu cầu hỗ trợ từ khách hàng",
    icon: Headset,
    permission: PERMISSION_CODES.CONTACT_REQUESTS_VIEW,
  },
]

function buildStats(
  overview: DashboardOverviewDto | undefined,
  isLoading: boolean
): StatCard[] {
  return [
    {
      label: "Bài viết",
      value: overview?.totalPosts,
      isLoading,
      icon: FileText,
      href: "/posts",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      change: overview?.postsChange,
    },
    {
      label: "Danh mục",
      value: overview?.totalCategories,
      isLoading,
      icon: FolderOpen,
      href: "/categories",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      change: overview?.categoriesChange,
    },
    {
      label: "Tài khoản",
      value: overview?.totalUsers,
      isLoading,
      icon: Users,
      href: "/staff",
      color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      change: overview?.usersChange,
    },
    {
      label: "Liên hệ",
      value: overview?.totalContactRequests,
      isLoading,
      icon: Headset,
      href: "/contact-requests",
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      change: overview?.contactRequestsChange,
    },
  ]
}

export default function AdminDashboardPage() {
  const { user } = useAuth()

  const displayName = user?.name?.trim() || user?.email || "Người dùng"

  const { data, isLoading } = useQuery<DashboardStatsDto>({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const payload = await api.http.get<unknown>("/admin/dashboard/stats")
      const envelope = payload as {
        success?: boolean
        data?: DashboardStatsDto
      }
      return envelope.data as DashboardStatsDto
    },
    staleTime: 60_000,
  })

  const stats = buildStats(data?.overview, isLoading)

  return (
    <PageSection max="full" className="min-w-0 space-y-8">
      {/* Header */}
      <div>
        <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
          <LayoutDashboard
            className={ADMIN_PAGE_TITLE_ICON_CLASS}
            aria-hidden
          />
          Tổng quan hệ thống
        </TypographyH1>
        <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
          Xin chào,{" "}
          <span className="font-semibold text-foreground">{displayName}</span>.
          Đây là bảng điều khiển quản trị HUB Parent.
        </p>
      </div>

      {/* Stat cards */}
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          <TrendingUp className="size-4" aria-hidden />
          Tổng quan dữ liệu
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((card) =>
            card.isLoading ? (
              <StatCardSkeleton key={card.label} />
            ) : (
              <StatCardItem key={card.label} card={card} />
            )
          )}
        </div>
      </div>

      {/* Charts */}
      {data && (data.monthlyData?.length ?? 0) > 0 && (
        <div className="space-y-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            <TrendingUp className="size-4" aria-hidden />
            Biểu đồ thống kê
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <MonthlyLineChart data={data.monthlyData} />
            <MonthlyBarChart data={data.monthlyData} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {(data.categoryData?.length ?? 0) > 0 && (
              <CategoryDoughnutChart data={data.categoryData} />
            )}
            {(data.topPosts?.length ?? 0) > 0 && (
              <TopPostsChart data={data.topPosts} />
            )}
          </div>
        </div>
      )}
    </PageSection>
  )
}
