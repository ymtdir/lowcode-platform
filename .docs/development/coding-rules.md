# コーディング規約

コードの可読性とメンテナンス性を向上させるため、以下のルールに従う。

## コメントルール

### 1. JSDoc形式のコメント（`/** */`）

関数、型定義、定数にはJSDoc形式のコメントを使用する。

**重要**: TypeScriptでは型情報が関数シグネチャに明記されているため、`@param`や`@returns`は**省略する**。型情報と重複し冗長になるため、簡潔な説明のみを記述する。

```typescript
/**
 * ユーザー情報を取得する
 */
export async function getUserById(userId: string): Promise<User | null> {
  return await prisma.user.findUnique({ where: { id: userId } });
}

/**
 * カラムの型定義
 */
export type ColumnType = 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'CHECKBOX';

/**
 * カラムタイプの一覧（順序を保持）
 */
export const COLUMN_TYPE_LIST: ColumnType[] = [
  'TEXT',
  'NUMBER',
  'DATE',
  'SELECT',
  'CHECKBOX',
];
```

**悪い例**（冗長な`@param`/`@returns`）:

```typescript
// ❌ Bad: 型情報と重複して冗長
/**
 * テーブル一覧を取得する
 * @param filters - フィルタ条件
 * @returns テーブルの配列
 */
export async function getTables(filters: TableFilters): Promise<Table[]> {
  // ...
}

// ✅ Good: 簡潔な説明のみ
/**
 * フィルタ条件に基づいてテーブル一覧を取得する
 */
export async function getTables(filters: TableFilters): Promise<Table[]> {
  // ...
}
```

### 2. インライン・コメント（`//`）

実装内の処理や判断ロジックの説明には `//` を使用する。

```typescript
export async function addColumn(itemId: string, input: CreateColumnInput) {
  // 認証チェック
  const user = await getCurrentUser();
  if (!user) {
    return { error: '認証が必要です' };
  }

  // アイテムの取得と権限チェック
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.type !== 'TABLE') {
    return { error: 'テーブルが見つかりません' };
  }

  // カラムをスキーマに追加
  const tableMeta = getTableMeta(item.meta);
  const updatedSchema = addColumnToSchema(
    tableMeta?.schema || createEmptySchema(),
    input
  );

  return { success: true };
}
```

### 3. コメントのガイドライン

- **必須**: 公開APIとなる関数、型定義、定数にはJSDocコメントを記述
- **推奨**: 複雑なロジックや非自明な処理には実装内コメント
- **避ける**: 自明な処理への冗長なコメント
- **日本語**: このプロジェクトでは日本語でコメントを記述

```typescript
// ❌ Bad: 自明な処理へのコメント
const sum = a + b; // aとbを足す

// ✅ Good: 非自明な処理への説明
// 並び替え後のorderが重複しないよう、後続要素を+1ずつ調整
const reorderedColumns = columns.map((col, index) => ({
  ...col,
  order: index >= newOrder ? col.order + 1 : col.order,
}));
```

## ファイル・ディレクトリ命名規則

- **ファイル名**: kebab-case（例: `create-table.ts`, `table-list.tsx`）
- **コンポーネントファイル**: PascalCase も可（例: `TableList.tsx`）
- **テストファイル**: `*.test.ts` または `*.spec.ts`
- **テストディレクトリ**: `__tests__/`

## インポート順序

1. 外部ライブラリ（React, Next.js等）
2. 内部モジュール（`@/`から始まるパス）
3. 相対パス

```typescript
// 外部ライブラリ
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 内部モジュール
import { Button } from '@/components/ui/button';
import { getTables } from '@/features/table/api';

// 相対パス（同一feature内）
import { TableCard } from './TableCard';
```
