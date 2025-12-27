import type { Prisma } from '@prisma/client';
import type { ExportColumnFilter } from '../types/export';

/**
 * 数値フィルタの値型
 */
type NumberFilterValue = {
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'range';
  value1: number | null;
  value2: number | null;
};

/**
 * 日付フィルタの値型
 */
type DateFilterValue = {
  preset: string;
  startDate: string | null;
  endDate: string | null;
};

/**
 * TanStack TableのフィルタをPrisma WHERE条件に変換
 * 動的カラムはJSONフィールドとして検索
 */
export function convertFiltersToPrismaWhere(
  filters: ExportColumnFilter[]
): Prisma.RecordWhereInput {
  if (!filters || filters.length === 0) {
    return {};
  }

  const conditions: Prisma.RecordWhereInput[] = filters
    .map((filter) => {
      const { id, value } = filter;

      // 空文字列や空配列の場合はフィルタしない
      if (value === '' || (Array.isArray(value) && value.length === 0)) {
        return null;
      }

      // テキストフィルタ: string
      if (typeof value === 'string' && value.trim() !== '') {
        return {
          data: {
            path: [id],
            string_contains: value,
          },
        } as Prisma.RecordWhereInput;
      }

      // 数値フィルタ: NumberFilterValue
      if (isNumberFilterValue(value)) {
        return convertNumberFilter(id, value);
      }

      // 日付フィルタ: DateFilterValue
      if (isDateFilterValue(value)) {
        return convertDateFilter(id, value);
      }

      // 選択肢フィルタ (SELECT/RELATION): string[]
      if (Array.isArray(value) && value.length > 0) {
        return {
          OR: value.map((v) => ({
            data: {
              path: [id],
              equals: v,
            },
          })),
        } as Prisma.RecordWhereInput;
      }

      // チェックボックスフィルタ: 'all' | 'checked' | 'unchecked'
      if (value === 'checked') {
        return {
          data: {
            path: [id],
            equals: true,
          },
        } as Prisma.RecordWhereInput;
      }
      if (value === 'unchecked') {
        return {
          data: {
            path: [id],
            equals: false,
          },
        } as Prisma.RecordWhereInput;
      }

      // 'all' の場合はフィルタしない
      return null;
    })
    .filter(
      (condition): condition is Prisma.RecordWhereInput => condition !== null
    );

  if (conditions.length === 0) {
    return {};
  }

  return { AND: conditions };
}

/**
 * 型ガード: NumberFilterValue
 */
function isNumberFilterValue(value: unknown): value is NumberFilterValue {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    'operator' in v &&
    typeof v.operator === 'string' &&
    'value1' in v &&
    'value2' in v
  );
}

/**
 * 型ガード: DateFilterValue
 */
function isDateFilterValue(value: unknown): value is DateFilterValue {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    'preset' in v &&
    typeof v.preset === 'string' &&
    'startDate' in v &&
    'endDate' in v
  );
}

/**
 * 数値フィルタをPrisma条件に変換
 */
function convertNumberFilter(
  id: string,
  value: NumberFilterValue
): Prisma.RecordWhereInput | null {
  const { operator, value1, value2 } = value;

  // 値が入力されていない場合はフィルタしない
  if (value1 === null && operator !== 'range') {
    return null;
  }

  switch (operator) {
    case 'eq':
      return {
        data: {
          path: [id],
          equals: value1,
        },
      } as Prisma.RecordWhereInput;

    case 'ne':
      return {
        data: {
          path: [id],
          not: value1,
        },
      } as Prisma.RecordWhereInput;

    case 'gt':
      return {
        data: {
          path: [id],
          gt: value1,
        },
      } as Prisma.RecordWhereInput;

    case 'gte':
      return {
        data: {
          path: [id],
          gte: value1,
        },
      } as Prisma.RecordWhereInput;

    case 'lt':
      return {
        data: {
          path: [id],
          lt: value1,
        },
      } as Prisma.RecordWhereInput;

    case 'lte':
      return {
        data: {
          path: [id],
          lte: value1,
        },
      } as Prisma.RecordWhereInput;

    case 'range':
      if (value1 === null && value2 === null) {
        return null;
      }
      const rangeConditions: Prisma.RecordWhereInput[] = [];
      if (value1 !== null) {
        rangeConditions.push({
          data: {
            path: [id],
            gte: value1,
          },
        } as Prisma.RecordWhereInput);
      }
      if (value2 !== null) {
        rangeConditions.push({
          data: {
            path: [id],
            lte: value2,
          },
        } as Prisma.RecordWhereInput);
      }
      return {
        AND: rangeConditions,
      } as Prisma.RecordWhereInput;

    default:
      return null;
  }
}

/**
 * 日付フィルタをPrisma条件に変換
 */
function convertDateFilter(
  id: string,
  value: DateFilterValue
): Prisma.RecordWhereInput | null {
  const { startDate, endDate } = value;

  // 日付が入力されていない場合はフィルタしない
  if (!startDate && !endDate) {
    return null;
  }

  const dateConditions: Prisma.RecordWhereInput[] = [];

  if (startDate) {
    dateConditions.push({
      data: {
        path: [id],
        gte: startDate,
      },
    } as Prisma.RecordWhereInput);
  }

  if (endDate) {
    dateConditions.push({
      data: {
        path: [id],
        lte: endDate,
      },
    } as Prisma.RecordWhereInput);
  }

  if (dateConditions.length === 0) {
    return null;
  }

  return {
    AND: dateConditions,
  } as Prisma.RecordWhereInput;
}

/**
 * TanStack TableのソートをPrisma ORDER BY条件に変換
 *
 * 注意: PrismaはJSONフィールドの動的ソートをサポートしていないため、
 * ソートはクライアント側でのみ実行されます。
 * サーバー側では createdAt でソートして全データを返します。
 */
export function convertSortingToPrismaOrderBy(): Prisma.RecordOrderByWithRelationInput[] {
  // PrismaはJSONフィールドの動的ソートをサポートしていないため、
  // 空配列を返してデフォルトソート（createdAt）を使用
  return [];
}
