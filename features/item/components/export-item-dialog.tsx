'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { exportItemAction } from '@/features/item/actions/export-item';
import { downloadJSON } from '@/lib/download';
import type { ItemExportOptions } from '@/features/item/types';

/**
 * エクスポートダイアログのProps型
 */
type ExportItemDialogProps = {
  itemId: string;
  itemName: string;
  itemType: 'TABLE' | 'FOLDER';
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * アイテムエクスポートオプションダイアログ
 */
export function ExportItemDialog({
  itemId,
  itemName,
  itemType,
  open,
  onOpenChange,
}: ExportItemDialogProps) {
  const [includeChildren, setIncludeChildren] = useState(true);
  const [includeRecords, setIncludeRecords] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const options: ItemExportOptions = {
        includeChildren,
        includeRecords,
      };

      const result = await exportItemAction(itemId, options);

      if (result.error) {
        toast.error('エクスポートに失敗しました', {
          description: result.error,
        });
        return;
      }

      if (result.json && result.filename) {
        downloadJSON(result.json, result.filename);
        toast.success('エクスポートが完了しました');
        onOpenChange(false);
      }
    } catch {
      toast.error('エクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{itemName} をエクスポート</DialogTitle>
          <DialogDescription>
            アイテムの定義をJSON形式でエクスポートします
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {itemType === 'FOLDER' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeChildren"
                checked={includeChildren}
                onCheckedChange={(checked) =>
                  setIncludeChildren(checked === true)
                }
              />
              <Label htmlFor="includeChildren" className="font-normal">
                子アイテムを含める
              </Label>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeRecords"
              checked={includeRecords}
              onCheckedChange={(checked) => setIncludeRecords(checked === true)}
            />
            <Label htmlFor="includeRecords" className="font-normal">
              レコードを含める
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            キャンセル
          </Button>
          <Button
            className="cursor-pointer"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'エクスポート中...' : 'エクスポート'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
