'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Column } from '@/features/column/types';
import { ColumnItem } from '@/features/column/components/column-item';
import { AddColumnDialog } from '@/features/column/components/add-column-dialog';
import { reorderColumns } from '@/features/column/api';

/**
 * ColumnsContentのProps型
 */
type ColumnsContentProps = {
  itemId: string;
  columns: Column[];
};

/**
 * 項目管理コンテンツコンポーネント
 */
export function ColumnsContent({ itemId, columns }: ColumnsContentProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [localColumns, setLocalColumns] = useState(columns);
  const [isPending, startTransition] = useTransition();

  // DnDセンサーの設定
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // カラム削除時のハンドラ
  const handleColumnDeleted = (columnId: string) => {
    setLocalColumns((prev) => prev.filter((col) => col.id !== columnId));
  };

  // カラム更新時のハンドラ
  const handleColumnUpdated = (
    columnId: string,
    updated: { name: string; validation?: { required: boolean } }
  ) => {
    setLocalColumns((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? { ...col, name: updated.name, validation: updated.validation }
          : col
      )
    );
  };

  // ドラッグ終了時のハンドラ
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localColumns.findIndex((col) => col.id === active.id);
      const newIndex = localColumns.findIndex((col) => col.id === over.id);

      // 楽観的更新
      const newColumns = [...localColumns];
      const [movedColumn] = newColumns.splice(oldIndex, 1);
      newColumns.splice(newIndex, 0, movedColumn);
      setLocalColumns(newColumns);

      // サーバーに保存
      const orderedIds = newColumns.map((col) => col.id);
      startTransition(async () => {
        const result = await reorderColumns(itemId, orderedIds);
        if (result.error) {
          console.error('並び替えエラー:', result.error);
          // エラー時は元に戻す
          setLocalColumns(columns);
        }
      });
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localColumns.map((col) => col.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3 max-w-2xl">
            {localColumns.map((column) => (
              <ColumnItem
                key={column.id}
                itemId={itemId}
                column={column}
                disabled={isPending}
                onDeleted={() => handleColumnDeleted(column.id)}
                onUpdated={(updated) => handleColumnUpdated(column.id, updated)}
              />
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
        </SortableContext>
      </DndContext>

      <AddColumnDialog
        itemId={itemId}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        nextOrder={localColumns.length}
      />
    </>
  );
}
