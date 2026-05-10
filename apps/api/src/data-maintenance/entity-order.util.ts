import type { EntityMetadata } from '@mikro-orm/core';
import { ReferenceKind } from '@mikro-orm/core';

/**
 * Sắp xếp entity theo phụ thuộc ManyToOne (bảng được trỏ tới trước, bảng có FK sau)
 * để INSERT an toàn. Chỉ dựa metadata MikroORM — không hard-code tên bảng.
 */
export function sortEntityMetasForImport(
  metas: EntityMetadata[],
): EntityMetadata[] {
  const inScope = new Set(metas.map((m) => m.className));
  const indegree = new Map<string, number>();
  const dependents = new Map<string, Set<string>>();

  for (const m of metas) {
    indegree.set(m.className, 0);
    dependents.set(m.className, new Set());
  }

  for (const m of metas) {
    for (const rel of Object.values(m.relations)) {
      if (rel.kind !== ReferenceKind.MANY_TO_ONE) {
        continue;
      }
      const targetName = rel.targetMeta?.className;
      if (!targetName || !inScope.has(targetName)) {
        continue;
      }
      indegree.set(m.className, (indegree.get(m.className) ?? 0) + 1);
      dependents.get(targetName)!.add(m.className);
    }
  }

  const queue = metas.filter((m) => (indegree.get(m.className) ?? 0) === 0);
  const result: EntityMetadata[] = [];

  while (queue.length > 0) {
    const m = queue.shift()!;
    result.push(m);
    for (const dep of dependents.get(m.className) ?? []) {
      const next = indegree.get(dep)! - 1;
      indegree.set(dep, next);
      if (next === 0) {
        const meta = metas.find((x) => x.className === dep);
        if (meta) queue.push(meta);
      }
    }
  }

  if (result.length !== metas.length) {
    const remaining = metas.filter((m) => !result.includes(m));
    throw new Error(
      `Chu trình phụ thuộc FK giữa các entity: không thể sắp xếp. Gồm: ${remaining.map((m) => m.className).join(', ')}`,
    );
  }

  return result;
}

export function reverseOrder<T>(items: T[]): T[] {
  return [...items].reverse();
}
