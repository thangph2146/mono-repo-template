"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ShieldCheck,
  Cog,
  Database,
  LayoutDashboard,
  Tags,
  FolderOpen,
  FileText,
  Users,
  ChevronDown,
  FolderTree,
  ChevronsUpDown,
  LogOut,
  Headset,
  GraduationCap,
  UserCheck,
  BookOpen,
  Network,
  TableProperties,
  Mic,
  MapPin,
  Layers,
  Building2,
  Library,
  CalendarDays,
  CalendarPlus,
  Camera,
  Search,
  LayoutTemplate,
  Monitor,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@ui/components/button"
import { cn } from "@ui/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@ui/components/collapsible"
import {
  canUserAccess,
  PERMISSION_CODES,
  type PermissionCode,
} from "@workspace/api-client"
import { useAuth } from "@/providers/auth-provider"
import { api } from "@/lib/api"
import type { AuthUser } from "@/lib/api"

type MenuLeaf = {
  href: string
  label: string
  icon: LucideIcon
  permission: PermissionCode | null
  anyPermission?: PermissionCode[]
  /** Chỉ hiển thị với role cụ thể này (khớp role.name). */
  roleGuard?: string
  /** Chỉ hiển thị với super_admin hoặc admin — ẩn với parent và các role không phải staff. */
  adminOnly?: boolean
}

type MenuTreeItem =
  | ({ type: "leaf" } & MenuLeaf)
  | {
      type: "group"
      label: string
      icon: LucideIcon
      children: MenuLeaf[]
    }

