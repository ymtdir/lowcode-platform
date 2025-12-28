import type { FilterFn } from '@tanstack/react-table';

/**
 * JavaScriptで表現可能な最大日付値
 * Date型で扱える最大のタイムスタンプ（8640000000000000ミリ秒）
 */
const MAX_DATE_VALUE = 8640000000000000;

/**
 * JavaScriptで表現可能な最小日付値
 */
const MIN_DATE_VALUE = 0;

/**
 * 日付プリセットの型
 */
export type DatePreset =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'custom';

/**
 * 日付フィルタの値の型
 */
export type DateFilterValue = {
  preset: DatePreset;
  startDate: Date | null;
  endDate: Date | null;
};

/**
 * 数値フィルタの値の型
 */
export type NumberFilterValue = {
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'range';
  value1: number | null;
  value2: number | null;
};

/**
 * セレクト/リレーションフィルタの値の型（文字列配列）
 */
export type SelectFilterValue = string[];

/**
 * チェックボックスフィルタの値の型
 */
export type CheckboxFilterValue = 'all' | 'checked' | 'unchecked';

/**
 * テキストフィルタ関数
 * 大文字小文字を区別せずに部分一致検索を行います
 */
export function createTextFilterFn<TData>(): FilterFn<TData> {
  return (row, columnId, filterValue) => {
    const value = row.getValue(columnId) as string | null;

    // フィルタ値の型チェック
    if (typeof filterValue !== 'string') {
      console.warn(
        `textFilterFn: Expected string filter value, got ${typeof filterValue}`
      );
      return true;
    }

    const search = filterValue;
    if (!search) return true;
    return (value || '').toLowerCase().includes(search.toLowerCase());
  };
}

/**
 * SELECTフィルタ関数
 * 指定された値のいずれかと完全一致するかチェックします
 */
export function createSelectFilterFn<TData>(): FilterFn<TData> {
  return (row, columnId, filterValue) => {
    const value = row.getValue(columnId) as string | null;

    // フィルタ値の型チェック
    if (!Array.isArray(filterValue)) {
      console.warn(
        `selectFilterFn: Expected SelectFilterValue, got ${typeof filterValue}`
      );
      return true;
    }

    const filter = filterValue as SelectFilterValue;
    if (!filter || filter.length === 0) return true;
    if (!value) return false;
    return filter.includes(value);
  };
}

/**
 * DATEフィルタ関数
 * 指定された日付範囲内かどうかをチェックします
 */
export function createDateFilterFn<TData>(): FilterFn<TData> {
  return (row, columnId, filterValue) => {
    const value = row.getValue(columnId) as Date | string | null;

    // フィルタ値の型チェック
    if (
      typeof filterValue !== 'object' ||
      filterValue === null ||
      !('startDate' in filterValue) ||
      !('endDate' in filterValue)
    ) {
      console.warn(
        `dateFilterFn: Expected DateFilterValue, got ${typeof filterValue}`
      );
      return true;
    }

    const filter = filterValue as DateFilterValue;

    if (!value) return false;
    if (!filter.startDate && !filter.endDate) return true;

    const date = new Date(value);
    const start = filter.startDate
      ? new Date(filter.startDate)
      : new Date(MIN_DATE_VALUE);
    const end = filter.endDate
      ? new Date(filter.endDate)
      : new Date(MAX_DATE_VALUE);

    // 時刻を正規化（開始日は0:00:00、終了日は23:59:59）
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return date >= start && date <= end;
  };
}

/**
 * NUMBERフィルタ関数（data-table用）
 * 数値の比較演算を行います
 */
export function createNumberFilterFn<TData>(): FilterFn<TData> {
  return (row, columnId, filterValue) => {
    const value = row.getValue(columnId) as number | null;

    // フィルタ値の型チェック
    if (
      typeof filterValue !== 'object' ||
      filterValue === null ||
      !('operator' in filterValue)
    ) {
      console.warn(
        `numberFilterFn: Expected NumberFilterValue, got ${typeof filterValue}`
      );
      return true;
    }

    const filter = filterValue as NumberFilterValue;

    if (value === null) return false;
    if (filter.value1 === null) return true;

    switch (filter.operator) {
      case 'eq':
        return value === filter.value1;
      case 'ne':
        return value !== filter.value1;
      case 'gt':
        return value > filter.value1;
      case 'gte':
        return value >= filter.value1;
      case 'lt':
        return value < filter.value1;
      case 'lte':
        return value <= filter.value1;
      case 'range':
        if (filter.value2 === null) return value >= filter.value1;
        return value >= filter.value1 && value <= filter.value2;
      default:
        return true;
    }
  };
}

/**
 * RELATIONフィルタ関数（data-table用）
 * 配列値もサポートするSELECT/RELATIONフィルタ
 */
export function createRelationFilterFn<TData>(): FilterFn<TData> {
  return (row, columnId, filterValue) => {
    const value = row.getValue(columnId) as string | string[] | null;

    // フィルタ値の型チェック
    if (!Array.isArray(filterValue)) {
      console.warn(
        `relationFilterFn: Expected SelectFilterValue, got ${typeof filterValue}`
      );
      return true;
    }

    const filter = filterValue as SelectFilterValue;
    if (!filter || filter.length === 0) return true;
    if (!value) return false;

    // 値が配列の場合、いずれかの要素がフィルタに含まれているかチェック
    if (Array.isArray(value)) {
      return value.some((v) => filter.includes(v));
    }
    return filter.includes(value);
  };
}

/**
 * CHECKBOXフィルタ関数（data-table用）
 * boolean値のフィルタ
 */
export function createCheckboxFilterFn<TData>(): FilterFn<TData> {
  return (row, columnId, filterValue) => {
    const value = row.getValue(columnId) as boolean;

    // フィルタ値の型チェック
    if (
      filterValue !== 'all' &&
      filterValue !== 'checked' &&
      filterValue !== 'unchecked'
    ) {
      console.warn(
        `checkboxFilterFn: Expected CheckboxFilterValue, got ${filterValue}`
      );
      return true;
    }

    const filter = filterValue as CheckboxFilterValue;

    if (filter === 'all') return true;
    if (filter === 'checked') return value === true;
    if (filter === 'unchecked') return value === false;
    return true;
  };
}
