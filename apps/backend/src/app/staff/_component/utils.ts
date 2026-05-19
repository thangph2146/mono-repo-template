import type { ColumnFiltersState } from "@tanstack/react-table";

export function buildUsersFilterQuery(
  columnFilters: ColumnFiltersState
): Record<string, string> {
  const query: Record<string, string> = {};
  for (const filter of columnFilters) {
    const value = String(filter.value ?? "").trim();
    if (!value) continue;
    if (filter.id === "fullName") query.name = value;
    else if (filter.id === "email") query.email = value;
    else if (filter.id === "isActive") query.isActive = value;
  }
  return query;
}
