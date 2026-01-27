# 認証機能

## 概要

NextAuth.js v5（Credentials Provider）を使用したメール/パスワード認証を実装。

## 実装済み機能

- [x] ログイン・ログアウト
- [x] セッション管理（JWT方式）
- [x] 認証状態の保護（ミドルウェア）
- [x] ユーザーロール設定（ADMIN/DEVELOPER/MEMBER）
- [x] 認証フォームのコンポーネント化
- [x] パスワードハッシュ化（bcryptjs）
- [x] Prismaでのユーザー管理

## ディレクトリ構成

```text
features/auth/
├── components/
│   ├── login-form.tsx
│   ├── signup-form.tsx
│   └── index.ts
├── api/
│   ├── __tests__/
│   │   ├── login.test.ts
│   │   ├── signup.test.ts
│   │   └── logout.test.ts
│   ├── login.ts
│   ├── logout.ts
│   ├── signup.ts
│   └── index.ts
└── types/
    └── auth.ts
```

## ユーザーロール

### ADMIN

- すべての操作が可能
- ユーザー管理、グループ管理
- システム設定の変更
- 他ユーザーのパスワード・プロフィール変更

### DEVELOPER

- テーブル/フォルダ構造の管理
- カラム、スタイル、スクリプトの管理
- レコードの作成・編集・削除

### MEMBER

- 権限が付与されたアイテムへのアクセス
- レコードの閲覧・編集（権限に応じて）
- 自身のプロフィール・パスワード変更

## 認証フロー

### ログイン

1. ユーザーがメール/パスワードを入力
2. NextAuth Credentials Providerで認証
   - Prismaでメールアドレスからユーザーを検索
   - bcryptjsでパスワードを検証
3. JWT形式のセッションを作成
4. ダッシュボード（`/`）にリダイレクト

### ログアウト

1. NextAuthの`signOut()`を呼び出し
2. セッションCookieを削除
3. ログイン画面（`/login`）にリダイレクト

### ゲストログイン

1. 「ゲストとしてログイン」ボタンをクリック
2. ゲスト用の固定アカウント（`guest@example.com`）で自動ログイン
3. ダッシュボードにリダイレクト

## 認証ヘルパー関数

### `requireAuth()`

認証が必須の処理で使用。未認証の場合はエラーをスロー。

```typescript
const currentUser = await requireAuth();
// currentUser: { id, email, name, role }
```

### `getCurrentUser()`

認証状態を確認する場合に使用。未認証の場合は`null`を返す。

```typescript
const currentUser = await getCurrentUser();
if (!currentUser) {
  return { error: '認証が必要です' };
}
```

## ミドルウェア

`/login`以外のすべてのルートで認証が必要。
未認証ユーザーは`/login`にリダイレクト。

## テスト

| ファイル       | テスト数 | 内容             |
| -------------- | -------- | ---------------- |
| login.test.ts  | 6        | ログイン機能     |
| logout.test.ts | 2        | ログアウト機能   |
| guest-login.test.ts | 2   | ゲストログイン   |
| **合計**       | **10**   |                  |
