import type { TagRow, TagTreeRow } from "./types";

export {
  slugify,
  unwrapApiEnvelope as unwrapEnvelope,
  normalizePagedResult as normalizePaged,
} from "@workspace/api-client";

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}

export function humanizeSlug(slug: string): string {
  return slug.split("-").filter(Boolean).join(" ");
}

export function sortTagsByName<T extends Pick<TagRow, "name">>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

function chooseTagGroupSlug(
  row: TagRow,
  prefixCounts: Map<string, number>,
): string | null {
  const segments = row.slug.split("-").filter(Boolean);
  const maxPrefixLength = Math.min(3, segments.length - 1);

  for (let length = maxPrefixLength; length >= 2; length -= 1) {
    const prefix = segments.slice(0, length).join("-");
    if ((prefixCounts.get(prefix) ?? 0) >= 2) {
      return prefix;
    }
  }

  if (segments.length > 1) {
    const rootPrefix = segments[0] ?? "";
    if ((prefixCounts.get(rootPrefix) ?? 0) >= 3) {
      return rootPrefix;
    }
  }

  return null;
}

export function buildTagTree(rows: TagRow[]): TagTreeRow[] {
  const prefixCounts = new Map<string, number>();

  for (const row of rows) {
    const segments = row.slug.split("-").filter(Boolean);
    const maxPrefixLength = Math.min(3, segments.length - 1);
    for (let length = 1; length <= maxPrefixLength; length += 1) {
      const prefix = segments.slice(0, length).join("-");
      prefixCounts.set(prefix, (prefixCounts.get(prefix) ?? 0) + 1);
    }
  }

  const grouped = new Map<string, TagRow[]>();
  const standalone: TagTreeRow[] = [];

  for (const row of rows) {
    const groupSlug = chooseTagGroupSlug(row, prefixCounts);
    if (!groupSlug) {
      standalone.push({ ...row });
      continue;
    }
    const bucket = grouped.get(groupSlug) ?? [];
    bucket.push(row);
    grouped.set(groupSlug, bucket);
  }

  const groupRows = Array.from(grouped.entries())
    .sort(([a], [b]) => humanizeSlug(a).localeCompare(humanizeSlug(b), "vi"))
    .map(([groupSlug, groupItems]) => ({
      id: `group:${groupSlug}`,
      name: humanizeSlug(groupSlug),
      slug: groupSlug,
      createdAt: "",
      updatedAt: "",
      deletedAt: null,
      isGroup: true,
      itemCount: groupItems.length,
      subRows: sortTagsByName(groupItems).map((item) => ({ ...item })),
    }));

  return [...groupRows, ...sortTagsByName(standalone)];
}

export function buildTagsFilterQuery(
  columnFilters: { id: string; value: unknown }[],
): Record<string, string> {
  const query: Record<string, string> = {};
  for (const filter of columnFilters) {
    const value = filter.value;
    if (value === undefined || value === null || value === "") continue;
    if (filter.id === "name") {
      query.name = String(value).trim();
    } else if (filter.id === "slug") {
      query.slug = String(value).trim();
    } else if (filter.id === "deletedAt" || filter.id === "updatedAt") {
      const v = String(value).trim();
      if (v) query[filter.id] = v;
    }
  }
  return query;
}

export function toFilterQuery(
  filters: Record<string, unknown>,
): Record<string, string | number | boolean | undefined | null> {
  return Object.fromEntries(
    Object.entries(filters).map(([key, value]) => [`filter[${key}]`, value as string | number | boolean | undefined | null]),
  );
}

async function _fetchPage(
  page: number,
  limit: number,
  status: string,
): Promise<{ items: TagRow[]; total: number }> {
  const { api } = await import("@/lib/api");
  return api.tags.list<TagRow>({ page, limit, status });
}

export async function fetchAllActiveTags(): Promise<TagRow[]> {
  const limit = 100;
  const items: TagRow[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (items.length < total) {
    const result = await _fetchPage(page, limit, "active");
    items.push(...result.items);
    total = result.total;
    if (result.items.length === 0) break;
    page += 1;
  }

  return items;
}
