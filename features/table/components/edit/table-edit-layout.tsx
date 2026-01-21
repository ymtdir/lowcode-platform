'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Column } from '@/features/column/types';
import type { Item } from '@/features/item/types';
import type { User } from '@/features/user/types';
import type { Group } from '@/features/group/types';
import type { PermissionWithRelations } from '@/features/permission/types';
import type { Style } from '@/features/style';
import { ColumnsContent } from './columns-content';
import { SettingsContent } from './settings-content';
import { AccessContent } from './access-content';
import { StyleContent } from './style-content';

/**
 * TableEditLayoutのProps型
 */
type TableEditLayoutProps = {
  itemId: string;
  itemName: string;
  itemIcon?: string | null;
  columns: Column[];
  tables: Item[];
  initialPermissions: PermissionWithRelations[];
  users: User[];
  groups: Group[];
  styles: Style[];
};

/**
 * テーブル編集画面のレイアウトコンポーネント
 */
export function TableEditLayout({
  itemId,
  itemName,
  itemIcon,
  columns,
  tables,
  initialPermissions,
  users,
  groups,
  styles,
}: TableEditLayoutProps) {
  return (
    <div className="w-full p-6">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{itemName} 管理画面</h1>
      </div>

      {/* タブ */}
      <Tabs defaultValue="settings">
        {/* ツールバー */}
        <div className="flex items-center gap-4 py-4">
          <Link
            href={`/${itemId}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            レコード一覧
          </Link>
          <TabsList>
            <TabsTrigger value="settings">基本設定</TabsTrigger>
            <TabsTrigger value="columns">項目</TabsTrigger>
            <TabsTrigger value="access">権限</TabsTrigger>
            <TabsTrigger value="style">スタイル</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="settings" className="flex-1 mt-6">
          <SettingsContent
            itemId={itemId}
            itemName={itemName}
            itemIcon={itemIcon}
          />
        </TabsContent>
        <TabsContent value="columns" className="flex-1 mt-6">
          <ColumnsContent itemId={itemId} columns={columns} tables={tables} />
        </TabsContent>
        <TabsContent value="access" className="flex-1 mt-6">
          <AccessContent
            itemId={itemId}
            initialPermissions={initialPermissions}
            users={users}
            groups={groups}
          />
        </TabsContent>
        <TabsContent value="style" className="flex-1 mt-6">
          <StyleContent itemId={itemId} initialStyles={styles} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
