# Lowcode Platform

Next.js製の業務アプリケーションプラットフォーム

## 概要

ノーコード/ローコードで業務アプリを構築できるWebサービス。
使い心地はNotionやExcelのように直感的だが、PleasanterやKintoneのように自在にテーブルを作成し、様々な業務情報を管理できる。

## 開発理由

- ユーザーが自由にアプリケーションを構築できる基盤を開発してみたい
- 既存のローコードアプリケーションよりも柔軟なカスタマイズ機能を持たせたい

## 技術スタック

- **フロントエンド・バックエンド**: Next.js 16.0.0 (App Router with Turbopack)
- **データベース**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **認証**: Supabase Auth（メール/パスワード認証のみ）
- **ストレージ**: Supabase Storage（ファイルアップロード用）
- **リアルタイム**: Supabase Realtime（複数人編集用）
- **UI**: shadcn/ui + Tailwind CSS
- **テスト**: Jest with next/jest
- **コードエディタ**: Monaco Editor（ブラウザ上のコードエディタUI）
- **スクリプト実行**: vm2（サーバーサイド）/ サンドボックス（クライアント）
- **デプロイ**: Vercel

## 環境変数

```.env.local
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database（Prisma）
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Next.js
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

## アーキテクチャ方針

### Server-First Architecture

Next.jsのベストプラクティスに従い、**基本的にサーバーサイドで処理を行う**設計とする。

#### 1. Server Componentsを優先

- デフォルトでServer Componentsを使用
- クライアント側の処理が必要な場合のみ`'use client'`を使用
- データフェッチは可能な限りサーバー側で実行

```typescript
// ✅ Good: Server Component（デフォルト）
// app/tables/page.tsx
export default async function TablesPage() {
  // サーバー側でデータ取得
  const tables = await prisma.table.findMany();

  return <TableList tables={tables} />;
}

// ❌ Bad: クライアントでデータ取得
'use client';
export default function TablesPage() {
  const [tables, setTables] = useState([]);
  useEffect(() => {
    fetch('/api/tables').then(/* ... */);
  }, []);
}
```

#### 2. Server Actionsの活用

- フォーム送信やデータ更新はServer Actionsを使用
- API Routesの代わりにServer Actionsを優先

```typescript
// app/tables/actions.ts
'use server';

export async function createTable(formData: FormData) {
  const name = formData.get('name') as string;

  const table = await prisma.table.create({
    data: { name, schema: {} },
  });

  revalidatePath('/tables');
  return table;
}
```

#### 3. データフェッチの原則

- ページコンポーネント（`page.tsx`）でデータを取得
- 子コンポーネントにはPropsで渡す
- APIを経由せず、直接DBアクセス（Prisma）

```typescript
// ✅ Good: ページでデータ取得
// app/tables/[tableId]/page.tsx
export default async function TableDetailPage({ params }) {
  const table = await prisma.table.findUnique({
    where: { id: params.tableId },
    include: { records: true }
  });

  return <TableDetail table={table} />;
}
```

#### 4. Client Componentの使用基準

以下の場合のみ`'use client'`を使用：

- インタラクティブなUI（onClick, onChange等のイベントハンドラ）
- ブラウザAPIの使用（localStorage, window等）
- Reactのフック（useState, useEffect等）
- リアルタイム更新（Supabase Realtime）

```typescript
// features/record/components/RecordForm/RecordForm.tsx
'use client';

import { useState } from 'react';

export function RecordForm({ fields, onSubmit }) {
  const [formData, setFormData] = useState({});

  // インタラクティブな処理はクライアント側
  return <form>...</form>;
}
```

#### 5. API Routesの使用場面

Server Actionsで対応できない場合のみAPI Routesを使用：

- 外部Webhook受信
- 外部APIへのプロキシ
- ファイルアップロード処理
- リアルタイムストリーミング

### パフォーマンス最適化

#### 1. Streaming SSR

- `loading.tsx`でローディング状態を表示
- Suspenseを活用した段階的レンダリング

#### 2. キャッシュ戦略

- `fetch()`の自動キャッシュ活用
- `revalidatePath()`で適切なキャッシュ無効化
- 動的データは`cache: 'no-store'`

#### 3. 並列データフェッチ

```typescript
// ✅ Good: 並列取得
const [table, records] = await Promise.all([
  prisma.table.findUnique({ where: { id } }),
  prisma.record.findMany({ where: { tableId: id } }),
]);

