import { normalizeAdminFilterValues } from "@/lib";

export {
  slugify,
  formatDateTime,
  buildCategoryOptionTree,
  unwrapApiEnvelope as unwrapEnvelope,
  normalizePagedResult as normalizePaged,
  type CategoryTreeNode,
} from "@workspace/api-client";

export function buildCategoriesFilterQuery(
  filters: { id: string; value: unknown }[]
): Record<string, string> {
  const query: Record<string, string> = {};
  for (const filter of filters) {
    if (filter.id !== "parentId") continue;

    const values = normalizeAdminFilterValues(filter.value);
    if (values.length) query.parentId = values.join(",");
  }
  return query;
}
