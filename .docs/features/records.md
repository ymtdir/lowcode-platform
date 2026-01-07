# レコード管理

## 概要

レコードはテーブルに格納される実データ。各レコードは`data`フィールドにJSON形式でカラムIDをキー、値をバリューとして格納する。

## データモデル

```prisma
model Record {
  id          String   @id @default(cuid())
  tableId     String   // Itemテーブルへの参照（type='TABLE'のもの）
  data        Json     // 実際のデータ（{ [columnId]: value }形式）
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  table       Item     @relation(fields: [tableId], references: [id], onDelete: Cascade)
  createdBy   User     @relation(fields: [createdById], references: [id])

  @@index([tableId])
  @@index([createdById])
}
```

## データ形式

### dataフィールドの構造

```typescript
// Record.data の形式
type RecordData = {
  [columnId: string]: ColumnValue;
};

// 型ごとの値
type ColumnValue =
  | string // TEXT, TEXTAREA, DATE
  | number // NUMBER
  | string[] // SELECT (multiple)
  | string // SELECT (single)
  | string[] // RELATION (multiple)
  | string // RELATION (single)
  | null; // 空値
```

### 例

```json
{
  "clm1a2b3c4": "株式会社サンプル",
  "clm2d3e4f5": "03-1234-5678",
  "clm3g4h5i6": 100000,
  "clm4j5k6l7": "2025-11-23",
  "clm5m6n7o8": ["opt1", "opt3"],
  "clm6p7q8r9": "rec123abc"
}
```

## 実装状況

### 完了した機能

- [x] レコードの作成（`create-record.ts`）
- [x] レコードの一覧取得（`get-records.ts`）
- [x] レコードの更新（`update-record.ts`）
- [x] レコードの削除（`delete-record.ts`）
- [x] データバリデーション（型・必須チェック）
- [x] リレーションデータの取得・表示
- [x] Grid Viewでの表示・編集

### 未実装の機能

- [ ] レコードの検索・フィルタ
- [ ] レコードのソート
- [ ] レコードの一括編集
- [x] レコードの一括削除
- [ ] レコードの複製
- [ ] レコードの履歴管理
- [ ] レコードのエクスポート（CSV/Excel）
- [ ] レコードのインポート（CSV/Excel）
- [ ] ページネーション
- [ ] 仮想スクロール

## 主要なファイル

### API（Server Actions）

```
features/record/api/
├── __tests__/
│   ├── create-record.test.ts    # 9テスト
│   ├── get-records.test.ts      # 6テスト
│   ├── update-record.test.ts    # 9テスト
│   └── delete-record.test.ts    # 7テスト
├── create-record.ts
├── get-records.ts
├── update-record.ts
├── delete-record.ts
└── index.ts
```

### UIコンポーネント

```
features/table/components/
├── data-table.tsx               # TanStack Tableベースのグリッド
├── columns.tsx                  # カラム定義
├── cells/                       # セル表示コンポーネント
│   ├── date-cell.tsx
│   ├── number-cell.tsx
│   ├── relation-cell.tsx
│   ├── select-cell.tsx
│   ├── text-cell.tsx
│   └── textarea-cell.tsx
└── index.ts
```

### 型定義

```
features/record/
├── types/
│   ├── record.ts
│   └── index.ts
└── hooks/
    └── index.ts
```

## レコード操作の流れ

### 1. レコードの作成

```typescript
// Server Action
export async function createRecord(
  tableId: string,
  input: { data: RecordData }
) {
  // 1. 認証チェック
  const user = await getCurrentUser();

  // 2. テーブルの取得とスキーマチェック
  const table = await prisma.item.findUnique({ where: { id: tableId } });
  const tableMeta = getTableMeta(table.meta);

  // 3. データのバリデーション
  for (const column of tableMeta.schema.columns) {
    const value = input.data[column.id];

    // 必須チェック
    if (column.required && (value === null || value === undefined)) {
      return { error: `${column.name}は必須です` };
    }

    // 型チェック
    if (value !== null) {
      const validationResult = validateColumnValue(value, column.type);
      if (!validationResult.valid) {
        return { error: validationResult.error };
      }
    }
  }

  // 4. レコードを作成
  const record = await prisma.record.create({
    data: {
      tableId,
      data: input.data,
      createdById: user.id,
    },
  });

  revalidatePath(`/tables/${tableId}`);
  return { success: true, record };
}
```

### 2. レコードの一覧取得

```typescript
// Server Action
export async function getRecords(tableId: string) {
  // 1. 認証チェック
  const user = await getCurrentUser();

  // 2. レコード一覧を取得
  const records = await prisma.record.findMany({
    where: { tableId },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // 3. リレーションデータの解決（必要に応じて）
  const resolvedRecords = await resolveRelations(records, tableId);

  return { success: true, records: resolvedRecords };
}
```

### 3. レコードの更新

