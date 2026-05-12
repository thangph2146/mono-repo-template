import { EntityRepository, type FilterQuery } from '@mikro-orm/core';

export interface GetOptionsColumnConfig {
  valueField: string;
  labelField?: string;
  searchField?: string;
}

export type GetOptionsConfig = Record<string, GetOptionsColumnConfig>;

function getColumnConfig(
  column: string,
  config: GetOptionsConfig,
): GetOptionsColumnConfig {
  const candidate = config[column] ?? config['*'];
  if (candidate) return candidate;

  return {
    valueField: column,
    labelField: column,
    searchField: column,
  };
}

export async function getOptionsFromModel<T extends object>(
  delegate: EntityRepository<T>,
  baseWhere: Record<string, unknown>,
  column: string,
  config: GetOptionsConfig,
  search?: string,
  limit = 50,
): Promise<Array<{ label: string; value: string }>> {
  const col = getColumnConfig(column, config);
  const valueField = col.valueField;
  const labelField = col.labelField ?? valueField;
  const searchField = col.searchField ?? labelField;

  const where = { ...(baseWhere as FilterQuery<T>) } as FilterQuery<T>;
  if (search?.trim()) {
    (where as Record<string, unknown>)[searchField] = {
      $like: `%${search.trim()}%`,
    };
  }

  const fields =
    valueField === labelField ? [valueField] : [valueField, labelField];

  const rows = await delegate.find(where, {
    fields: fields as any,
    orderBy: { [labelField]: 'ASC' } as any,
    limit,
  });

  if (valueField !== labelField) {
    const seen = new Set<string>();
    return rows
      .map((row: any) => {
        const value = row[valueField];
        const label = row[labelField];
        const normalizedValue = typeof value === 'string' ? value.trim() : '';
        const normalizedLabel =
          typeof label === 'string' ? label.trim() : normalizedValue;
        return normalizedValue
          ? {
              value: normalizedValue,
              label: normalizedLabel || normalizedValue,
            }
          : null;
      })
      .filter((item): item is { value: string; label: string } => item != null)
      .filter((item) => {
        if (seen.has(item.value)) return false;
        seen.add(item.value);
        return true;
      });
  }

  const seen = new Set<string>();
  return rows
    .map((row: any) => row[valueField] as string)
    .filter(
      (value): value is string =>
        typeof value === 'string' && value.trim() !== '',
    )
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    })
    .map((value) => ({ label: value, value }));
}
