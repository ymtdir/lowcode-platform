export * from './group';

// TanStack Tableのメタ型を拡張
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    width?: string;
  }
}
