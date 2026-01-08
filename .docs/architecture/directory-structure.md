# ディレクトリ構成

> **注意:** 以下のディレクトリ構成は開発開始時点での設計案です。実装を進める中で、技術的な制約や要件の変化に応じて構成を見直す可能性があります。

## 全体構成

```text
lowcode-platform/
├── app/                          # Next.js App Router
│   ├── (public)/                 # 認証不要（将来的にLP等を配置）
│   ├── (protected)/              # 認証必須（メイン機能）
│   ├── (auth)/                   # 認証プロセス
│   ├── error/                    # エラー画面
│   ├── api/                      # API Routes（必要最小限）
│   ├── layout.tsx                # ルートレイアウト
│   └── globals.css
│
├── components/                   # shadcn/ui コンポーネント
│   └── ui/
│
├── features/                     # 機能別にすべてまとめる
│   ├── table/
│   ├── record/
│   ├── view/
│   ├── script/
│   ├── auth/
│   ├── folder/
│   ├── group/
│   ├── user/
│   └── layout/
│
├── lib/                          # グローバルユーティリティのみ
│   ├── prisma.ts
│   ├── supabase/
│   └── utils/
│
├── hooks/                        # グローバルフック
├── types/                        # グローバル型定義
├── constants/                    # グローバル定数
├── prisma/                       # Prismaスキーマ
└── public/                       # 静的ファイル
```

## app/ ディレクトリ詳細

```text
app/
├── (public)/                 # 認証不要
│   └── layout.tsx
│
├── (protected)/              # 認証必須
│   ├── layout.tsx            # サイドバー付きレイアウト
│   ├── page.tsx              # ホーム画面（/）
│   ├── users/                # ユーザー管理
│   ├── tables/               # テーブル管理
│   │   ├── page.tsx
│   │   ├── create/
│   │   └── [tableId]/
│   │       ├── page.tsx
│   │       ├── design/
│   │       ├── records/
│   │       ├── views/
│   │       ├── scripts/
│   │       ├── styles/
│   │       └── settings/
│   ├── groups/               # グループ管理
│   └── settings/             # アプリケーション設定
│
├── (auth)/                   # 認証プロセス
│   ├── login/
│   ├── signup/
│   └── confirm/
│
└── api/                      # API Routes（必要最小限）
    ├── webhooks/
    ├── upload/
    └── external/
```

## features/ ディレクトリ詳細

各機能は以下の構成で統一:

```text
features/table/
├── components/           # UIコンポーネント
│   ├── TableList.tsx
│   ├── TableCard.tsx
│   └── index.ts
├── api/                  # データ操作（Server Actions含む）
│   ├── __tests__/        # テストファイル
│   ├── get-tables.ts
│   ├── create-table.ts
│   └── index.ts
├── hooks/                # カスタムフック
├── types/                # 型定義
└── constants/            # 定数
```

## 設計原則

### 1. コロケーション（Colocation）

関連するファイルは機能ごとに1つのディレクトリにまとめる。

### 2. Server Components vs Client Components

- **`page.tsx`**: 原則Server Component（データ取得）
- **インタラクティブなコンポーネント**: `'use client'`を明示
- **データフェッチはページで実行**し、Propsで子コンポーネントに渡す

### 3. 各機能ディレクトリに`index.ts`を配置

```typescript
// features/table/api/index.ts
export * from './get-tables';
export * from './create-table';
// ...

// features/table/components/index.ts
export * from './TableList';
export * from './TableCard';
```

これにより、インポートがシンプルになる:

```typescript
import { getTables, createTable } from '@/features/table/api';
import { TableList, TableCard } from '@/features/table/components';
```

### 4. インポートパスの例

```typescript
// shadcn/uiコンポーネント
import { Button } from '@/components/ui/button';

// 機能別コンポーネント
import { getTables } from '@/features/table/api';
import { TableList } from '@/features/table/components';

// レイアウト
import { Header } from '@/features/layout/components';

// ユーティリティ
import { cn } from '@/lib/utils/cn';
import { prisma } from '@/lib/prisma';
```

### 5. パス設定

**tsconfig.json**:

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

**components.json（shadcn/ui）**:

```json
{
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```
