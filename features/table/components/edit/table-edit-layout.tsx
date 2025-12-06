'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Column } from '@/features/column/types';
import type { Item } from '@/features/item/types';
import { ColumnsContent } from './columns-content';
import { SettingsContent } from './settings-content';
import { AccessContent } from './access-content';

/**
 * TableEditLayoutのProps型
 */
type TableEditLayoutProps = {
  itemId: string;
  itemName: string;
  columns: Column[];
  tables: Item[];
};

/**
 * テーブル編集画面のレイアウトコンポーネント
 */
export function TableEditLayout({
  itemId,
  itemName,
  columns,
  tables,
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
            <TabsTrigger value="client-script">
              クライアントスクリプト
            </TabsTrigger>
            <TabsTrigger value="server-script">サーバースクリプト</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="settings" className="flex-1 mt-6">
          <SettingsContent itemId={itemId} itemName={itemName} />
        </TabsContent>
        <TabsContent value="columns" className="flex-1 mt-6">
          <ColumnsContent itemId={itemId} columns={columns} tables={tables} />
        </TabsContent>
        <TabsContent value="access" className="flex-1 mt-6">
          <AccessContent itemId={itemId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