// ❌ Bad: 直列取得
const table = await prisma.table.findUnique({ where: { id } });
const records = await prisma.record.findMany({ where: { tableId: id } });
```

## ディレクトリ構成

> **注意:**  
> 以下のディレクトリ構成は開発開始時点での設計案です。  
> 実装を進める中で、技術的な制約や要件の変化に応じて構成を見直す可能性があります。

```
lowcode-platform/
├── app/                          # Next.js App Router
│   ├── (public)/                 # 認証不要（将来的にLP等を配置）
│   │   └── layout.tsx
│   │
│   ├── (protected)/              # 認証必須（アプリケーションのメイン機能）
│   │   ├── layout.tsx            # サイドバー付きレイアウト
│   │   ├── page.tsx              # ホーム画面（/）
│   │   │
│   │   ├── users/                # ユーザー管理（/users）
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   │
│   │   ├── tables/               # テーブル管理（/tables）
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   └── [tableId]/
│   │   │       ├── page.tsx
│   │   │       ├── loading.tsx
│   │   │       ├── design/
│   │   │       │   └── page.tsx
│   │   │       ├── records/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── create/
│   │   │       │   │   └── page.tsx
│   │   │       │   └── [recordId]/
│   │   │       │       ├── page.tsx
│   │   │       │       └── edit/
│   │   │       │           └── page.tsx
│   │   │       ├── views/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [viewId]/
│   │   │       │       └── page.tsx
│   │   │       ├── scripts/
│   │   │       │   └── page.tsx
│   │   │       ├── styles/
│   │   │       │   └── page.tsx
│   │   │       └── settings/
│   │   │           └── page.tsx
│   │   │
│   │   ├── groups/               # グループ管理（/groups）
│   │   │   └── page.tsx
│   │   │
│   │   └── settings/             # アプリケーション設定（/settings）
│   │       └── page.tsx
│   │
│   ├── (auth)/                   # 認証プロセス
│   │   ├── login/                # ログイン（/login）
│   │   │   └── page.tsx
│   │   ├── signup/               # サインアップ（/signup）
│   │   │   └── page.tsx
│   │   └── confirm/              # メール確認（/confirm）
│   │       └── route.ts
│   │
│   ├── error/                    # エラー画面（/error）
│   │   └── page.tsx
│   │
│   ├── api/                      # API Routes（必要最小限）
│   │   ├── webhooks/
│   │   │   └── route.ts
│   │   ├── upload/
│   │   │   └── route.ts
│   │   └── external/
│   │       └── route.ts
│   │
│   ├── layout.tsx                # ルートレイアウト
│   └── globals.css
│
├── components/                   # shadcn/ui コンポーネント
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── table.tsx
│       ├── card.tsx
│       ├── form.tsx
│       └── ...
│
├── features/                     # 機能別にすべてまとめる
│   ├── table/
│   │   ├── components/           # UIコンポーネント
│   │   │   ├── TableList.tsx
│   │   │   ├── TableCard.tsx
│   │   │   ├── FieldEditor.tsx
│   │   │   └── index.ts
│   │   ├── api/                  # データ取得・更新関数（Server Actions含む）
│   │   │   ├── get-tables.ts
│   │   │   ├── get-table-by-id.ts
│   │   │   ├── create-table.ts
│   │   │   ├── update-table.ts
│   │   │   ├── delete-table.ts
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── use-table.ts
│   │   │   ├── use-fields.ts
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── table.ts
│   │   │   ├── field.ts
│   │   │   └── index.ts
│   │   └── constants/
│   │       ├── field-types.ts
│   │       └── index.ts
│   │
│   ├── record/
│   │   ├── components/
│   │   │   ├── RecordGrid.tsx
│   │   │   ├── RecordForm.tsx
│   │   │   ├── DynamicField.tsx
│   │   │   └── index.ts
│   │   ├── api/
│   │   │   ├── get-records.ts
│   │   │   ├── get-record-by-id.ts
│   │   │   ├── create-record.ts
│   │   │   ├── update-record.ts
│   │   │   ├── delete-record.ts
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── use-records.ts
│   │   │   └── index.ts
│   │   └── types/
│   │       ├── record.ts
│   │       └── index.ts
│   │
│   ├── view/
│   │   ├── components/
│   │   │   ├── GridView.tsx
│   │   │   ├── KanbanView.tsx
│   │   │   ├── CalendarView.tsx
│   │   │   ├── GalleryView.tsx
│   │   │   ├── ViewSwitcher.tsx
│   │   │   └── index.ts
│   │   ├── api/
│   │   │   ├── get-views.ts
│   │   │   ├── create-view.ts
│   │   │   ├── update-view.ts
│   │   │   └── index.ts
│   │   └── types/
│   │       ├── view.ts
│   │       └── index.ts
│   │
│   ├── script/
│   │   ├── components/
│   │   │   ├── ScriptEditor.tsx
│   │   │   └── index.ts
│   │   ├── api/
│   │   │   ├── execute-script.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── execute-server-script.ts
│   │   │   ├── execute-client-script.ts
│   │   │   └── index.ts
│   │   └── types/
│   │       ├── script.ts
│   │       └── index.ts
│   │
│   ├── auth/
│   │   ├── components/
│   │   │   ├── login-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   └── index.ts
│   │   ├── api/
│   │   │   ├── __tests__/
│   │   │   │   ├── login.test.ts
│   │   │   │   ├── signup.test.ts
│   │   │   │   └── logout.test.ts
│   │   │   ├── login.ts
│   │   │   ├── logout.ts
│   │   │   ├── signup.ts
│   │   │   └── index.ts
│   │   └── types/
│   │       └── auth.ts
│   │
│   ├── folder/
│   │   ├── components/           # UIコンポーネント
│   │   │   └── index.ts
│   │   ├── api/                  # データ操作（Server Actions）
│   │   │   ├── __tests__/
│   │   │   │   ├── create-folder.test.ts
│   │   │   │   ├── delete-folder.test.ts
│   │   │   │   ├── get-folder-by-id.test.ts
│   │   │   │   ├── get-folders.test.ts
│   │   │   │   ├── rename-folder.test.ts
│   │   │   │   └── reorder-folders.test.ts
│   │   │   ├── create-folder.ts
│   │   │   ├── delete-folder.ts
│   │   │   ├── get-folder-by-id.ts
│   │   │   ├── get-folders.ts
│   │   │   ├── rename-folder.ts
│   │   │   ├── reorder-folders.ts
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── folder.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── calculate-folder-order.ts
│   │   │   └── index.ts
│   │   └── hooks/
│   │       └── index.ts
│   │
│   ├── group/
│   │   ├── components/
│   │   │   ├── bulk-delete-button.tsx
│   │   │   ├── columns.tsx
│   │   │   ├── create-group-button.tsx
│   │   │   ├── delete-group-item.tsx
│   │   │   ├── edit-group-item.tsx
│   │   │   ├── group-table.tsx
│   │   │   ├── manage-members-item.tsx
│   │   │   ├── member-list.tsx
│   │   │   └── index.ts
│   │   ├── api/
│   │   │   ├── __tests__/
│   │   │   │   ├── add-members.test.ts
│   │   │   │   ├── create-group.test.ts
│   │   │   │   ├── delete-group.test.ts
│   │   │   │   ├── get-group-by-id.test.ts
│   │   │   │   ├── get-groups.test.ts
│   │   │   │   ├── remove-members.test.ts
│   │   │   │   └── update-group.test.ts
│   │   │   ├── add-members.ts
│   │   │   ├── create-group.ts
│   │   │   ├── delete-group.ts
│   │   │   ├── get-group-by-id.ts
│   │   │   ├── get-groups.ts
│   │   │   ├── remove-members.ts
│   │   │   ├── update-group.ts
│   │   │   └── index.ts
│   │   └── types/
│   │       ├── group.ts
│   │       └── index.ts
│   │
│   ├── user/
│   │   ├── components/
│   │   │   ├── bulk-delete-button.tsx
│   │   │   ├── columns.tsx
│   │   │   ├── create-user-button.tsx
│   │   │   ├── delete-user-item.tsx
│   │   │   ├── edit-user-item.tsx
│   │   │   ├── user-table.tsx
│   │   │   └── index.ts
│   │   ├── api/
│   │   │   ├── __tests__/
│   │   │   │   ├── create-user.test.ts
│   │   │   │   ├── delete-user.test.ts
│   │   │   │   ├── get-users.test.ts
│   │   │   │   ├── update-user-password.test.ts
│   │   │   │   └── update-user-profile.test.ts
│   │   │   ├── create-user.ts
│   │   │   ├── delete-user.ts
│   │   │   ├── get-users.ts
│   │   │   ├── update-user-password.ts
│   │   │   ├── update-user-profile.ts
│   │   │   └── index.ts
│   │   └── types/
│   │       ├── user.ts
│   │       └── index.ts
│   │
│   └── layout/                   # レイアウトコンポーネント
│       ├── components/
│       │   ├── Header.tsx
│       │   ├── Sidebar.tsx
│       │   ├── Footer.tsx
│       │   └── index.ts
│       └── types/
│           └── layout.ts
│
├── lib/                          # グローバルユーティリティのみ
│   ├── prisma.ts                 # Prismaクライアント
│   ├── supabase/
│   │   ├── server.ts
│   │   └── client.ts
│   └── utils/
│       ├── cn.ts                 # shadcn/ui用
│       └── index.ts
│
├── hooks/                        # グローバルフック
│   ├── use-toast.ts
│   └── use-local-storage.ts
│
├── types/                        # グローバル型定義
│   ├── index.ts
│   └── database.ts
│
├── constants/                    # グローバル定数
│   ├── routes.ts
│   └── config.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── public/
│   ├── images/
│   └── icons/
│
├── .env.local
├── .gitignore
├── components.json               # shadcn/ui設定ファイル
├── next.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