const menuTree: MenuTreeItem[] = [
  {
    type: "leaf",
    href: "/",
    label: "Tổng quan",
    icon: LayoutDashboard,
    permission: null,
  },
  {
    type: "group",
    label: "Sinh viên",
    icon: FolderTree,
    children: [
      {
        href: "/my-students",
        label: "Sinh viên",
        icon: GraduationCap,
        permission: null,
        anyPermission: [PERMISSION_CODES.STUDENTS_VIEW_OWN],
        roleGuard: "parent",
      },
      {
        href: "/parent-students",
        label: "Duyệt sinh viên",
        icon: UserCheck,
        permission: null,
        anyPermission: [PERMISSION_CODES.USERS_MANAGE],
      },
      {
        href: "/contact-requests",
        label: "Liên hệ hỗ trợ",
        icon: Headset,
        anyPermission: [
          PERMISSION_CODES.CONTACT_REQUESTS_VIEW,
          PERMISSION_CODES.CONTACT_REQUESTS_MANAGE,
          PERMISSION_CODES.CONTACT_REQUESTS_UPDATE,
          PERMISSION_CODES.CONTACT_REQUESTS_ASSIGN,
        ],
        permission: null,
      },
    ],
  },
  {
    type: "group",
    label: "Danh mục & Tag",
    icon: FolderTree,
    children: [
      {
        href: "/categories",
        label: "Danh mục",
        icon: FolderOpen,
        anyPermission: [
          PERMISSION_CODES.CATEGORIES_VIEW,
          PERMISSION_CODES.CATEGORIES_CREATE,
        ],
        permission: null,
      },
      {
        href: "/tags",
        label: "Tags",
        icon: Tags,
        permission: null,
        anyPermission: [
          PERMISSION_CODES.TAGS_VIEW,
          PERMISSION_CODES.TAGS_MANAGE,
        ],
      },
    ],
  },
  {
    type: "group",
    label: "Truyền thông",
    icon: FolderTree,
    children: [
      {
        href: "/guides",
        label: "Hướng dẫn sử dụng",
        icon: BookOpen,
        permission: PERMISSION_CODES.PAGE_CONTENTS_VIEW,
      },
      {
        href: "/posts",
        label: "Bài viết",
        icon: FileText,
        anyPermission: [PERMISSION_CODES.POSTS_VIEW],
        permission: null,
      }
    ],
  },
  {
    type: "group",
    label: "HRM",
    icon: Users,
    children: [
      {
        href: "/staff",
        label: "Nhân sự",
        icon: Users,
        permission: null,
        anyPermission: [PERMISSION_CODES.USERS_MANAGE],
      },
      {
        href: "/rbac",
        label: "Phân quyền",
        icon: ShieldCheck,
        permission: PERMISSION_CODES.ROLES_VIEW,
      },
    ],
  },
  {
    type: "group",
    label: "Sự kiện & Check-in",
    icon: CalendarPlus,
    children: [
      {
        href: "/events",
        label: "Sự kiện",
        icon: CalendarPlus,
        permission: null,
        anyPermission: [PERMISSION_CODES.EVENTS_VIEW, PERMISSION_CODES.EVENTS_MANAGE],
      },
      {
        href: "/cameras",
        label: "Camera",
        icon: Camera,
        permission: null,
        anyPermission: [PERMISSION_CODES.CAMERAS_VIEW, PERMISSION_CODES.CAMERAS_MANAGE],
      },
      {
        href: "/templates",
        label: "Mẫu hiển thị",
        icon: LayoutTemplate,
        permission: null,
        anyPermission: [PERMISSION_CODES.TEMPLATES_VIEW, PERMISSION_CODES.TEMPLATES_MANAGE],
      },
      {
        href: "/screens",
        label: "Màn hình",
        icon: Monitor,
        permission: null,
        anyPermission: [PERMISSION_CODES.SCREENS_VIEW, PERMISSION_CODES.SCREENS_MANAGE],
      },
      {
        href: "/departments",
        label: "Phòng khoa",
        icon: Building2,
        permission: null,
        anyPermission: [PERMISSION_CODES.DEPARTMENTS_VIEW, PERMISSION_CODES.DEPARTMENTS_MANAGE],
      },
      {
        href: "/speakers",
        label: "Diễn giả",
        icon: Mic,
        permission: null,
        anyPermission: [PERMISSION_CODES.SPEAKERS_VIEW, PERMISSION_CODES.SPEAKERS_MANAGE],
      },
      {
        href: "/locations",
        label: "Địa điểm",
        icon: MapPin,
        permission: null,
        anyPermission: [PERMISSION_CODES.LOCATIONS_VIEW, PERMISSION_CODES.LOCATIONS_MANAGE],
      },
    ],
  },
  {
    type: "group",
    label: "Đào tạo",
    icon: Database,
    children: [
      {
        href: "/training-levels",
        label: "Bậc học",
        icon: Layers,
        permission: null,
        anyPermission: [
          PERMISSION_CODES.TRAINING_LEVELS_VIEW,
          PERMISSION_CODES.TRAINING_LEVELS_MANAGE,
        ],
      },
      {
        href: "/training-systems",
        label: "Hệ đào tạo",
        icon: Building2,
        permission: null,
        anyPermission: [
          PERMISSION_CODES.TRAINING_SYSTEMS_VIEW,
          PERMISSION_CODES.TRAINING_SYSTEMS_MANAGE,
        ],
      },
      {
        href: "/majors",
        label: "Ngành học",
        icon: BookOpen,
        permission: null,
        anyPermission: [
          PERMISSION_CODES.MAJORS_VIEW,
          PERMISSION_CODES.MAJORS_MANAGE,
        ],
      },
      {
        href: "/courses",
        label: "Khóa học",
        icon: Library,
        permission: null,
        anyPermission: [
          PERMISSION_CODES.COURSES_VIEW,
          PERMISSION_CODES.COURSES_MANAGE,
        ],
      },
      {
        href: "/academic-years",
        label: "Niên khóa",
        icon: CalendarDays,
        permission: null,
        anyPermission: [
          PERMISSION_CODES.ACADEMIC_YEARS_VIEW,
          PERMISSION_CODES.ACADEMIC_YEARS_MANAGE,
        ],
      },
    ],
  },
  {
    type: "group",
    label: "Hệ thống",
    icon: Database,
    children: [
      {
        href: "/settings",
        label: "Cài đặt chung",
        icon: Cog,
        permission: PERMISSION_CODES.SETTINGS_MANAGE,
      },
      {
        href: "/seo-metas",
        label: "SEO Metadata",
        icon: Search,
        permission: null,
        anyPermission: [
          PERMISSION_CODES.SEO_METAS_VIEW,
          PERMISSION_CODES.SEO_METAS_MANAGE,
        ],
      },
      {
        href: "/data",
        label: "Sao lưu dữ liệu",
        icon: Database,
        permission: PERMISSION_CODES.SETTINGS_MANAGE,
      },

      {
        href: "/database-schema",
        label: "Quan hệ CSDL",
        icon: TableProperties,
        permission: null,
        adminOnly: true,
      },
      {
        href: "/graph",
        label: "Kiến trúc hệ thống",
        icon: Network,
        permission: null,
        adminOnly: true,
      },
    ],
  },
]

