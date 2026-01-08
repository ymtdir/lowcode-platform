# グループ管理

## 概要

ユーザーをグループ化し、テーブル単位で権限を管理する機能。

## 実装済み機能

- [x] グループ作成・編集・削除
- [x] グループメンバー管理（追加・削除）
- [x] グループ一覧表示（Data Table）
- [x] 複数グループへの所属
- [ ] 権限の基本構造実装
- [ ] 権限チェック機能

## ディレクトリ構成

```text
features/group/
├── components/
│   ├── bulk-delete-button.tsx
│   ├── columns.tsx
│   ├── create-group-button.tsx
│   ├── delete-group-item.tsx
│   ├── edit-group-item.tsx
│   ├── group-table.tsx
│   ├── manage-members-item.tsx
│   ├── member-list.tsx
│   └── index.ts
├── api/
│   ├── __tests__/
│   │   ├── add-members.test.ts
│   │   ├── create-group.test.ts
│   │   ├── delete-group.test.ts
│   │   ├── get-group-by-id.test.ts
│   │   ├── get-groups.test.ts
│   │   ├── remove-members.test.ts
│   │   └── update-group.test.ts
│   ├── add-members.ts
│   ├── create-group.ts
│   ├── delete-group.ts
│   ├── get-group-by-id.ts
│   ├── get-groups.ts
│   ├── remove-members.ts
│   ├── update-group.ts
│   └── index.ts
└── types/
    ├── group.ts
    └── index.ts
```

## 権限レベル（テーブル単位）

| レベル  | 説明                               |
| ------- | ---------------------------------- |
| `none`  | アクセス不可                       |
| `read`  | 閲覧のみ                           |
| `write` | 閲覧・作成・編集                   |
| `admin` | すべての操作（削除・権限設定含む） |

## データモデル

### Group

- `id`: グループID
- `name`: グループ名
- `description`: 説明（任意）
- `members`: グループメンバー（GroupMember[]）
- `permissions`: テーブル権限（TablePermission[]）

### GroupMember

- `userId`: ユーザーID
- `groupId`: グループID
- ユニーク制約: `[userId, groupId]`

### TablePermission

- `tableId`: テーブルID
- `groupId`: グループID
- `level`: 権限レベル（Permission enum）

## Server Actions

| 関数            | 説明             |
| --------------- | ---------------- |
| `createGroup`   | グループ作成     |
| `updateGroup`   | グループ更新     |
| `deleteGroup`   | グループ削除     |
| `getGroups`     | グループ一覧取得 |
| `getGroupById`  | グループ詳細取得 |
| `addMembers`    | メンバー追加     |
| `removeMembers` | メンバー削除     |

## UI コンポーネント

### GroupTable

TanStack Tableを使用したデータテーブル。

- ソート
- フィルタ
- 一括選択・削除
- 行アクション（編集・削除・メンバー管理）

## テスト

| ファイル                | テスト数 | 内容             |
| ----------------------- | -------- | ---------------- |
| add-members.test.ts     | 5        | メンバー追加     |
| create-group.test.ts    | 7        | グループ作成     |
| delete-group.test.ts    | 2        | グループ削除     |
| get-group-by-id.test.ts | 3        | グループ詳細取得 |
| get-groups.test.ts      | 3        | グループ一覧取得 |
| remove-members.test.ts  | 6        | メンバー削除     |
| update-group.test.ts    | 7        | グループ更新     |
| **合計**                | **33**   |                  |