### ディレクトリ設計の原則

#### 1. コロケーション（Colocation）

関連するファイルは機能ごとに1つのディレクトリにまとめる。

```typescript
features/table/
├── components/        # UIコンポーネント
├── api/              # データ操作（Server Actions含む）
├── hooks/            # カスタムフック
├── types/            # 型定義
└── constants/        # 定数
```

#### 2. Server Components vs Client Components

- **`page.tsx`**: 原則Server Component（データ取得）
- **インタラクティブなコンポーネント**: `'use client'`を明示
- **データフェッチはページで実行**し、Propsで子コンポーネントに渡す

#### 3. インポートパスの例

```typescript
// shadcn/uiコンポーネント
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 機能別コンポーネント
import { getTables, createTable } from '@/features/table/api';
import { TableList, TableCard } from '@/features/table/components';

// レイアウト
import { Header } from '@/features/layout/components';

// ユーティリティ
import { cn } from '@/lib/utils/cn';
import { prisma } from '@/lib/prisma';
```

#### 4. 各機能ディレクトリに`index.ts`を配置

```typescript
// features/table/api/index.ts
export * from './get-tables';
export * from './get-table-by-id';
export * from './create-table';
export * from './update-table';
export * from './delete-table';

// features/table/components/index.ts
export * from './TableList';
export * from './TableCard';
export * from './FieldEditor';
```

これにより、インポートがシンプルになる。

#### 5. tsconfig.jsonのパス設定

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### 6. components.json（shadcn/ui設定）

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### テスト方針

このプロジェクトでは**Server Actionsを中心にテストを実装**する方針とする。

#### テスト対象の優先度

1. **Server Actions（`features/*/api/`）** - 最優先
   - ビジネスロジックの中核
   - データ整合性やバリデーション
   - 副作用が大きい（DB書き込み、外部API呼び出し）
   - 型安全性だけでは不十分なエッジケースの確認

2. **ユーティリティ関数（`lib/utils/`）** - 次点
   - 純粋関数のテスト
   - 汎用的なロジック

3. **Hooks（`features/*/hooks/`）** - 必要に応じて
   - 状態管理ロジックの複雑度に応じて

4. **Components（`features/*/components/`）** - 後回し
   - Server Componentsは統合テストで十分なケースが多い
   - UIの変更頻度が高くメンテナンスコストが増大しやすい
   - E2Eテスト（Playwright等）でカバーする選択肢も検討

#### テストフレームワーク

- **Jest**: Next.js公式推奨、`next/jest`による簡単セットアップ
- **テスト環境**: `node`（Server Actions向け、UIテストは対象外）
- **カバレッジプロバイダ**: `v8`（高速で正確）

#### ディレクトリ構成

