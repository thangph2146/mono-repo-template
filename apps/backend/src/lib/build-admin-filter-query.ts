import type { ColumnFiltersState } from "@tanstack/react-table"

export type FilterMapping = Record<
  string,
  string | ((value: unknown) => string | undefined)
>

export function normalizeAdminFilterValue(value: unknown): string | undefined {
  const normalized = String(value ?? "").trim()
  return normalized ? normalized : undefined
}

export function normalizeAdminFilterValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeAdminFilterValue(item))
      .filter((item): item is string => Boolean(item))
  }

  if (typeof value === "string" && value.includes(",")) {
    return value
      .split(",")
      .map((item) => normalizeAdminFilterValue(item))
      .filter((item): item is string => Boolean(item))
  }

  const normalized = normalizeAdminFilterValue(value)
  return normalized ? [normalized] : []
}

export function buildAdminFilterQuery(
  columnFilters: ColumnFiltersState,
  mapping: FilterMapping
): Record<string, string> {
  const query: Record<string, string> = {}
  for (const filter of columnFilters) {
    const value = normalizeAdminFilterValue(filter.value)
    if (!value) continue

    const mapper = mapping[filter.id]
    if (!mapper) continue

    if (typeof mapper === "function") {
      const mapped = mapper(value)
      const normalizedMapped = normalizeAdminFilterValue(mapped)
      if (normalizedMapped) {
        query[filter.id] = normalizedMapped
      }
    } else {
      query[mapper] = value
    }
  }
  return query
}

// Preset mappings for common patterns
export const COMMON_FILTER_MAPPINGS: Record<string, FilterMapping> = {
  // Posts
  posts: {
    title: "title",
    published: (v: unknown) =>
      v === "true" ? "true" : v === "false" ? "false" : undefined,
    categoryId: "categoryId",
    tagId: "tagId",
    updatedAt: "updatedAt",
  } as FilterMapping,

  // Users/Staff
  users: {
    fullName: "name",
    email: "email",
    phone: "phone",
    isActive: (v: unknown) => String(v),
  } as FilterMapping,

  // Tags
  tags: {
    name: "name",
    slug: "slug",
    deletedAt: "deletedAt",
    updatedAt: "updatedAt",
  } as FilterMapping,

  // Parent-students
  parentStudents: {
    status: "status",
    createdAt: "createdAt",
  } as FilterMapping,

  // Contact requests
  contactRequests: {
    name: "name",
    email: "email",
    phone: "phone",
    subject: "subject",
    content: "content",
    status: (v: unknown) => {
      const value = normalizeAdminFilterValue(v)
      if (value === "new") return "NEW"
      if (value === "in-progress") return "IN_PROGRESS"
      if (value === "resolved") return "RESOLVED"
      if (value === "archived") return "CLOSED"
      return value
    },
    priority: "priority",
    isRead: (v: unknown) => (v === "read" || v === "true" ? "true" : "false"),
  } as FilterMapping,
}
