'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Column } from '../types/column';
import { COLUMN_CONFIGS } from '../constants';
import { EditColumnItem } from './edit-column-item';
import { DeleteColumnItem } from './delete-column-item';

/**
 * カラムアイテムのProps型
 */
type ColumnItemProps = {
  itemId: string;
  column: Column;
  disabled?: boolean;
  onDeleted?: () => void;
  onUpdated?: (updated: {
    name: string;
    validation?: { required: boolean };
    config?: unknown;
  }) => void;
};

/**
 * カラムアイテムコンポーネント（ドラッグ&ドロップ対応）
 */
export function ColumnItem({
  itemId,
  column,
  disabled,
  onDeleted,
  onUpdated,
}: ColumnItemProps) {
  const [open, setOpen] = useState(false);
  const config = COLUMN_CONFIGS[column.type];
  const Icon = config.icon;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors ${
        isDragging ? 'opacity-50 shadow-lg z-50' : ''
      } ${disabled ? 'opacity-70' : ''}`}
    >
      {/* ドラッグハンドル */}
      <div
        {...attributes}
        {...listeners}
        className={`text-muted-foreground ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
      >
        <GripVertical className="size-4" />
      </div>

      {/* アイコン */}
      <div className="shrink-0">
        <Icon className="size-4 text-muted-foreground" />
      </div>

      {/* カラム名 */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <span className="font-medium truncate">{column.name}</span>
        {column.validation?.required && (
          <span className="text-xs text-destructive">*</span>
        )}
      </div>

      {/* カラムタイプ */}
      <div className="shrink-0 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
        {config.label}
      </div>

      {/* アクションメニュー */}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">メニューを開く</span>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom">
          <EditColumnItem
            itemId={itemId}
            column={column}
            onOpenChange={setOpen}
            onUpdated={onUpdated}
          />
          <DeleteColumnItem
            itemId={itemId}
            column={column}
            onOpenChange={setOpen}
            onDeleted={onDeleted}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