```
features/
├── group/
│   ├── api/
│   │   ├── __tests__/              # テストファイル
│   │   │   ├── add-members.test.ts
│   │   │   ├── remove-members.test.ts
│   │   │   ├── create-group.test.ts
│   │   │   └── ...
│   │   ├── add-members.ts
│   │   ├── remove-members.ts
│   │   └── ...
│   └── ...
└── user/
    ├── api/
    │   ├── __tests__/
    │   │   ├── create-user.test.ts
    │   │   └── ...
    │   └── ...
    └── ...
```

**命名規則**:

- ディレクトリ: `__tests__`（複数形）
- ファイル: `*.test.ts` または `*.spec.ts`

#### テストの実装方針

- **Prismaのモック**: `jest.mock()`でPrismaクライアントをモック化
- **テストデータベース**: 初期フェーズではモックのみ、統合テストが必要になったら検討
- **カバレッジ**: Server Actionsの主要な処理経路とエラーハンドリングを優先
- **コロケーション**: テスト対象ファイルと同じ階層に`__tests__`を配置

#### Jest設定（jest.config.ts）

```typescript
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node',
  clearMocks: true,
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

export default createJestConfig(config);
```

**設定のポイント**:

- `next/jest`を使用してNext.jsの設定を自動読み込み
- `testEnvironment: 'node'`でServer Actions向けの軽量な環境
- `clearMocks: true`でテスト間の独立性を確保
- `moduleNameMapper`でパスエイリアス（`@/`）を解決

#### テスト実装状況（2025-01-16時点）

**実装済みのテスト**:

- **auth機能**: 3ファイル、10テスト
  - `login.test.ts`: ログイン機能（4テスト）
  - `signup.test.ts`: サインアップ機能（5テスト）
  - `logout.test.ts`: ログアウト機能（3テスト）

- **folder機能**: 6ファイル、26テスト
  - `create-folder.test.ts`: フォルダ作成（7テスト）
  - `delete-folder.test.ts`: フォルダ削除（2テスト）
  - `get-folder-by-id.test.ts`: フォルダ個別取得（3テスト）
  - `get-folders.test.ts`: フォルダ一覧取得（3テスト）
  - `rename-folder.test.ts`: フォルダ名変更（7テスト）
  - `reorder-folders.test.ts`: フォルダ並び替え（4テスト）

- **group機能**: 7ファイル、33テスト
  - `add-members.test.ts`: メンバー追加（5テスト）
  - `create-group.test.ts`: グループ作成（7テスト）
  - `delete-group.test.ts`: グループ削除（2テスト）
  - `get-group-by-id.test.ts`: グループ個別取得（3テスト）
  - `get-groups.test.ts`: グループ一覧取得（3テスト）
  - `remove-members.test.ts`: メンバー削除（6テスト）
  - `update-group.test.ts`: グループ更新（7テスト）

- **user機能**: 5ファイル、21テスト
  - `create-user.test.ts`: ユーザー作成（7テスト）
  - `delete-user.test.ts`: ユーザー削除（2テスト）
  - `get-users.test.ts`: ユーザー一覧取得（3テスト）
  - `update-user-password.test.ts`: パスワード更新（5テスト）
  - `update-user-profile.test.ts`: プロフィール更新（4テスト）

**合計**: 21テストスイート、90テスト（全て成功）

**テストコマンド**:

```bash
npm test                 # 全テスト実行
npm run test:coverage    # カバレッジ付きテスト実行
```

### Item モデルアーキテクチャ

#### 概要

ワークスペース機能では、Folder（フォルダ）とTable（テーブル）を統一的に扱うために**Item モデル**を採用している。これにより、階層構造の管理やドラッグ&ドロップなどの共通処理を一元化しつつ、各タイプ固有の振る舞いを型安全に実装できる。

#### Discriminated Union 型システム

TypeScriptの**Discriminated Union**（判別可能なユニオン型）を使用し、`type`フィールドで型を判別する。

```typescript
// features/item/types/item.ts
import type { ItemType } from '@prisma/client';

// 基本アイテム型
type BaseItem = {
  id: string;
  name: string;
  type: ItemType; // 'FOLDER' | 'TABLE'
  parentId: string | null;
  order: number;
  meta: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

// Folder型（子要素を持つ）
export type FolderItem = BaseItem & {
  type: 'FOLDER';
  children: Item[];
};

// Table型（子要素を持たない）
export type TableItem = BaseItem & {
  type: 'TABLE';
  children?: never; // 型レベルでchildrenを持てないことを保証
};

// Item = FolderItem | TableItem
export type Item = FolderItem | TableItem;
```

**利点**:
- 型レベルでFOLDERとTABLEの違いを表現
- `item.type === 'FOLDER'`で型が自動的に`FolderItem`に絞り込まれる
- TABLEに`children`プロパティが存在しないことをコンパイル時に保証

#### Config-Driven UI パターン

各ItemTypeの振る舞いを`ITEM_CONFIGS`で宣言的に定義し、コンポーネントはこの設定を参照してUIを動的に変更する。

```typescript
// features/item/constants/item-config.ts
import { Folder, Table } from 'lucide-react';
import type { ItemType } from '@prisma/client';

type ItemConfig = {
  icon: typeof Folder | typeof Table;
  draggable: boolean;       // ドラッグ可能か
  droppable: boolean;       // ドロップ先になれるか
  canHaveChildren: boolean; // 子要素を持てるか
  showAddButton: boolean;   // 追加ボタンを表示するか
  showChevron: boolean;     // ホバー時にChevronRightを表示するか
};

export const ITEM_CONFIGS: Record<ItemType, ItemConfig> = {
  FOLDER: {
    icon: Folder,
    draggable: true,
    droppable: true,
    canHaveChildren: true,
    showAddButton: true,
    showChevron: true,
  },
  TABLE: {
    icon: Table,
    draggable: true,
    droppable: false,
    canHaveChildren: false,
    showAddButton: false,
    showChevron: false, // TABLEはホバー時にChevronRightを表示しない
  },
} as const;
```

