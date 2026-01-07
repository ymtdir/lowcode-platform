# カラム（フィールド）管理

## 概要

カラムはテーブルのスキーマを定義する要素。各カラムは型（TEXT、NUMBER、DATE等）を持ち、型ごとに異なる設定が可能。

## カラム型（ColumnType）

```typescript
export type ColumnType =
  | 'TEXT' // 1行テキスト
  | 'TEXTAREA' // 複数行テキスト
  | 'NUMBER' // 数値
  | 'DATE' // 日付
  | 'SELECT' // 選択肢（単一/複数）
  | 'RELATION'; // リレーション
```

## カラム定義

```typescript
type ColumnDefinition = {
  id: string; // 一意なID（cuid）
  name: string; // カラム名
  type: ColumnType; // カラム型
  required: boolean; // 必須フィールドか
  order: number; // 表示順序
  config: ColumnConfig; // 型固有の設定
};
```

## 型ごとの設定（ColumnConfig）

### TEXT / TEXTAREA

```typescript
type TextConfig = {
  placeholder?: string;
  maxLength?: number;
};
```

### NUMBER

```typescript
type NumberConfig = {
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  unit?: string;
  unitPosition?: 'prefix' | 'suffix';
  thousandSeparator?: boolean;
};
```

### DATE

```typescript
type DateConfig = {
  format?: 'date' | 'datetime' | 'time';
  placeholder?: string;
};
```

### SELECT

```typescript
type SelectConfig = {
  options: SelectOption[];
  allowMultiple: boolean;
};

type SelectOption = {
  id: string;
  label: string;
  color: string;
};
```

### RELATION

```typescript
type RelationConfig = {
  targetTableId: string;
  displayColumnId: string;
  allowMultiple: boolean;
};
```

## 実装状況

### 完了した機能

- [x] カラムの追加（`add-column.ts`）
- [x] カラムの更新（`update-column.ts`）
- [x] カラムの削除（`remove-column.ts`）
- [x] カラムの並び替え（`reorder-columns.ts`）
- [x] 全カラム型のサポート
- [x] 型ごとの設定エディタ
- [x] 型ごとのセルコンポーネント

### 未実装の機能

- [ ] カラムの複製機能
- [ ] カラムの履歴管理
- [ ] 計算フィールド（Formula型）
- [ ] ファイル添付フィールド
- [ ] カラムの一括編集

## 主要なファイル

### API（Server Actions）

```
features/column/api/
├── __tests__/
│   ├── add-column.test.ts       # 12テスト
│   ├── update-column.test.ts    # 10テスト
│   ├── remove-column.test.ts    # 10テスト
│   └── reorder-columns.test.ts  # 10テスト
├── add-column.ts
├── update-column.ts
├── remove-column.ts
├── reorder-columns.ts
└── index.ts
```

### UIコンポーネント

```
features/column/components/
├── config/                        # 型ごとの設定エディタ
│   ├── date-config-editor.tsx
│   ├── number-config-editor.tsx
│   ├── relation-config-editor.tsx
│   ├── select-config-editor.tsx
│   └── text-config-editor.tsx
└── index.ts
```

### セルコンポーネント

```
features/table/components/cells/
├── date-cell.tsx
├── number-cell.tsx
├── relation-cell.tsx
├── select-cell.tsx
├── text-cell.tsx
├── textarea-cell.tsx
└── index.ts
```

### 型定義・定数

```
features/column/
├── types/
│   ├── column.ts         # カラム型定義
│   └── index.ts
└── constants/
    ├── column-types.ts   # COLUMN_TYPES定義
    └── index.ts
```

## カラム操作の流れ

### 1. カラムの追加

```typescript
// Server Action
export async function addColumn(itemId: string, input: CreateColumnInput) {
  // 1. 認証チェック
  const user = await getCurrentUser();

  // 2. テーブルの取得
  const item = await prisma.item.findUnique({ where: { id: itemId } });

  // 3. スキーマに新しいカラムを追加
  const tableMeta = getTableMeta(item.meta);
  const newColumn: ColumnDefinition = {
    id: cuid(),
    name: input.name,
    type: input.type,
    required: input.required,
    order: tableMeta.schema.columns.length,
    config: input.config,
  };

  const updatedSchema = {
    ...tableMeta.schema,
    columns: [...tableMeta.schema.columns, newColumn],
  };

  // 4. metaを更新
  await prisma.item.update({
    where: { id: itemId },
    data: { meta: { ...tableMeta, schema: updatedSchema } },
  });

  return { success: true, column: newColumn };
}
```

### 2. カラムの更新

```typescript
// 名前、必須フラグ、config等を更新
export async function updateColumn(
  itemId: string,
  columnId: string,
  updates: Partial<ColumnDefinition>
) {
  // スキーマ内の該当カラムを更新
  const updatedColumns = tableMeta.schema.columns.map((col) =>
    col.id === columnId ? { ...col, ...updates } : col
  );

  // metaを更新
  await prisma.item.update({
    where: { id: itemId },
    data: { meta: { ...tableMeta, schema: { columns: updatedColumns } } },
  });
}
```

### 3. カラムの削除

```typescript
// カラムを削除（関連レコードのデータも削除）
export async function removeColumn(itemId: string, columnId: string) {
  // 1. スキーマからカラムを削除
  const updatedColumns = tableMeta.schema.columns.filter(
    (col) => col.id !== columnId
  );

  // 2. 全レコードから該当カラムのデータを削除
  const records = await prisma.record.findMany({ where: { tableId: itemId } });
  for (const record of records) {
    const data = record.data as Record<string, unknown>;
    delete data[columnId];
    await prisma.record.update({
      where: { id: record.id },
      data: { data },
    });
  }

  // 3. metaを更新
  await prisma.item.update({
    where: { id: itemId },
    data: { meta: { ...tableMeta, schema: { columns: updatedColumns } } },
  });
}
```

### 4. カラムの並び替え

```typescript
// orderフィールドを更新
export async function reorderColumns(
  itemId: string,
  columnId: string,
  newOrder: number
) {
  // orderを再計算
  const updatedColumns = tableMeta.schema.columns
    .map((col) => {
      if (col.id === columnId) {
        return { ...col, order: newOrder };
      }
      // 他のカラムのorderを調整
      return col;
    })
    .sort((a, b) => a.order - b.order);

  // metaを更新
  await prisma.item.update({
    where: { id: itemId },
    data: { meta: { ...tableMeta, schema: { columns: updatedColumns } } },
  });
}
```

## バリデーション

### カラム追加時

- カラム名が空でないこと
- カラム名が重複していないこと
- カラム型が有効な値であること
- config が型に応じた形式であること

### カラム更新時

- 必須フィールドに変更する場合、既存レコードに値が存在すること
- 型を変更する場合、既存データの変換可否をチェック

### カラム削除時

- リレーション元として使用されていないこと（警告表示）

## UIでの表示

### テーブルデザイン画面

- カラム一覧表示（ドラッグ&ドロップで並び替え）
- カラム追加ボタン
- 各カラムの編集・削除ボタン
- 型ごとの設定エディタ

### レコード画面

- カラム定義に基づいて動的にテーブルヘッダーを生成
- 型に応じたセルコンポーネントを表示
- 編集時は型に応じた入力コンポーネントを表示

## 関連ドキュメント

- [テーブル管理](./tables.md)
- [レコード管理](./records.md)
- [データベース設計](../architecture/database.md)
