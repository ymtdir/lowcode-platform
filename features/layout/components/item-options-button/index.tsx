'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Ellipsis,
  FileOutput,
  FileInput,
  Package,
  Settings,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import type { ItemType } from '@prisma/client';
import { RenameItemOption } from '@/features/layout/components/workspace-menu/edit-item-button/rename-item-option';
import type { PageType } from './container';
import type { ExportColumnFilter } from '@/features/table/types/export';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { deleteItem } from '@/features/item/api';
import { exportTableAction } from '@/features/table/actions/export-table';
import { exportUsersAction } from '@/features/user/actions/export-users';
import { exportGroupsAction } from '@/features/group/actions/export-groups';
import { importTableAction } from '@/features/table/actions/import-table';
import { importGroupsAction } from '@/features/group/actions/import-groups';
import { importUsersAction } from '@/features/user/actions/import-users';
import { getItemById } from '@/features/item/api';
import { downloadCSV } from '@/lib/download';
import { ImportDialog } from '@/components/shared/import-dialog';
import { ExportItemDialog } from '@/features/item/components/export-item-dialog';
import { ImportItemDialog } from '@/features/item/components/import-item-dialog';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportItemDialogOpen, setExportItemDialogOpen] = useState(false);
  const [importItemDialogOpen, setImportItemDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemName, setItemName] = useState<string>('');

  // エクスポート可能なページタイプ
  const exportableTypes: PageType[] = ['TABLE', 'USERS', 'GROUPS'];

  // アイテム名を取得（TABLE/FOLDER用）
  useEffect(() => {
    if ((pageType !== 'TABLE' && pageType !== 'FOLDER') || !itemId) return;

    const fetchItemName = async () => {
      const item = await getItemById(itemId);
      if (item) {
        setItemName(item.name);
      }
    };
    fetchItemName();
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

  // 削除ハンドラー
  const handleDelete = async () => {
    if (!itemId) return;

    setIsDeleting(true);

    const result = await deleteItem(itemId);

    setDeleteDialogOpen(false);
    setIsDeleting(false);

    if (result.error) {
      toast.error('削除に失敗しました', {
        description: result.error,
      });
    } else {
      const itemLabel = pageType === 'TABLE' ? 'テーブル' : 'フォルダ';
      toast.success(`${itemLabel}を削除しました`, {
        description: `${itemName}を削除しました`,
      });
      router.push('/workspace');
    }
  };

  // 表示条件: エクスポート可能 または FOLDER
  if (!exportableTypes.includes(pageType) && pageType !== 'FOLDER') {
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
      toast.error('エクスポートに失敗しました', {
        description: result.error,
      });
      return;
    }

    if (result.csv && result.filename) {
      downloadCSV(result.csv, result.filename);
      toast.success('エクスポートが完了しました');
    }
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Ellipsis />
            <span className="sr-only">オプション</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {pageType === 'TABLE' && itemId && (
            <>
              <RenameItemOption
                itemId={itemId}
                itemType={'TABLE' as ItemType}
                currentName={itemName}
                onOpenChange={setDropdownOpen}
              />
              <DropdownMenuItem asChild>
                <Link href={`/${itemId}/edit`} className="cursor-pointer">
                  <Settings />
                  テーブル管理
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive hover:text-destructive focus:text-destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="text-destructive" />
                削除
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {pageType === 'FOLDER' && itemId && (
            <>
              <RenameItemOption
                itemId={itemId}
                itemType={'FOLDER' as ItemType}
                currentName={itemName}
                onOpenChange={setDropdownOpen}
              />
              <DropdownMenuItem asChild>
                <Link href={`/${itemId}/edit`} className="cursor-pointer">
                  <Settings />
                  フォルダ管理
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive hover:text-destructive focus:text-destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="text-destructive" />
                削除
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {(pageType === 'TABLE' || pageType === 'FOLDER') && itemId && (
            <>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setExportItemDialogOpen(true);
                }}
              >
                <Package />
                アイテムのエクスポート
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setImportItemDialogOpen(true);
                }}
              >
                <Package />
                アイテムのインポート
              </DropdownMenuItem>
            </>
          )}
          {exportableTypes.includes(pageType) && (
            <>
              <DropdownMenuItem onSelect={() => setImportDialogOpen(true)}>
                <FileInput />
                レコードのインポート
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleExport}>
                <FileOutput />
                レコードのエクスポート
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 削除確認ダイアログ */}
      {(pageType === 'TABLE' || pageType === 'FOLDER') && itemId && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center space-x-2">
                <AlertCircle className="text-destructive" />
                <AlertDialogTitle className="text-destructive">
                  {itemName}を削除
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription>
                削除した{pageType === 'TABLE' ? 'テーブル' : 'フォルダ'}
                は復元できません。
                <br />
                {pageType === 'TABLE' ? 'テーブル' : 'フォルダ'}
                内のすべてのデータが完全に削除されます。
                <br />
                本当に削除しますか？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                キャンセル
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60"
              >
                {isDeleting ? '削除中...' : '削除'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* アイテムエクスポートダイアログ */}
      {(pageType === 'TABLE' || pageType === 'FOLDER') && itemId && (
        <ExportItemDialog
          itemId={itemId}
          itemName={itemName}
          itemType={pageType}
          open={exportItemDialogOpen}
          onOpenChange={setExportItemDialogOpen}
        />
      )}

      {/* アイテムインポートダイアログ */}
      {(pageType === 'TABLE' || pageType === 'FOLDER') && itemId && (
        <ImportItemDialog
          parentId={pageType === 'FOLDER' ? itemId : null}
          open={importItemDialogOpen}
          onOpenChange={setImportItemDialogOpen}
        />
      )}

      {/* インポートダイアログ */}
      {pageType === 'TABLE' && itemId && (
        <ImportDialog
          title={`${itemName} - データインポート`}
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
