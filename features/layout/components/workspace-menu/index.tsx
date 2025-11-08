'use client';

import { Plus } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar';

import { WorkspaceItems } from './items';

export function WorkspaceMenu() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>ワークスペース</SidebarGroupLabel>
      <SidebarGroupAction
        title="フォルダまたはテーブルを追加"
        onClick={() => {
          // TODO: フォルダまたはテーブル作成ダイアログを開く
          console.log('新規作成ボタンがクリックされました');
        }}
      >
        <Plus />
        <span className="sr-only">フォルダまたはテーブルを追加</span>
      </SidebarGroupAction>
      <SidebarMenu>
        <WorkspaceItems />
      </SidebarMenu>
    </SidebarGroup>
  );
}
