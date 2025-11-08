'use client';

import { ChevronRight, Folder, Table } from 'lucide-react';
import Link from 'next/link';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// TODO: 将来的にはDBから取得
type WorkspaceItem = {
  id: string;
  name: string;
  type: 'folder' | 'table';
  parentId: string | null;
  url: string;
};

// type WorkspaceItemsProps = {
//   // TODO: 将来的にはpropsでフォルダとテーブルのデータを受け取る
//   // folders: WorkspaceItem[];
//   // tables: WorkspaceItem[];
// };

export function WorkspaceItems() {
  // TODO: 将来的にはDBからルートフォルダとルートテーブル（parentId === null）を取得
  // 仮のモックデータ
  const rootItems: WorkspaceItem[] = [
    {
      id: 'mock-1',
      name: 'サンプルフォルダ（モック）',
      type: 'folder',
      parentId: null,
      url: '#',
    },
  ];

  return (
    <>
      {rootItems.map((item) => {
        // フォルダの場合は開閉可能
        if (item.type === 'folder') {
          return (
            <Collapsible
              key={item.id}
              defaultOpen
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <Folder />
                    <span>{item.name}</span>
                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <span className="text-sm text-muted-foreground">
                        フォルダ内のアイテムがここに表示されます
                      </span>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        }

        // テーブルの場合は通常のリンク
        return (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton asChild>
              <Link href={item.url}>
                <Table />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </>
  );
}
