'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Item } from '@/features/item/types';
import { SettingsContent } from './settings-content';

/**
 * FolderEditLayoutのProps型
 */
type FolderEditLayoutProps = {
  folder: Item & { type: 'FOLDER' };
};

/**
 * フォルダ編集画面のレイアウトコンポーネント
 */
export function FolderEditLayout({ folder }: FolderEditLayoutProps) {
  return (
    <div className="w-full p-6">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{folder.name} 管理画面</h1>
      </div>

      {/* タブ */}
      <Tabs defaultValue="settings">
        {/* ツールバー */}
        <div className="flex items-center gap-4 py-4">
          <Link
            href={`/${folder.id}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            フォルダ一覧
          </Link>
          <TabsList>
            <TabsTrigger value="settings">基本設定</TabsTrigger>
            <TabsTrigger value="access">権限</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="settings" className="flex-1 mt-6">
          <SettingsContent folderId={folder.id} folderName={folder.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