**利点**:
- 新しいItemType（例: VIEW, FORM）を追加する際、設定を追加するだけで対応可能
- コンポーネント側は設定を参照するだけで適切なUIを表示
- 条件分岐がシンプルになり、メンテナンス性が向上

#### Wrapper パターンによるAPI設計

`createItem`という汎用的な実装を持ちつつ、`createFolder`と`createTable`という専用のラッパー関数を提供する。

```typescript
// features/item/api/create-item.ts (汎用実装)
'use server';

export async function createItem(
  prevState: unknown,
  formData: FormData
) {
  const type = (formData.get('type') as ItemType) || 'FOLDER';
  // 共通のバリデーション・DB操作
  const item = await prisma.item.create({
    data: { type, name, parentId, ... }
  });
  return { success: true };
}

// features/item/api/create-folder.ts (ラッパー)
'use server';
import { createItem } from './create-item';

export async function createFolder(
  prevState: unknown,
  formData: FormData
) {
  formData.set('type', 'FOLDER'); // typeを強制
  return createItem(prevState, formData);
}

// features/item/api/create-table.ts (ラッパー)
'use server';
import { createItem } from './create-item';

export async function createTable(
  prevState: unknown,
  formData: FormData
) {
  formData.set('type', 'TABLE'); // typeを強制
  return createItem(prevState, formData);
}
```

**利点**:
- 共通処理の重複を避けつつ、呼び出し側で明示的にFOLDER/TABLEを指定可能
- テストは`create-item.test.ts`で実装を検証し、`create-folder.test.ts`と`create-table.test.ts`ではラッパーの動作を検証
- 将来的にTABLE固有のメタデータ処理が必要になった場合も、`createTable`内で拡張可能

#### UI実装例

```typescript
// features/layout/components/workspace-menu/item.tsx
'use client';

import { ITEM_CONFIGS } from '@/features/item/constants';

export function Item({ item }: { item: Item }) {
  const config = ITEM_CONFIGS[item.type];
  const Icon = config.icon;

  return (
    <div>
      {/* アイコン表示（showChevronがtrueの場合はホバー時に隠す） */}
      <Icon
        className={
          config.showChevron
            ? 'size-4 group-hover/item:hidden'
            : 'size-4'
        }
      />

      {/* ChevronRightを条件付きで表示 */}
      {config.showChevron && (
        <ChevronRight className="size-4 hidden group-hover/item:block" />
      )}

      {/* 追加ボタン（canHaveChildrenの場合のみ） */}
      {config.canHaveChildren && config.showAddButton && (
        <button>+</button>
      )}
    </div>
  );
}
```

#### ディレクトリ構成

```
features/item/
├── api/
│   ├── __tests__/
│   │   ├── create-item.test.ts    # 汎用実装のテスト
│   │   ├── create-folder.test.ts  # ラッパーのテスト
│   │   ├── create-table.test.ts   # ラッパーのテスト
│   │   ├── delete-item.test.ts
│   │   ├── get-item-by-id.test.ts
│   │   ├── get-items.test.ts
│   │   ├── rename-item.test.ts
│   │   └── reorder-items.test.ts
│   ├── create-item.ts            # 汎用実装
│   ├── create-folder.ts          # FOLDERラッパー
│   ├── create-table.ts           # TABLEラッパー
│   ├── delete-item.ts
│   ├── get-item-by-id.ts
│   ├── get-items.ts
│   ├── rename-item.ts
│   ├── reorder-items.ts
│   └── index.ts
├── constants/
│   ├── item-config.ts            # ITEM_CONFIGS定義
│   └── index.ts
├── types/
│   ├── item.ts                   # Discriminated Union型定義
│   └── index.ts
└── utils/
    ├── calculate-item-order.ts
    └── index.ts
```

#### ベストプラクティス

1. **型安全性**: Discriminated Unionで各ItemTypeの制約を型レベルで表現
2. **拡張性**: 新しいItemTypeは設定追加のみで対応可能
3. **保守性**: Config-Driven UIでコンポーネントの条件分岐を最小化
4. **テスタビリティ**: ラッパーと汎用実装を分離してテスト戦略を明確化
5. **Composition over Inheritance**: クラス継承ではなく設定ベースで振る舞いを定義

## 機能要件

> **注意:**  
> 以下の機能要件は現時点での計画です。  
> 実装の優先度や技術的な課題により、機能の追加・変更・削除が発生する可能性があります。

### Phase 1: 基本機能（MVP）

#### 1.1 認証・権限基盤

- [x] ユーザー登録（メール/パスワード）
- [x] ログイン・ログアウト
- [x] セッション管理
- [x] 認証状態の保護（ミドルウェア）
- [x] ユーザーロール設定
  - **Admin**: すべての操作が可能
  - **Member**: 所属グループの権限に応じた操作
- [x] 認証フォームのコンポーネント化
  - `features/auth/components/login-form.tsx`
  - `features/auth/components/signup-form.tsx`
- [x] 認証APIの統合
  - `features/auth/api/login.ts`
  - `features/auth/api/signup.ts`
  - `features/auth/api/logout.ts`

**実装済み内容**:

- Supabase Authを使用したメール/パスワード認証
- Server Actionsによる認証処理
- メール確認フロー（`/confirm`）
- Prismaへのユーザー情報同期
- 認証APIの単体テスト（10テスト）

#### 1.2 グループ・権限管理

