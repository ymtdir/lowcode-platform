# アーキテクチャ概要

## Server-First Architecture

Next.jsのベストプラクティスに従い、**基本的にサーバーサイドで処理を行う**設計とする。

### 1. Server Componentsを優先

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

### 2. Server Actionsの活用

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

### 3. データフェッチの原則

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

### 4. Client Componentの使用基準

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

### 5. API Routesの使用場面

Server Actionsで対応できない場合のみAPI Routesを使用：

- 外部Webhook受信
- 外部APIへのプロキシ
- ファイルアップロード処理
- リアルタイムストリーミング

## パフォーマンス最適化

### 1. Streaming SSR

- `loading.tsx`でローディング状態を表示
- Suspenseを活用した段階的レンダリング

### 2. キャッシュ戦略

- `fetch()`の自動キャッシュ活用
- `revalidatePath()`で適切なキャッシュ無効化
- 動的データは`cache: 'no-store'`

### 3. 並列データフェッチ

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
