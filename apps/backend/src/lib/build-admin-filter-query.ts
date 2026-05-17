import type { ColumnFiltersState } from "@tanstack/react-table";

export type FilterMapping = Record<string, string | ((value: unknown) => string | undefined)>;

export function buildAdminFilterQuery(
  columnFilters: ColumnFiltersState,
  mapping: FilterMapping
): Record<string, string> {
  const query: Record<string, string> = {};
  for (const filter of columnFilters) {
    const value = filter.value;
    if (value == null || value === "") continue;

    const mapper = mapping[filter.id];
    if (!mapper) continue;

    if (typeof mapper === "function") {
      const mapped = mapper(value);
      if (mapped != null && mapped !== "") {
        query[filter.id] = mapped;
      }
    } else {
      query[mapper] = String(value).trim();
    }
  }
  return query;
}

// Preset mappings for common patterns
export const COMMON_FILTER_MAPPINGS: Record<string, FilterMapping> = {
  // Posts
  posts: {
    title: "title",
    published: (v: unknown) => (v === "true" ? "true" : v === "false" ? "false" : undefined),
    categoryId: "categoryId",
    tagId: "tagId",
  } as FilterMapping,

  // Users/Staff
  users: {
    fullName: "name",
    email: "email",
    isActive: (v: unknown) => String(v),
  } as FilterMapping,

  // Contact requests
  contactRequests: {
    name: "name",
    phone: "phone",
    subject: "subject",
    status: "status",
    priority: "priority",
    isRead: (v: unknown) => (v === "read" ? "true" : "false"),
  } as FilterMapping,
};
