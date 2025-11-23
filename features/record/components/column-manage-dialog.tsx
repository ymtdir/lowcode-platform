'use client';

import { useState } from 'react';
import { Settings2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Column } from '@/features/column/types';
import { ColumnListItem } from '@/features/column/components/column-list-item';
import { AddColumnDialog } from '@/features/column/components/add-column-dialog';

type ColumnManageDialogProps = {
  itemId: string;
  columns: Column[];
};

/**
 * カラム管理ダイアログコンポーネント
 */
export function ColumnManageDialog({
  itemId,
  columns,
}: ColumnManageDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Settings2 />
            項目管理
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <DialogTitle>項目管理</DialogTitle>
              <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                項目を追加
              </Button>
            </div>
          </DialogHeader>
          <div className="mt-4">
            {columns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                項目がまだありません
              </div>
            ) : (
              <div className="space-y-2">
                {columns.map((column) => (
                  <ColumnListItem
                    key={column.id}
                    itemId={itemId}
                    column={column}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddColumnDialog
        itemId={itemId}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        nextOrder={columns.length}
      />
    </>
  );
}