const SUPER_ROLES = ["super_admin", "admin"] as const

function isSuperUser(user: AuthUser): boolean {
  return (
    user.roles?.some((r) =>
      SUPER_ROLES.includes(r.name as (typeof SUPER_ROLES)[number])
    ) ?? false
  )
}

function canSeeLeaf(user: AuthUser | null, item: MenuLeaf): boolean {
  if (!user) return false
  if (isSuperUser(user)) return true
  // roleGuard: chỉ role cụ thể này mới thấy (ví dụ: "parent" cho /my-students)
  if (item.roleGuard) {
    const matched = user.roles?.some((r) => r.name === item.roleGuard) ?? false
    if (matched) return true
    // fall through to check anyPermission/permission in case another role also qualifies
  }
  // adminOnly: ẩn với tất cả role không phải super_admin/admin
  if (item.adminOnly) return false
  if (item.anyPermission?.length) {
    return item.anyPermission.some((p) => canUserAccess(user, p))
  }
  if (item.permission === null) return true
  return canUserAccess(user, item.permission)
}

export function getVisibleMenuItems(user: AuthUser | null): MenuTreeItem[] {
  if (!user) return []
  return menuTree.reduce<MenuTreeItem[]>((acc, item) => {
    if (item.type === "leaf") {
      if (canSeeLeaf(user, item)) {
        acc.push(item)
      }
      return acc
    }

    const children = item.children.filter((child) => canSeeLeaf(user, child))
    if (children.length === 0) {
      return acc
    }
    acc.push({ ...item, children })
    return acc
  }, [])
}

function useSiteConfig() {
  const { data } = useQuery({
    queryKey: ["settings", "site-config"],
    queryFn: async () => {
      const [nameRes, descRes] = await Promise.all([
        api.http.get("/admin/settings/site_name"),
        api.http.get("/admin/settings/site_description"),
      ])
      const extract = (res: unknown, fallback: string): string => {
        const e = res as { data?: { value?: unknown }; value?: unknown }
        const raw = e.data?.value ?? e.value
        if (typeof raw === "string") {
          try {
            const parsed = JSON.parse(raw)
            return typeof parsed === "string" ? parsed : raw
          } catch {
            return raw
          }
        }
        return fallback
      }
      return {
        siteName: extract(nameRes, "HUB Parent"),
        siteDescription: extract(descRes, "Quản trị hệ thống"),
      }
    },
    staleTime: 5 * 60 * 1000,
  })
  return {
    siteName: data?.siteName ?? "HUB Parent",
    siteDescription: data?.siteDescription ?? "Quản trị hệ thống",
  }
}

function displayNameOf(user: AuthUser | null): string {
  return user?.name?.trim() || user?.email || "Người dùng HUB"
}

function roleSummaryOf(user: AuthUser | null): string {
  const labels = (user?.roles ?? [])
    .map((role) => role.displayName || role.name)
    .filter(Boolean)
  if (!labels.length) return "Chưa gán vai trò"
  return labels.join(" · ")
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "HU"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function SidebarLeafLink({
  item,
  isActive,
  collapsed,
  onClick,
  nested = false,
}: {
  item: MenuLeaf
  isActive: boolean
  collapsed: boolean
  onClick?: () => void
  nested?: boolean
}) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      title={item.label}
      onClick={onClick}
      className={cn(
        "group relative flex items-center overflow-hidden rounded-lg transition-all duration-200",
        collapsed
          ? "justify-center px-2 py-3"
          : nested
            ? "gap-3 px-3 py-1"
            : "gap-3 px-3 py-1",
        isActive
          ? nested
            ? "bg-white/20 text-white"
            : "bg-white/20 text-white"
          : "text-white/88 hover:bg-white/15 hover:text-white"
      )}
    >
      {isActive && !collapsed ? (
        <span
          className={cn(
            "absolute left-0 rounded-r-full",
            nested
              ? "inset-y-2.5 w-px bg-white/35"
              : "inset-y-2 w-1 bg-white/85"
          )}
        />
      ) : null}
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg transition-all duration-200",
          collapsed ? "size-9" : nested ? "size-8" : "size-8"
        )}
      >
        <Icon
          className={cn(
            "shrink-0 transition-transform duration-200 group-hover:scale-105",
            nested ? "size-[1.05rem]" : "size-[1.1rem]"
          )}
        />
      </span>
      {!collapsed && (
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            nested
              ? "text-[0.98rem] font-medium"
              : "text-[1.02rem] font-semibold"
          )}
        >
          {item.label}
        </span>
      )}
    </Link>
  )
}