- [x] グループ作成・編集・削除
- [x] グループメンバー管理
  - ユーザーをグループに追加・削除
  - ユーザーは複数グループに所属可能
- [ ] 権限の基本構造実装
  - テーブル単位の権限設定インターフェース
  - グループごとの権限割り当て
- [ ] 権限チェック機能

**権限レベル（テーブル単位）**:

- `none`: アクセス不可
- `read`: 閲覧のみ
- `write`: 閲覧・作成・編集
- `admin`: すべての操作（削除・権限設定含む）

**実装済み内容**:

- グループCRUD機能（`features/group/api/`）
- メンバー追加・削除機能
- グループ管理UI（Data Table with TanStack Table）
- グループAPIの単体テスト（33テスト）

#### 1.2.1 ユーザー管理

- [x] ユーザー作成・編集・削除
- [x] ユーザー一覧表示
- [x] プロフィール編集（名前）
- [x] パスワード変更
- [x] ユーザーロール設定（Admin/Member）

**実装済み内容**:

- ユーザーCRUD機能（`features/user/api/`）
- ユーザー管理UI（Data Table with TanStack Table）
- ユーザーAPIの単体テスト（21テスト）

#### 1.2.2 フォルダ管理（ワークスペース機能）

- [x] フォルダ作成・削除・名前変更
- [x] フォルダの階層構造（親子関係）
- [x] フォルダの並び替え（ドラッグ&ドロップ）
- [x] フォルダ内のテーブル管理

**実装済み内容**:

- フォルダCRUD機能（`features/folder/api/`）
- 階層構造の再帰的取得
- 並び替え機能（`calculate-folder-order`）
- ワークスペースメニューUI（サイドバー）
- フォルダAPIの単体テスト（26テスト）

#### 1.3 テーブル管理

- [ ] テーブル一覧表示
- [ ] テーブル作成（名前、説明）
- [ ] テーブル編集
- [ ] テーブル削除
- [ ] テーブル作成者の自動権限付与

#### 1.4 フィールド管理

- [ ] フィールド追加
  - テキスト（1行）
  - テキスト（複数行）
  - 数値
  - 日付
  - 選択肢（単一）
  - チェックボックス
- [ ] フィールド編集（名前、型、設定）
- [ ] フィールド削除
- [ ] フィールド並び替え

#### 1.5 レコード管理（基本）

- [ ] レコード一覧表示（Grid View）
- [ ] レコード作成
- [ ] レコード編集
- [ ] レコード削除
- [ ] レコード検索（基本）
- [ ] 権限に応じた操作制限

### Phase 2: データ連携機能

#### 2.1 リレーション機能

- [ ] リレーションフィールド型の追加
- [ ] 参照先テーブル選択
- [ ] 表示フィールド選択
- [ ] プルダウンでの参照レコード選択
- [ ] リレーション先データの表示
- [ ] 参照先テーブルの権限チェック

**実装例**: 顧客マスタ → 売上表の「顧客」フィールドで顧客を選択

#### 2.2 レコード機能（拡張）

- [ ] レコードフィルタ
- [ ] レコードソート
- [ ] 一括編集
- [ ] 一括削除

### Phase 3: ビュー機能

#### 3.1 マルチビュー

- [ ] Grid View（表形式・デフォルト）
- [ ] Kanban View（カンバン形式）
  - グループ化フィールド選択
  - ドラッグ&ドロップでステータス変更
- [ ] Calendar View（カレンダー形式）
  - 日付フィールド選択
  - 月/週/日表示切り替え
- [ ] Gallery View（カード形式）
  - サムネイル表示

#### 3.2 ビュー設定

- [ ] ビュー作成
- [ ] ビュー名編集
- [ ] 表示フィールド選択
- [ ] フィルタ条件設定
- [ ] ソート条件設定
- [ ] ビュー削除
- [ ] ビュー単位の権限設定（将来的に検討）

### Phase 4: カスタマイズ機能

#### 4.1 スクリプト機能

- [ ] スクリプトエディタ（Monaco Editor）
- [ ] サーバーサイドスクリプト
  - `beforeCreate`: レコード作成前
  - `afterCreate`: レコード作成後
  - `beforeUpdate`: レコード更新前
  - `afterUpdate`: レコード更新後
- [ ] クライアントサイドスクリプト
  - `onLoad`: ページ読み込み時
  - `onChange`: フィールド変更時
  - `onSubmit`: フォーム送信時
- [ ] スクリプトのサンドボックス実行
- [ ] エラーハンドリング
- [ ] ログ出力機能

#### 4.2 CSS カスタマイズ

- [ ] CSSエディタ（Monaco Editor）
- [ ] スコープ管理（全体/テーブル/ビュー）
- [ ] リアルタイムプレビュー
- [ ] CSSの有効/無効切り替え

#### 4.3 計算フィールド

- [ ] 計算式フィールド型
- [ ] 数式エディタ
- [ ] 他フィールド参照
- [ ] 自動再計算

### Phase 5: 高度な機能（将来的に検討）

#### 5.1 権限管理（拡張）

- [ ] ビュー単位の権限設定
- [ ] レコード単位の権限設定（Row Level Security）
- [ ] フィールド単位の権限設定

#### 5.2 API機能

- [ ] 自動REST API生成
- [ ] APIキー管理
- [ ] Webhook設定
- [ ] レート制限

#### 5.3 インポート/エクスポート

- [ ] CSV インポート
- [ ] Excel インポート
- [ ] CSV エクスポート
- [ ] Excel エクスポート
- [ ] JSON エクスポート

#### 5.4 通知機能

- [ ] メール通知
- [ ] アプリ内通知
- [ ] 通知設定（条件ベース）

#### 5.5 ワークフロー

- [ ] ステータスフィールド
- [ ] 承認フロー設定
- [ ] 承認者指定
- [ ] 承認履歴

