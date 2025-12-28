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
 * 日付フィルタの値の型
 */
export type DateFilterValue = {
  preset?: string;
  startDate: Date | null;
  endDate: Date | null;
};

/**
 * 数値フィルタの値の型
 */
export type NumberFilterValue = {
  operator: string;
  value1: number | null;
  value2: number | null;
};

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
        `selectFilterFn: Expected array filter value, got ${typeof filterValue}`
      );
      return true;
    }

    const filter = filterValue as string[];
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
