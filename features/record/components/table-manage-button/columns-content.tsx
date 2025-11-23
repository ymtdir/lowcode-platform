'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Column } from '@/features/column/types';
import { ColumnListItem } from '@/features/column/components/column-list-item';
import { AddColumnDialog } from '@/features/column/components/add-column-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

type ColumnsContentProps = {
  itemId: string;
  columns: Column[];
};

/**
 * 項目管理コンテンツコンポーネント
 */
export function ColumnsContent({ itemId, columns }: ColumnsContentProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center p-4 border-b">
        <h2 className="text-lg font-semibold">項目</h2>
      </div>
      <ScrollArea className="overflow-y-auto p-4 ">
        <div className="space-y-3">
          {columns.map((column) => (
            <ColumnListItem key={column.id} itemId={itemId} column={column} />
          ))}
          {/* 項目を追加ボタン */}
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-2 w-full p-3 border border-dashed rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            <Plus className="size-4" />
            <span className="text-sm">項目を追加</span>
          </button>
        </div>
      </ScrollArea>

      <AddColumnDialog
        itemId={itemId}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        nextOrder={columns.length}
      />
    </>
  );
}
