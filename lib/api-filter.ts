/**
 * レコードAPI用フィルタパーサー
 *
 * 構文: `?filter=col1:eq:value,col2:gt:100`
 * 複数条件はカンマ区切りで AND 結合
 *
 * 対応演算子:
 * - eq  : 等しい
 * - neq : 等しくない
 * - gt  : より大きい
 * - gte : 以上
 * - lt  : より小さい
 * - lte : 以下
 * - contains : 部分一致（文字列のみ）
 */

export const FILTER_OPERATORS = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
] as const;

export type FilterOperator = (typeof FILTER_OPERATORS)[number];

export type FilterCondition = {
  field: string;
  operator: FilterOperator;
  value: string | number;
};

export type FilterParseResult =
  | { ok: true; conditions: FilterCondition[] }
  | { ok: false; error: string };

/**
 * フィルタクエリ文字列をパースして条件配列に変換する
 *
 * @param filterParam - クエリパラメータの値（例: "col1:eq:hello,col2:gt:100"）
 * @returns パース結果（ok=true なら conditions, ok=false なら error）
 */
export function parseFilter(filterParam: string): FilterParseResult {
  if (!filterParam.trim()) {
    return { ok: true, conditions: [] };
  }

  const conditions: FilterCondition[] = [];
  const parts = filterParam.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // "field:operator:value" の形式を解析（valueにコロンが含まれる場合を考慮）
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) {
      return {
        ok: false,
        error: `フィルタの形式が不正です: "${trimmed}" - "field:operator:value" 形式で指定してください`,
      };
    }

    const field = trimmed.slice(0, colonIdx);
    const rest = trimmed.slice(colonIdx + 1);

    const secondColonIdx = rest.indexOf(':');
    if (secondColonIdx === -1) {
      return {
        ok: false,
        error: `フィルタの形式が不正です: "${trimmed}" - "field:operator:value" 形式で指定してください`,
      };
    }

    const operator = rest.slice(0, secondColonIdx);
    const rawValue = rest.slice(secondColonIdx + 1);

    // フィールド名バリデーション（英数字・アンダースコアのみ）
    if (!/^[a-zA-Z0-9_]+$/.test(field)) {
      return {
        ok: false,
        error: `フィルタのフィールド名が不正です: "${field}"`,
      };
    }

    // 演算子バリデーション
    if (!FILTER_OPERATORS.includes(operator as FilterOperator)) {
      return {
        ok: false,
        error: `未対応の演算子です: "${operator}" - 使用可能: ${FILTER_OPERATORS.join(', ')}`,
      };
    }

    // 値の型変換（数値文字列は数値に変換）
    const value =
      rawValue === ''
        ? ''
        : isNaN(Number(rawValue))
          ? rawValue
          : Number(rawValue);

    conditions.push({
      field,
      operator: operator as FilterOperator,
      value,
    });
  }

  return { ok: true, conditions };
}

/**
 * フィルタ条件をPrismaのJSON path whereクエリに変換する
 *
 * Recordの data フィールド（JSON型）に対して条件を適用する
 */
export function buildPrismaFilter(conditions: FilterCondition[]): object[] {
  return conditions.map(({ field, operator, value }) => {
    const path = ['$', field];

    switch (operator) {
      case 'eq':
        return { data: { path, equals: value } };
      case 'neq':
        return { NOT: { data: { path, equals: value } } };
      case 'gt':
        return { data: { path, gt: value } };
      case 'gte':
        return { data: { path, gte: value } };
      case 'lt':
        return { data: { path, lt: value } };
      case 'lte':
        return { data: { path, lte: value } };
      case 'contains':
        return {
          data: {
            path,
            string_contains: String(value),
          },
        };
    }
  });
}
