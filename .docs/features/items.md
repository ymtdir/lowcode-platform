# Item管理（フォルダ・テーブル）

## 概要

ワークスペース機能として、フォルダとテーブルを統一的に管理。
Itemモデルを採用し、階層構造とドラッグ&ドロップを実現。

> **詳細なアーキテクチャ**: [item-model.md](../architecture/item-model.md) を参照

## 実装済み機能

### フォルダ管理

- [x] フォルダ作成・削除・名前変更
- [x] フォルダの階層構造（親子関係）
- [x] フォルダの並び替え（ドラッグ&ドロップ）
- [x] フォルダ内のテーブル管理

### テーブル管理

- [ ] テーブル一覧表示
- [x] テーブル作成
- [x] テーブル編集（名前変更）
- [x] テーブル削除

## ディレクトリ構成

```text
features/item/
├── api/
│   ├── __tests__/
│   │   ├── create-item.test.ts
│   │   ├── create-folder.test.ts
│   │   ├── delete-item.test.ts
│   │   ├── get-item-by-id.test.ts
│   │   ├── get-items.test.ts
│   │   ├── rename-item.test.ts
│   │   └── reorder-items.test.ts
│   ├── create-item.ts
│   ├── create-folder.ts
│   ├── create-table.ts
│   ├── delete-item.ts
│   ├── get-item-by-id.ts
│   ├── get-items.ts
│   ├── rename-item.ts
│   ├── reorder-items.ts
│   └── index.ts
├── constants/
│   ├── item-config.ts
│   └── index.ts
├── types/
│   ├── item.ts
│   └── index.ts
└── utils/
    ├── calculate-item-order.ts
    └── index.ts
```

## ItemType

| タイプ   | 説明     | 子要素   |
| -------- | -------- | -------- |
| `FOLDER` | フォルダ | 持てる   |
| `TABLE`  | テーブル | 持てない |

## Server Actions

| 関数           | 説明                     |
| -------------- | ------------------------ |
| `createItem`   | Item作成（汎用）         |
| `createFolder` | フォルダ作成（ラッパー） |
| `createTable`  | テーブル作成（ラッパー） |
| `deleteItem`   | Item削除                 |
| `getItems`     | Item一覧取得（階層構造） |
| `getItemById`  | Item詳細取得             |
| `renameItem`   | Item名変更               |
| `reorderItems` | Item並び替え             |

## UI（ワークスペースメニュー）

サイドバーに表示されるワークスペースメニュー。

- フォルダのネスト表示
- ドラッグ&ドロップで並び替え
- コンテキストメニュー（右クリック）
- ホバー時のアクションボタン

## テスト

| ファイル               | テスト数 | 内容                 |
| ---------------------- | -------- | -------------------- |
| create-item.test.ts    | 7        | アイテム作成         |
| create-folder.test.ts  | 2        | フォルダ作成ラッパー |
| delete-item.test.ts    | 5        | アイテム削除         |
| get-item-by-id.test.ts | 4        | アイテム個別取得     |
| get-items.test.ts      | 4        | アイテム一覧取得     |
| rename-item.test.ts    | 10       | アイテム名変更       |
| reorder-items.test.ts  | 4        | アイテム並び替え     |
| **合計**               | **36**   |                      |