## データベース設計

### Prismaスキーマ

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String        @id @default(cuid())
  email         String        @unique
  name          String?
  role          UserRole      @default(MEMBER)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  groupMembers  GroupMember[]
  tables        Table[]
  records       Record[]
  folders       Folder[]
}

model Group {
  id          String            @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  members     GroupMember[]
  permissions TablePermission[]
}

model GroupMember {
  id        String   @id @default(cuid())
  userId    String
  groupId   String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@unique([userId, groupId])
  @@index([userId])
  @@index([groupId])
}

model Table {
  id          String            @id @default(cuid())
  name        String
  description String?
  schema      Json              // フィールド定義
  ownerId     String
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  owner       User              @relation(fields: [ownerId], references: [id])
  records     Record[]
  views       View[]
  scripts     Script[]
  styles      Style[]
  permissions TablePermission[]

  @@index([ownerId])
}

model TablePermission {
  id        String     @id @default(cuid())
  tableId   String
  groupId   String
  level     Permission @default(NONE)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  table     Table      @relation(fields: [tableId], references: [id], onDelete: Cascade)
  group     Group      @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@unique([tableId, groupId])
  @@index([tableId])
  @@index([groupId])
}

model Record {
  id          String   @id @default(cuid())
  tableId     String
  data        Json     // 実際のデータ
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  table       Table    @relation(fields: [tableId], references: [id], onDelete: Cascade)
  createdBy   User     @relation(fields: [createdById], references: [id])

  @@index([tableId])
  @@index([createdById])
}

model View {
  id        String   @id @default(cuid())
  tableId   String
  name      String
  type      ViewType // grid, kanban, calendar, gallery
  config    Json     // ビュー設定
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  table     Table    @relation(fields: [tableId], references: [id], onDelete: Cascade)

  @@index([tableId])
}

model Script {
  id          String     @id @default(cuid())
  tableId     String
  event       String     // beforeCreate, onChange, etc.
  scriptType  ScriptType // server, client
  code        String     @db.Text
  enabled     Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  table       Table      @relation(fields: [tableId], references: [id], onDelete: Cascade)

  @@index([tableId])
}

model Style {
  id        String   @id @default(cuid())
  tableId   String
  scope     String   // global, table, view
  css       String   @db.Text
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  table     Table    @relation(fields: [tableId], references: [id], onDelete: Cascade)

  @@index([tableId])
}