```typescript
// Server Action
export async function updateRecord(
  recordId: string,
  input: { data: Partial<RecordData> }
) {
  // 1. 認証チェック
  const user = await getCurrentUser();

  // 2. 既存レコードを取得
  const record = await prisma.record.findUnique({ where: { id: recordId } });

  // 3. テーブルのスキーマを取得してバリデーション
  const table = await prisma.item.findUnique({ where: { id: record.tableId } });
  const tableMeta = getTableMeta(table.meta);

  // 4. 更新データのバリデーション
  for (const [columnId, value] of Object.entries(input.data)) {
    const column = tableMeta.schema.columns.find((c) => c.id === columnId);
    if (!column) continue;

    if (column.required && (value === null || value === undefined)) {
      return { error: `${column.name}は必須です` };
    }

    if (value !== null) {
      const validationResult = validateColumnValue(value, column.type);
      if (!validationResult.valid) {
        return { error: validationResult.error };
      }
    }
  }

  // 5. レコードを更新（既存データとマージ）
  const existingData = record.data as RecordData;
  const updatedData = { ...existingData, ...input.data };

  const updatedRecord = await prisma.record.update({
    where: { id: recordId },
    data: { data: updatedData },
  });

  revalidatePath(`/tables/${record.tableId}`);
  return { success: true, record: updatedRecord };
}
```

### 4. レコードの削除

```typescript
// Server Action
export async function deleteRecord(recordId: string) {
  // 1. 認証チェック
  const user = await getCurrentUser();

  // 2. レコードを取得
  const record = await prisma.record.findUnique({ where: { id: recordId } });

  // 3. リレーション元チェック（このレコードを参照しているレコードがあるか）
  // ※現状は警告のみ、将来的には CASCADE 削除を検討

  // 4. レコードを削除
  await prisma.record.delete({ where: { id: recordId } });

  revalidatePath(`/tables/${record.tableId}`);
  return { success: true };
}
```

## バリデーション

### 型ごとのバリデーション

```typescript
function validateColumnValue(
  value: unknown,
  type: ColumnType
): { valid: boolean; error?: string } {
  switch (type) {
    case 'TEXT':
    case 'TEXTAREA':
      if (typeof value !== 'string') {
        return { valid: false, error: 'テキストを入力してください' };
      }
      return { valid: true };

    case 'NUMBER':
      if (typeof value !== 'number' || isNaN(value)) {
        return { valid: false, error: '数値を入力してください' };
      }
      return { valid: true };

    case 'DATE':
      if (typeof value !== 'string' || !isValidDate(value)) {
        return { valid: false, error: '有効な日付を入力してください' };
      }
      return { valid: true };

    case 'SELECT':
      if (Array.isArray(value)) {
        if (!value.every((v) => typeof v === 'string')) {
          return { valid: false, error: '選択肢が不正です' };
        }
      } else if (typeof value !== 'string') {
        return { valid: false, error: '選択肢を選んでください' };
      }
      return { valid: true };

    case 'RELATION':
      if (Array.isArray(value)) {
        if (!value.every((v) => typeof v === 'string')) {
          return { valid: false, error: 'リレーションIDが不正です' };
        }
      } else if (typeof value !== 'string') {
        return {
          valid: false,
          error: 'リレーションレコードを選択してください',
        };
      }
      return { valid: true };

    default:
      return { valid: false, error: '不明な型です' };
  }
}
```

### 必須チェック

```typescript
if (
  column.required &&
  (value === null || value === undefined || value === '')
) {
  return { error: `${column.name}は必須です` };
}
```

### カスタムバリデーション（将来実装）

- 最小値・最大値チェック（NUMBER）
- 文字数制限（TEXT, TEXTAREA）
- 日付範囲チェック（DATE）
- 正規表現マッチ（TEXT）

## リレーションデータの解決

### リレーション型カラムの場合

```typescript
// レコードID配列から実際のレコードデータを取得
async function resolveRelations(records: Record[], tableId: string) {
  const table = await prisma.item.findUnique({ where: { id: tableId } });
  const tableMeta = getTableMeta(table.meta);

  // リレーション型のカラムを抽出
  const relationColumns = tableMeta.schema.columns.filter(
    (col) => col.type === 'RELATION'
  );

  for (const record of records) {
    const data = record.data as RecordData;

    for (const column of relationColumns) {
      const relationIds = data[column.id];
      if (!relationIds) continue;

      const config = column.config as RelationConfig;

      // リレーション先のレコードを取得
      const relatedRecords = await prisma.record.findMany({
        where: {
          id: Array.isArray(relationIds) ? { in: relationIds } : relationIds,
          tableId: config.targetTableId,
        },
      });

      // 表示用の値を生成
      const displayValues = relatedRecords.map((r) => {
        const relatedData = r.data as RecordData;
        return relatedData[config.displayColumnId];
      });

      // data に解決済みの値を追加（UI表示用）
      data[`${column.id}_resolved`] = displayValues;
    }
  }

  return records;
}
```

## Grid Viewでの表示

### TanStack Tableによる実装

```typescript
// features/table/components/data-table.tsx
export function DataTable({ tableId, columns, data }: DataTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <ScrollArea className="w-full">
      <Table className="table-auto">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="min-w-[120px]">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
```

### セルコンポーネント

各カラム型に応じたセルコンポーネントを使用：

- `TextCell` - TEXT型
- `TextareaCell` - TEXTAREA型
- `NumberCell` - NUMBER型
- `DateCell` - DATE型
- `SelectCell` - SELECT型（単一/複数選択対応）
- `RelationCell` - RELATION型（単一/複数選択対応）

## 関連ドキュメント

- [テーブル管理](./tables.md)
- [カラム（フィールド）管理](./columns.md)
- [データベース設計](../architecture/database.md)
