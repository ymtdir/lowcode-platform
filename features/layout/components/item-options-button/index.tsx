'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { importTableAction } from '@/features/table/actions/import-table';
import { importGroupsAction } from '@/features/group/actions/import-groups';
import { importUsersAction } from '@/features/user/actions/import-users';
import { getItemById } from '@/features/item/api';
import { downloadCSV } from '@/lib/csv';
import { ImportDialog } from '@/components/shared/import-dialog';

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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [tableName, setTableName] = useState<string>('');

  // エクスポート可能なページタイプ
  const exportableTypes: PageType[] = ['TABLE', 'USERS', 'GROUPS'];

  // テーブル名を取得（TABLE用）
  useEffect(() => {
    if (pageType !== 'TABLE' || !itemId) return;

    const fetchTableName = async () => {
      const item = await getItemById(itemId);
      if (item) {
        setTableName(item.name);
      }
    };
    fetchTableName();
  }, [pageType, itemId]);

  // インポート実行関数
  const handleImport = useCallback(
    async (csvContent: string) => {
      if (pageType === 'TABLE' && itemId) {
        return await importTableAction(itemId, csvContent);
      } else if (pageType === 'GROUPS') {
        return await importGroupsAction(csvContent);
      } else if (pageType === 'USERS') {
        return await importUsersAction(csvContent);
      }
      throw new Error('Unknown page type');
    },
    [pageType, itemId]
  );

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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Ellipsis />
            <span className="sr-only">オプション</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setImportDialogOpen(true)}>
            <FileInput />
            インポート
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleExport}>
            <FileOutput />
            エクスポート
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* インポートダイアログ */}
      {pageType === 'TABLE' && itemId && (
        <ImportDialog
          title={`${tableName} - データインポート`}
          description="CSVファイルからレコードデータを一括インポートします"
          previewMessage={(count) => `${count}件のレコードをインポートします`}
          noticeMessage="レコードIDが存在する場合は既存レコードを更新、存在しない場合は新規作成します"
          onImport={handleImport}
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImportSuccess={() => window.location.reload()}
        />
      )}

      {pageType === 'GROUPS' && (
        <ImportDialog
          title="グループ管理 - データインポート"
          description="CSVファイルからグループデータを一括インポートします"
          previewMessage={(count) => `${count}件のグループをインポートします`}
          noticeMessage="グループIDが存在する場合は既存グループを更新、存在しない場合は新規作成します"
          onImport={handleImport}
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImportSuccess={() => window.location.reload()}
        />
      )}

      {pageType === 'USERS' && (
        <ImportDialog
          title="ユーザー管理 - データインポート"
          description="CSVファイルからユーザーデータを一括インポートします"
          previewMessage={(count) => `${count}件のユーザーをインポートします`}
          noticeMessage="ユーザーIDが存在する場合は既存ユーザーを更新、メールアドレスが重複する場合はスキップ、それ以外は新規作成します"
          onImport={handleImport}
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImportSuccess={() => window.location.reload()}
        />
      )}
    </>
  );
}
