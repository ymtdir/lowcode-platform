'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { Column } from '../types/column';
import { ColumnListItem } from './column-list-item';
import { AddColumnDialog } from './add-column-dialog';
import { useState } from 'react';

type ColumnListProps = {
  itemId: string;
  columns: Column[];
};

/**
 * カラム一覧表示コンポーネント
 */
export function ColumnList({ itemId, columns }: ColumnListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>カラム</CardTitle>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            カラムを追加
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {columns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            カラムがまだありません
          </div>
        ) : (
          <div className="space-y-2">
            {columns.map((column) => (
              <ColumnListItem key={column.id} itemId={itemId} column={column} />
            ))}
          </div>
        )}
      </CardContent>

      <AddColumnDialog
        itemId={itemId}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        nextOrder={columns.length}
      />
    </Card>
  );
}