model Folder {
  id          String   @id @default(cuid())
  name        String
  parentId    String?
  order       Int      @default(0)
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  parent      Folder?  @relation("FolderHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children    Folder[] @relation("FolderHierarchy")
  createdBy   User     @relation(fields: [createdById], references: [id])

  @@index([parentId])
  @@index([createdById])
  @@index([order])
}

enum UserRole {
  ADMIN
  MEMBER
}

enum Permission {
  NONE
  READ
  WRITE
  ADMIN
}

enum ViewType {
  GRID
  KANBAN
  CALENDAR
  GALLERY
}

enum ScriptType {
  SERVER
  CLIENT
}
```

## 実装ロードマップ

> **注意:**  
> 以下のロードマップは現時点での計画です。  
> 開発を進める中で優先度や技術的な課題により、順序や内容が変更になる場合があります。  
> 細かい仕様は実装時に決定していきます。

### Week 1-2: 環境構築 & 認証基盤

**目標**: ユーザー登録・ログイン・権限管理の基盤ができる

- Next.js + Supabase + Prismaのセットアップ
- Supabase Authの統合
- ユーザー登録・ログイン画面
- 認証ミドルウェア
- ユーザーロール（Admin/Member）の実装
- 保護されたダッシュボード画面

**成果物**:

- ログイン後にダッシュボードにアクセスできる
- 未認証ユーザーはログイン画面にリダイレクト
- AdminとMemberの区別ができる

### Week 3-4: グループ・権限管理

**目標**: グループとテーブル権限の基盤ができる

- グループCRUD（作成・編集・削除）
- グループメンバー管理
  - ユーザーの追加・削除
  - 複数グループへの所属
- TablePermissionモデルの実装
- 権限チェック関数の実装
- グループ管理画面
- 権限設定UI（基本）

**成果物**:

- グループを作成し、メンバーを管理できる
- テーブルごとにグループの権限を設定できる（UI上で）
- 権限に応じたアクセス制御が機能する

### Week 5-6: 基本的なテーブル・レコード管理

**目標**: 固定スキーマでテーブルとレコードの作成・表示ができる

- テーブル作成・編集・削除（Server Actions）
- テーブル作成者への自動権限付与
- 固定スキーマでのレコード管理
- シンプルなGrid View（Client Component）
- 基本的なCRUD操作
- 権限に応じた操作制限

**成果物**:

- 権限のあるユーザーがテーブルを作成できる
- レコードの追加・編集・削除が権限に応じて制限される

### Week 7-8: 動的スキーマ実装

**目標**: ユーザーが自由にフィールドを定義できる

- フィールド型の実装（テキスト、数値、日付、選択肢等）
- 動的フォーム生成（Client Component）
- サーバーサイドバリデーション
- フィールド追加・編集・削除UI

**成果物**:

- ユーザーが任意のフィールド構成のテーブルを作成できる
- フィールド編集は`admin`権限を持つユーザーのみ可能

### Week 9-10: リレーション機能

**目標**: テーブル間の参照関係を実装

- リレーションフィールド実装
- 参照先データの取得・表示（Server Component）
- 参照先テーブルの権限チェック
- プルダウン選択UI（Client Component）
- リレーション先の表示

**成果物**:

- 顧客マスタ → 売上表のような参照関係が機能する
- 権限のないテーブルは参照先として選択できない

### Week 11-12: ビュー機能（基本）

**目標**: Grid View以外の表示方法を追加

- マルチビュー対応（Client Components）
- Kanban View実装
- フィルタ・ソート機能
- ビュー切り替えUI

**成果物**:

- 同じデータを異なる形式で表示できる

### Week 13-14: スクリプト機能（基本）

**目標**: 簡単なカスタマイズができる

- Monaco Editorの統合（Client Component）
- サーバーサイドスクリプト実行（Server Action + vm2）
- 基本的なイベントフック（beforeCreate, afterCreate）

**成果物**:

- レコード作成時に自動計算などのカスタマイズができる
- スクリプト編集は`admin`権限を持つユーザーのみ可能

### Week 15+: 継続的な改善

- UI/UXの改善
- パフォーマンス最適化
- 追加機能の実装（Phase 3-5の機能を順次追加）
- バグ修正
- より細かい権限制御（ビュー単位、レコード単位）

## 参考資料

### 類似サービス

#### ドキュメント×データベース系

- [Notion](https://www.notion.so/) - データベース機能・マルチビューが参考になる

#### スプレッドシート×データベース系

- [Airtable](https://www.airtable.com/) - UI/UX・リレーション機能の参考
- [NocoDB](https://www.nocodb.com/) - オープンソースのAirtable代替

#### 業務アプリ構築系

- [Kintone](https://kintone.cybozu.co.jp/) - 日本の業務アプリプラットフォーム
- [Pleasanter](https://pleasanter.org/) - オープンソース・権限管理が参考になる

### 技術参考

#### Next.js関連

- [Next.js App Router](https://nextjs.org/docs/app) - 公式ドキュメント
- [Next.jsの考え方](https://zenn.dev/akfm/books/nextjs-basic-principle) - App Routerの基本原則とベストプラクティス
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) - データ更新の推奨パターン
- [Data Fetching Patterns](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns) - データ取得のベストプラクティス

#### データベース・ORM

- [Prisma](https://www.prisma.io/) - 型安全なORM
- [Supabase](https://supabase.com/docs) - PostgreSQL + 認証 + ストレージ

#### UI・スタイリング

- [shadcn/ui](https://ui.shadcn.com/) - 再利用可能なコンポーネント集
- [Tailwind CSS](https://tailwindcss.com/docs) - ユーティリティファーストCSS

#### コードエディタ・スクリプト実行

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - VS Code のエディタエンジン
- [vm2](https://github.com/patriksimek/vm2) - セキュアなJavaScript実行環境

#### その他

- [Zod](https://zod.dev/) - TypeScript-firstなバリデーションライブラリ
- [@tanstack/react-table](https://tanstack.com/table/latest) - 高機能なテーブルライブラリ
- [@dnd-kit](https://dndkit.com/) - ドラッグ&ドロップライブラリ（Kanban View用）

## 開発メモ

> **注意:**  
> 以下は開発を進める上での技術的な検討事項です。  
> 優先度や実装タイミングは開発状況に応じて調整します。

### 技術的な検討事項

#### 動的スキーマの実装

- PostgreSQLのJSONB型を活用
- スキーマ定義とデータを分離
- バリデーションはサーバーサイド（Server Actions）で実行

#### スクリプトの安全性

- サーバーサイド: vm2でサンドボックス実行
- クライアントサイド: 制限されたAPIのみ提供
- タイムアウト設定（5秒）
- 利用可能なAPIを制限

#### パフォーマンス最適化（必要になった時点で実装）

- レコード数が多い場合の対策
  - ページネーション
  - 仮想スクロール
  - インデックス最適化
- リレーション取得の最適化
  - N+1問題の回避（Prismaの`include`を活用）
  - キャッシング

## 開発の進め方

1. **最小限の機能から始める**: Phase 1の機能を完成させてから次へ
2. **実装しながら設計を改善**: 細かい仕様は実装時に決定
3. **定期的なリファクタリング**: コードの品質を保つ
4. **ユーザビリティ重視**: 使いやすさを優先

## Issue・Pull Request の作成ガイドライン

### Issue 作成のポイント

- テンプレート（`.github/ISSUE_TEMPLATE/`）のフォーマットに沿って記述
- **概要**: 目的や背景を簡潔に記載（2-3文程度）
- **詳細**: 実施内容を箇条書きで簡潔に列挙
- 細かい実装の詳細は書かず、何をするかの方針のみ記載

**例（enhancement）**:

```markdown
## 概要

プロジェクト開発を開始するための初期環境をセットアップします。

## 詳細

- Next.js プロジェクトのセットアップ
- shadcn/ui の導入
- ESLint & Prettier の設定
- GitHub テンプレートの作成
```

### Pull Request 作成のポイント

- テンプレート（`.github/pull_request_template.md`）のフォーマットに沿って記述
- **概要**: PR の目的を簡潔に説明
- **実装内容**: 実装した主な内容を箇条書きで記載（サブリストで詳細を追加可）
- **動作確認**: 手動確認した項目をチェックリストで記載
- **関連 Issue**: `Closes #番号` で自動クローズ
- 過去の PR とトーンを合わせる

**例**:

```markdown
## 概要

プロジェクトの開発環境を構築し、開発を開始するための基盤を整備しました。

## 実装内容

- **Next.js 環境構築**: App Router を使用したプロジェクトを生成
- **shadcn/ui の導入**: UI コンポーネントライブラリをセットアップ
- **ESLint & Prettier 導入**: コードフォーマッターと Linter の統合設定

## 動作確認

- [x] Next.js の開発サーバーが起動することを確認
- [x] ESLint/Prettier が正常に動作することを確認

## 関連 Issue

Closes #1
```
