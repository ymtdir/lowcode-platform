'use client';

import { Ellipsis, FileOutput, FileInput } from 'lucide-react';
import type { PageType } from './container';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useExport } from '@/features/layout/providers/export-provider';

/**
 * アイテムオプションボタンのProps型
 */
type ItemOptionsButtonProps = {
  pageType: PageType;
};

/**
 * アイテムオプションボタンコンポーネント
 * ページタイプに応じてインポート/エクスポートオプションを表示
 */
export function ItemOptionsButton({ pageType }: ItemOptionsButtonProps) {
  const { exportFn } = useExport();

  // エクスポート可能なページタイプ
  const exportableTypes: PageType[] = ['TABLE', 'USERS', 'GROUPS'];

  if (!exportableTypes.includes(pageType)) {
    return null;
  }

  const handleExport = () => {
    console.log('handleExport called, exportFn:', exportFn);
    if (exportFn) {
      exportFn();
    } else {
      console.error('exportFn is null or undefined');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Ellipsis />
          <span className="sr-only">オプション</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <FileInput />
          インポート
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleExport}>
          <FileOutput />
          エクスポート
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
