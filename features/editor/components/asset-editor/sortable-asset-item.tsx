'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Asset } from '@/features/editor/types/asset';
import { EditAssetButton } from './edit-asset-button';

/**
 * ソート可能なアセットアイテムのProps型
 */
export type SortableAssetItemProps = {
  asset: Asset;
  isSelected: boolean;
  hasUnsavedChanges: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, newName: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
};

/**
 * ソート可能なアセットアイテムコンポーネント
 */
export function SortableAssetItem({
  asset,
  isSelected,
  hasUnsavedChanges,
  onSelect,
  onRename,
  onDelete,
}: SortableAssetItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: asset.id });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleRename = async (newName: string) => {
    await onRename(asset.id, newName);
  };

  const handleDelete = async () => {
    await onDelete(asset.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-1 px-3 py-1.5 hover:bg-muted/50 transition-colors group/asset cursor-grab touch-none ${
        isSelected ? 'bg-muted border-l-2 border-primary' : ''
      }`}
    >
      {/* 名前（クリック可能） */}
      <button
        onClick={() => onSelect(asset.id)}
        className="flex-1 text-left text-sm truncate cursor-pointer"
      >
        {asset.name}
      </button>

      {/* 未保存マーク */}
      {hasUnsavedChanges && (
        <span
          className="w-2 h-2 rounded-full bg-orange-500 shrink-0"
          title="未保存の変更あり"
        />
      )}

      {/* 3点メニュー */}
      <EditAssetButton
        assetName={asset.name}
        onRename={handleRename}
        onDelete={handleDelete}
      />
    </div>
  );
}
