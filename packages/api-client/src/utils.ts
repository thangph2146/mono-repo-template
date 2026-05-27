/**
 * Shared utilities used by both backend admin UI and other consumers.
 * Platform-agnostic helpers (no React / no DOM assumptions).
 */

export interface PagedResult<T> {
  items: T[];
  total: number;
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  parentId?: string | null;
  sortOrder?: number;
  subRows?: CategoryTreeNode[];
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

export function buildCategoryOptionTree(
  rows: CategoryTreeNode[]
): CategoryTreeNode[] {
  const byId = new Map<string, CategoryTreeNode>();

  for (const row of rows) {
    byId.set(row.id, {
      ...row,
      subRows: [],
    });
  }

  const roots: CategoryTreeNode[] = [];
  for (const row of byId.values()) {
    const parentId = row.parentId ?? null;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId)?.subRows?.push(row);
      continue;
    }
    roots.push(row);
  }

  const sortTree = (items: CategoryTreeNode[]): CategoryTreeNode[] =>
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
