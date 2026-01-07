# テーブル管理

## 概要

テーブルは業務データを格納する中核的な機能。ユーザーが自由にフィールド（カラム）を定義し、レコードを管理できる。

## データモデル

```prisma
model Item {
  id          String   @id @default(cuid())
  name        String
  type        ItemType // 'FOLDER' | 'TABLE'
  parentId    String?
  order       Int      @default(0)
  meta        Json?    // テーブルメタデータを格納
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  parent      Item?    @relation("ItemHierarchy", fields: [parentId], references: [id])
  children    Item[]   @relation("ItemHierarchy")
  createdBy   User     @relation(fields: [createdById], references: [id])
}
```

## テーブルメタデータ（meta）

テーブルの`meta`フィールドには以下の情報を格納：

```typescript
type TableMeta = {
  description?: string;
  schema: TableSchema;
};

type TableSchema = {
  columns: ColumnDefinition[];
};

type ColumnDefinition = {
  id: string;
  name: string;
  type: ColumnType;
  required: boolean;
  order: number;
  config: ColumnConfig; // 型ごとの設定
};
```

## 実装状況

### 完了した機能

- [x] テーブルの作成（Itemモデルとして）
- [x] テーブルの名前変更
- [x] テーブルの削除
- [x] テーブルの並び替え
- [x] 階層構造での管理（フォルダ配下に配置可能）

### カラム管理

- [x] カラムの追加（`add-column.ts`）
- [x] カラムの更新（`update-column.ts`）
- [x] カラムの削除（`remove-column.ts`）
- [x] カラムの並び替え（`reorder-columns.ts`）

### レコード管理

- [x] レコードの作成（`create-record.ts`）
- [x] レコードの一覧取得（`get-records.ts`）
- [x] レコードの更新（`update-record.ts`）
- [x] レコードの削除（`delete-record.ts`）

### 未実装の機能

- [ ] テーブル一覧画面（専用UI）
- [ ] テーブル詳細画面（メタデータ表示・編集）
- [ ] テーブル権限管理（グループごとのアクセス制御）
- [ ] テーブルのコピー機能
- [ ] テーブルのエクスポート/インポート

## 主要なファイル

### API（Server Actions）

- `features/item/api/create-item.ts` - 汎用Item作成（テーブル含む）
- `features/item/api/create-table.ts` - テーブル作成ラッパー
- `features/item/api/rename-item.ts` - テーブル名変更
- `features/item/api/delete-item.ts` - テーブル削除
- `features/item/api/reorder-items.ts` - テーブル並び替え

### カラム管理API

- `features/column/api/add-column.ts`
- `features/column/api/update-column.ts`
- `features/column/api/remove-column.ts`
- `features/column/api/reorder-columns.ts`

### レコード管理API

- `features/record/api/create-record.ts`
- `features/record/api/get-records.ts`
- `features/record/api/update-record.ts`
- `features/record/api/delete-record.ts`

### UIコンポーネント

- `features/table/components/data-table.tsx` - テーブルUI（TanStack Table）
- `features/table/components/columns.tsx` - カラム定義
- `features/table/components/cells/` - セル表示コンポーネント
- `features/layout/components/workspace-menu/` - ワークスペースメニュー

## 動的スキーマの仕組み

テーブルは固定スキーマではなく、`meta.schema`に格納された動的スキーマを使用：

1. **スキーマ定義**: `meta.schema.columns`にカラム定義を配列で格納
2. **データ格納**: レコードの`data`フィールドにJSONで格納（`{ [columnId]: value }`形式）
3. **バリデーション**: Server Actions内でスキーマに基づいてバリデーション
4. **UI生成**: スキーマに基づいて動的にフォーム・テーブルを生成

## 使用例

### テーブルの作成

```typescript
// ワークスペースメニューから「新しいテーブル」をクリック
// features/item/api/create-table.ts が呼ばれる
const formData = new FormData();
formData.set('name', '顧客マスタ');
formData.set('parentId', folderId); // フォルダID（オプション）

const result = await createTable(null, formData);
```

### カラムの追加

```typescript
// テーブルデザイン画面から「カラムを追加」
const result = await addColumn(tableId, {
  name: '会社名',
  type: 'TEXT',
  required: true,
  config: {},
});
```

### レコードの作成

```typescript
// テーブル画面から「新しいレコード」
const result = await createRecord(tableId, {
  data: {
    [columnId1]: '株式会社サンプル',
    [columnId2]: '03-1234-5678',
  },
});
```

## 関連ドキュメント

- [Itemモデルアーキテクチャ](../architecture/item-model.md)
- [カラム（フィールド）管理](./columns.md)
- [レコード管理](./records.md)
- [データベース設計](../architecture/database.md)
