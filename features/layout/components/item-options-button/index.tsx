'use client';

import { useSearchParams } from 'next/navigation';
import { Ellipsis, FileOutput, FileInput } from 'lucide-react';
import type { PageType } from './container';
import type { ExportColumnFilter } from '@/features/table/types/export';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { exportTableAction } from '@/features/table/actions/export-table';
import { exportUsersAction } from '@/features/user/actions/export-users';
import { exportGroupsAction } from '@/features/group/actions/export-groups';
import { downloadCSV } from '@/lib/csv';

/**
 * アイテムオプションボタンのProps型
 */
type ItemOptionsButtonProps = {
  pageType: PageType;
  itemId?: string;
};

/**
 * アイテムオプションボタンコンポーネント
 * ページタイプに応じてインポート/エクスポートオプションを表示
 */
export function ItemOptionsButton({
  pageType,
  itemId,
}: ItemOptionsButtonProps) {
  const searchParams = useSearchParams();

  // エクスポート可能なページタイプ
  const exportableTypes: PageType[] = ['TABLE', 'USERS', 'GROUPS'];

  if (!exportableTypes.includes(pageType)) {
    return null;
  }

  const handleExport = async () => {
    // URLからフィルタ条件を取得
    const filtersParam = searchParams.get('filters');

    let filters: ExportColumnFilter[] = [];

    try {
      if (filtersParam) {
        const parsed = JSON.parse(filtersParam);
        if (Array.isArray(parsed)) filters = parsed;
      }
    } catch {
      // 不正なパラメータは無視してデフォルト値を使用
      console.error('Failed to parse filters from URL');
    }

    let result: { csv?: string; filename?: string; error?: string };

    // ページタイプに応じてServer Actionを呼び出し
    if (pageType === 'TABLE' && itemId) {
      result = await exportTableAction(itemId, filters);
    } else if (pageType === 'USERS') {
      result = await exportUsersAction(filters);
    } else if (pageType === 'GROUPS') {
      result = await exportGroupsAction(filters);
    } else {
      console.error('Unknown page type:', pageType);
      return;
    }

    if (result.error) {
      console.error('Export error:', result.error);
      return;
    }

    if (result.csv && result.filename) {
      downloadCSV(result.csv, result.filename);
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
