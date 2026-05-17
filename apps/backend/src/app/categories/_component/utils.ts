import type {
  ApiEnvelope,
  CategoryTreeOption,
  PagedApiShape,
  PagedResult,
} from "./types";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildCategoryOptionTree(
  rows: CategoryTreeOption[]
): CategoryTreeOption[] {
  const byId = new Map<string, CategoryTreeOption>();

  for (const row of rows) {
    byId.set(row.id, {
      ...row,
      subRows: [],
    });
  }

  const roots: CategoryTreeOption[] = [];
  for (const row of byId.values()) {
    const parentId = row.parentId ?? null;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId)?.subRows?.push(row);
      continue;
    }
    roots.push(row);
  }

  const sortTree = (items: CategoryTreeOption[]): CategoryTreeOption[] =>
    [...items]
      .sort((a, b) => {
        const sortDelta = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        if (sortDelta !== 0) return sortDelta;
        return a.name.localeCompare(b.name, "vi");
      })
      .map((item) => ({
        ...item,
        subRows: sortTree(item.subRows ?? []),
      }));

  return sortTree(roots);
}

export function unwrapEnvelope<T>(payload: unknown): T {
  if (!payload || typeof payload !== "object") return payload as T;
  const envelope = payload as ApiEnvelope<T>;
  if (envelope.success === false) {
    throw new Error(envelope.message || envelope.error || "Yeu cau that bai");
  }
  return "data" in envelope ? (envelope.data as T) : (payload as T);
}

export function normalizePaged<T>(payload: unknown): PagedResult<T> {
  const data = unwrapEnvelope<PagedApiShape<T> | T[]>(payload);
  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }
  return {
    items: data.data ?? [],
    total: data.pagination?.total ?? data.data?.length ?? 0,
  };
}

export function buildCategoriesFilterQuery(
  filters: { id: string; value: unknown }[]
): Record<string, string> {
  const query: Record<string, string> = {};
  for (const filter of filters) {
    const { value } = filter;
    if (value === undefined || value === null || value === "") continue;

    if (filter.id === "parentId") {
      if (Array.isArray(value)) {
        const vals = value.map((v) => String(v)).filter(Boolean);
        if (vals.length) query.parentId = vals.join(",");
      } else if (typeof value === "string" && value.includes(",")) {
        const vals = value.split(",").map((v) => v.trim()).filter(Boolean);
        if (vals.length) query.parentId = vals.join(",");
      } else {
        const v = String(value).trim();
        if (v) query.parentId = v;
      }
    } else if (filter.id === "isActive") {
      if (Array.isArray(value)) {
        const vals = value.map((v) => String(v)).filter(Boolean);
        if (vals.length) query.isActive = vals.join(",");
      } else {
        const v = String(value).trim();
        if (v) query.isActive = v;
      }
    }
  }
  return query;
}

export function formatDateTime(value: string): string {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
  } catch {
    // Ignore
  }
  return "";
}
