/** Hàng import category: cha phải insert trước con (trùng logic seed-full-export). */
export type ImportRow = Record<string, unknown>;

/**
 * Bundle export cũ có key `heroSlide` (bảng legacy đã bỏ). Luôn xóa khỏi payload import.
 * Trả về số bản ghi đã bỏ (0 nếu không có key).
 */
export function stripLegacyHeroSlideFromBundle(
  data: Record<string, unknown>,
): number {
  const raw = data.heroSlide;
  delete data.heroSlide;
  return Array.isArray(raw) ? raw.length : 0;
}

/** Bỏ quyền `hero_slides:*` khỏi mảng permissions (resource đã gỡ khỏi hệ thống). */
export function stripHeroSlidesPermissions(permissions: unknown): unknown {
  if (!Array.isArray(permissions)) return permissions;
  return permissions.filter(
    (p) => typeof p !== 'string' || !String(p).startsWith('hero_slides:'),
  );
}

/** FK pivot: file cũ dùng postId/categoryId; export MikroORM serialize dùng post/category/tag (scalar hoặc { id }). */
function pivotFk(row: ImportRow, idProp: string, relProp: string): string {
  const direct = row[idProp];
  if (direct != null && direct !== '') return String(direct as string | number);
  const rel = row[relProp];
  if (rel == null || rel === '') return '';
  if (typeof rel === 'string' || typeof rel === 'number') return String(rel);
  if (typeof rel === 'object' && rel !== null && 'id' in rel) {
    const id = (rel as { id: unknown }).id;
    return id == null ? '' : String(id as string | number);
  }
  return '';
}

/** Lọc postCategory / postTag trỏ tới id không có trong cùng bundle (export/import JSON tự nhất quán). */
export function sanitizePivotRowsInExportJson(data: Record<string, unknown>): {
  droppedPostCategory: number;
  droppedPostTag: number;
} {
  const posts = data.post;
  const categories = data.category;
  const tags = data.tag;
  let droppedPostCategory = 0;
  let droppedPostTag = 0;
  if (!Array.isArray(posts) || !Array.isArray(categories)) {
    return { droppedPostCategory: 0, droppedPostTag: 0 };
  }
  const postIds = new Set(
    posts.map((p) => String((p as ImportRow).id)).filter(Boolean),
  );
  const categoryIds = new Set(
    categories.map((c) => String((c as ImportRow).id)).filter(Boolean),
  );
  const pcIn = data.postCategory;
  if (Array.isArray(pcIn)) {
    const before = pcIn.length;
    const next = pcIn.filter((pc) => {
      const row = pc as ImportRow;
      const pid = pivotFk(row, 'postId', 'post');
      const cid = pivotFk(row, 'categoryId', 'category');
      return pid && cid && postIds.has(pid) && categoryIds.has(cid);
    });
    data.postCategory = next;
    droppedPostCategory = before - next.length;
  }
  const ptIn = data.postTag;
  if (Array.isArray(tags) && Array.isArray(ptIn)) {
    const tagIds = new Set(
      tags.map((t) => String((t as ImportRow).id)).filter(Boolean),
    );
    const before = ptIn.length;
    const next = ptIn.filter((pt) => {
      const row = pt as ImportRow;
      const pid = pivotFk(row, 'postId', 'post');
      const tid = pivotFk(row, 'tagId', 'tag');
      return pid && tid && postIds.has(pid) && tagIds.has(tid);
    });
    data.postTag = next;
    droppedPostTag = before - next.length;
  }
  return { droppedPostCategory, droppedPostTag };
}

export function orderCategoryRowsForImport(rows: ImportRow[]): ImportRow[] {
  const pool = new Map<string, ImportRow>(
    rows.map((r) => [String(r.id), { ...r }]),
  );
  const result: ImportRow[] = [];
  const inserted = new Set<string>();
  let guard = 0;
  while (pool.size && guard++ < rows.length + 10) {
    let added = 0;
    for (const [id, row] of [...pool.entries()]) {
      const p = (row.parent ?? row.parentId) as string | null | undefined;
      if (!p || inserted.has(String(p))) {
        result.push(row);
        inserted.add(id);
        pool.delete(id);
        added++;
      }
    }
    if (added === 0) break;
  }
  for (const row of pool.values()) {
    row.parent = null;
    row.parentId = null;
    result.push(row);
  }
  return result;
}
