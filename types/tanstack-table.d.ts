/**
 * TanStack Table型拡張
 * プロジェクト全体で使用するカラムメタ型を定義
 */
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** カラムの幅クラス（Tailwind CSS） */
    width?: string;
    /** カラムの表示名（ColumnVisibilityButtonで使用） */
    title?: string;
  }
}

export {};
