# Item モデルアーキテクチャ

## 概要

ワークスペース機能では、Folder（フォルダ）とTable（テーブル）を統一的に扱うために**Item モデル**を採用している。これにより、階層構造の管理やドラッグ&ドロップなどの共通処理を一元化しつつ、各タイプ固有の振る舞いを型安全に実装できる。

## Discriminated Union 型システム

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

## Config-Driven UI パターン

各ItemTypeの振る舞いを`ITEM_CONFIGS`で宣言的に定義し、コンポーネントはこの設定を参照してUIを動的に変更する。

```typescript
// features/item/constants/item-config.ts
import { Folder, Table } from 'lucide-react';
import type { ItemType } from '@prisma/client';

type ItemConfig = {
  icon: typeof Folder | typeof Table;
  draggable: boolean; // ドラッグ可能か
  droppable: boolean; // ドロップ先になれるか
  canHaveChildren: boolean; // 子要素を持てるか
  showAddButton: boolean; // 追加ボタンを表示するか
  showChevron: boolean; // ホバー時にChevronRightを表示するか
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
    showChevron: false,
  },
} as const;
```

**利点**:

- 新しいItemType（例: VIEW, FORM）を追加する際、設定を追加するだけで対応可能
- コンポーネント側は設定を参照するだけで適切なUIを表示
- 条件分岐がシンプルになり、メンテナンス性が向上

## Wrapper パターンによるAPI設計

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
- テストは`create-item.test.ts`で実装を検証し、ラッパーのテストは動作確認のみ
- 将来的にTABLE固有のメタデータ処理が必要になった場合も、`createTable`内で拡張可能

## UI実装例

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

## ディレクトリ構成

```
features/item/
├── api/
│   ├── __tests__/
│   │   ├── create-item.test.ts
│   │   ├── create-folder.test.ts
│   │   ├── create-table.test.ts
│   │   └── ...
│   ├── create-item.ts
│   ├── create-folder.ts
│   ├── create-table.ts
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

## ベストプラクティス

1. **型安全性**: Discriminated Unionで各ItemTypeの制約を型レベルで表現
2. **拡張性**: 新しいItemTypeは設定追加のみで対応可能
3. **保守性**: Config-Driven UIでコンポーネントの条件分岐を最小化
4. **テスタビリティ**: ラッパーと汎用実装を分離してテスト戦略を明確化
5. **Composition over Inheritance**: クラス継承ではなく設定ベースで振る舞いを定義