function isLeafActive(pathname: string, href: string): boolean {
  if (pathname === href) return true
  // Check if pathname starts with href followed by a slash (for detail/edit pages)
  if (pathname.startsWith(`${href}/`)) return true
  return false
}

function isGroupActive(pathname: string, items: MenuLeaf[]): boolean {
  return items.some((item) => isLeafActive(pathname, item.href))
}

function getFlatVisibleLeaves(items: MenuTreeItem[]): MenuLeaf[] {
  return items.flatMap((item) =>
    item.type === "leaf" ? [item] : item.children
  )
}

function getLegacyVisibleItems(user: AuthUser | null): MenuLeaf[] {
  const visible = getVisibleMenuItems(user)
  return getFlatVisibleLeaves(visible)
}

function LegacyCollapsedNav({
  visible,
  pathname,
  onLinkClick,
}: {
  visible: MenuLeaf[]
  pathname: string
  onLinkClick?: () => void
}) {
  return (
    <>
      {visible.map((item) => (
        <SidebarLeafLink
          key={item.href}
          item={item}
          isActive={isLeafActive(pathname, item.href)}
          collapsed
          onClick={onLinkClick}
        />
      ))}
    </>
  )
}

function TreeNav({
  visible,
  pathname,
  onLinkClick,
}: {
  visible: MenuTreeItem[]
  pathname: string
  onLinkClick?: () => void
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setOpenGroups((prev) => {
      const next: Record<string, boolean> = {}

      for (const item of visible) {
        if (item.type !== "group") continue
        const isActive = isGroupActive(pathname, item.children)
        next[item.label] = prev[item.label] ?? isActive
        if (isActive) {
          next[item.label] = true
        }
      }

      return next
    })
  }, [pathname, visible])

  return (
    <>
      {visible.map((item) => {
        if (item.type === "leaf") {
          return (
            <SidebarLeafLink
              key={item.href}
              item={item}
              isActive={isLeafActive(pathname, item.href)}
              collapsed={false}
              onClick={onLinkClick}
            />
          )
        }

        const groupActive = isGroupActive(pathname, item.children)
        return (
          <Collapsible
            key={item.label}
            open={openGroups[item.label] ?? groupActive}
            onOpenChange={(open) =>
              setOpenGroups((prev) => ({ ...prev, [item.label]: open }))
            }
            className="rounded-lg"
          >
            <CollapsibleTrigger
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left transition-all duration-200",
                groupActive
                  ? "mb-1 bg-white/20 text-white"
                  : "text-white/90 hover:bg-white/15 hover:text-white"
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg"
                )}
              >
                <item.icon className="size-[1.1rem]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[1.02rem] font-semibold">
                  {item.label}
                </p>
                <p className="truncate text-[11px] text-white/55">
                  {item.children.length} mục
                </p>
              </div>
              <ChevronDown className="size-4 shrink-0 text-white/55 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-2 pb-1">
              <div className="ml-4 space-y-1 border-l border-white/12 pl-3">
                {item.children.map((child) => (
                  <SidebarLeafLink
                    key={child.href}
                    item={child}
                    isActive={isLeafActive(pathname, child.href)}
                    collapsed={false}
                    nested
                    onClick={onLinkClick}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </>
  )
}

export function SidebarNavLinks({
  collapsed,
  onLinkClick,
  className,
}: {
  collapsed: boolean
  onLinkClick?: () => void
  className?: string
}) {
  const pathname = usePathname()
  const { user } = useAuth()
  const visible = getVisibleMenuItems(user)
  const collapsedVisible = getLegacyVisibleItems(user)

  return (
    <nav
      className={cn(
        "flex-1 overflow-y-auto",
        collapsed ? "p-2" : "p-4",
        className
      )}
    >
      {!collapsed && (
        <div className="px-3 pt-1 pb-2 text-[11px] font-semibold tracking-[0.16em] text-white/52 uppercase">
          Platform
        </div>
      )}
      <div className={cn("space-y-1.5", collapsed ? "" : "space-y-2")}>
        {collapsed ? (
          <LegacyCollapsedNav
            visible={collapsedVisible}
            pathname={pathname}
            onLinkClick={onLinkClick}
          />
        ) : (
          <TreeNav
            visible={visible}
            pathname={pathname}
            onLinkClick={onLinkClick}
          />
        )}
      </div>
    </nav>
  )
}

/** Menu dạng drawer cho màn hình nhỏ (Sheet). */
export function MobileSidebarPanel({ onNavigate }: { onNavigate: () => void }) {
  const { user, logout } = useAuth()
  const { siteName, siteDescription } = useSiteConfig()
  const displayName = displayNameOf(user)
  const roleText = roleSummaryOf(user)
  const avatarUrl = user?.image?.trim() || null

  return (
    <div className="flex h-full flex-col bg-primary text-white">
      <div className="shrink-0 px-4 pt-5 pb-4">
        <Link
          href="/"
          className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-all duration-200 hover:bg-white/15"
          onClick={onNavigate}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/12 ring-1 ring-white/12 transition-transform duration-200 group-hover:scale-[1.03]">
            <ShieldCheck className="size-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-heading text-xl font-bold tracking-tight text-white">
              {siteName}
            </p>
            <p className="truncate text-sm text-white/72">{siteDescription}</p>
          </div>
        </Link>
      </div>
      <SidebarNavLinks collapsed={false} onLinkClick={onNavigate} />
      <div className="mt-auto shrink-0 p-4">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/6 px-3 py-3 shadow-[0_8px_20px_rgba(7,16,48,0.18)]">
          <Link
            href="/profile"
            onClick={onNavigate}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/14 text-sm font-semibold text-white">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                initialsOf(displayName)
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-white">
                {displayName}
              </p>
              <p className="truncate text-sm text-white/68">{roleText}</p>
            </div>
            <ChevronsUpDown className="size-4 shrink-0 text-white/50" />
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 rounded-lg text-white/72 hover:bg-white/15 hover:text-white"
            onClick={() => {
              onNavigate()
              void logout()
            }}
            aria-label="Đăng xuất"
          >
            <LogOut aria-hidden className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

type SidebarProps = {
  collapsed: boolean
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { logout } = useAuth()
  const { siteName, siteDescription } = useSiteConfig()

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-[#1A2D65] bg-primary text-white transition-[width] duration-300 ease-out md:flex",
        collapsed ? "w-[4.5rem]" : "w-80"
      )}
    >
      <div
        className={cn(
          "shrink-0",
          collapsed ? "flex justify-center px-2 py-3" : "px-4 pt-5 pb-4"
        )}
      >
        <Link
          href="/"
          className={cn(
            "group flex transition-all duration-200 hover:bg-white/15",
            collapsed
              ? "justify-center rounded-lg p-2.5"
              : "items-center gap-3 rounded-lg px-2 py-2"
          )}
          title="Tổng quan"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/12 ring-1 ring-white/12 transition-transform duration-200 group-hover:scale-[1.03]">
            <ShieldCheck className="size-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-heading text-[1.7rem] font-bold tracking-tight text-white">
                {siteName}
              </p>
              <p className="truncate text-sm text-white/72">
                {siteDescription}
              </p>
            </div>
          )}
        </Link>
      </div>
      <SidebarNavLinks collapsed={collapsed} />
      <div className={cn("mt-auto shrink-0", collapsed ? "p-2" : "p-4")}>
        {collapsed ? (
          <Button
            type="button"
            title="Đăng xuất"
            aria-label="Đăng xuất"
            onClick={() => logout()}
            variant="ghost"
            className="size-10 rounded-lg text-white/72 hover:bg-white/15 hover:text-white"
          >
            <LogOut aria-hidden className="size-4" />
          </Button>
        ) : (
          <div className="align-center flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/6 shadow-[0_10px_24px_rgba(8,17,52,0.2)]">
            <Button
              type="button"
              aria-label="Đăng xuất"
              onClick={() => logout()}
              variant="ghost"
              className="h-full w-full px-3 py-3"
            >
              <LogOut aria-hidden className="size-4" />
              Đăng xuất
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}
