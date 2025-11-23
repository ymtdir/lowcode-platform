'use client';

import { useState } from 'react';
import { Settings2, ListTree, Settings } from 'lucide-react';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Column } from '@/features/column/types';
import { ColumnsContent } from './columns-content';
import { SettingsContent } from './settings-content';

/**
 * メニュー項目の型
 */
type MenuType = 'columns' | 'settings';

/**
 * メニュー項目の定義
 */
const MENU_ITEMS: { id: MenuType; label: string; icon: typeof ListTree }[] = [
  { id: 'columns', label: '項目', icon: ListTree },
  { id: 'settings', label: '設定', icon: Settings },
];

type TableManageDialogProps = {
  itemId: string;
  columns: Column[];
};

/**
 * テーブル管理ダイアログコンポーネント
 */
export function TableManageDialog({ itemId, columns }: TableManageDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuType>('columns');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings2 />
          テーブル管理
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl! max-h-[80vh] p-0 gap-0">
        <VisuallyHidden.Root>
          <DialogTitle>テーブル管理</DialogTitle>
        </VisuallyHidden.Root>
        <div className="flex h-[60vh]">
          {/* 左サイドメニュー */}
          <nav className="w-48 border-r p-4 space-y-1">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={cn(
                    'flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors',
                    activeMenu === item.id
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* 右コンテンツ */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeMenu === 'columns' && (
              <ColumnsContent itemId={itemId} columns={columns} />
            )}
            {activeMenu === 'settings' && <SettingsContent />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
