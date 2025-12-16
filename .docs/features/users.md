# ユーザー管理

## 概要

ユーザーの作成、編集、削除を管理する機能。

## 実装済み機能

- [x] ユーザー作成（Admin権限）
- [x] ユーザー一覧表示（Data Table）
- [x] プロフィール編集（名前）
- [x] パスワード変更
- [x] ユーザー削除
- [x] ロール設定（Admin/Member）

## ディレクトリ構成

```
features/user/
├── components/
│   ├── bulk-delete-button.tsx
│   ├── columns.tsx
│   ├── create-user-button.tsx
│   ├── delete-user-item.tsx
│   ├── edit-user-item.tsx
│   ├── user-table.tsx
│   └── index.ts
├── api/
│   ├── __tests__/
│   │   ├── create-user.test.ts
│   │   ├── delete-user.test.ts
│   │   ├── get-users.test.ts
│   │   ├── update-user-password.test.ts
│   │   └── update-user-profile.test.ts
│   ├── create-user.ts
│   ├── delete-user.ts
│   ├── get-users.ts
│   ├── update-user-password.ts
│   ├── update-user-profile.ts
│   └── index.ts
└── types/
    ├── user.ts
    └── index.ts
```

## データモデル

### User

- `id`: ユーザーID（cuid）
- `email`: メールアドレス（ユニーク）
- `name`: 表示名（任意）
- `role`: ロール（Admin/Member）
- `groupMembers`: 所属グループ
- `tables`: 作成したテーブル
- `records`: 作成したレコード

## Server Actions

| 関数                 | 説明                          |
| -------------------- | ----------------------------- |
| `createUser`         | ユーザー作成（Admin権限必要） |
| `deleteUser`         | ユーザー削除（Admin権限必要） |
| `getUsers`           | ユーザー一覧取得              |
| `updateUserProfile`  | プロフィール更新              |
| `updateUserPassword` | パスワード変更                |

## UI コンポーネント

### UserTable

TanStack Tableを使用したデータテーブル。

- ソート
- フィルタ
- 一括選択・削除
- 行アクション（編集・削除）

## 権限

- **ユーザー作成**: Adminのみ
- **ユーザー削除**: Adminのみ
- **プロフィール編集**: 自分自身またはAdmin
- **パスワード変更**: 自分自身またはAdmin

## テスト

| ファイル                     | テスト数 | 内容             |
| ---------------------------- | -------- | ---------------- |
| create-user.test.ts          | 7        | ユーザー作成     |
| delete-user.test.ts          | 2        | ユーザー削除     |
| get-users.test.ts            | 3        | ユーザー一覧取得 |
| update-user-password.test.ts | 5        | パスワード更新   |
| update-user-profile.test.ts  | 4        | プロフィール更新 |
| **合計**                     | **21**   |                  |
