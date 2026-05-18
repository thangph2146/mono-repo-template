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
    }
  }
  return query;
}
