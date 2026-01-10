import { createElement } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getItemIcon } from '@/features/item/utils';
import { ITEM_CONFIGS } from '@/features/item/constants';
import type { Item } from '@/features/item/types';

type ItemCardContentProps = {
  item: Item;
  isDropTarget?: boolean;
  isOverlay?: boolean;
};

/**
 * アイテムカードのコンテンツ（表示部分）
 *
 * DragOverlay（ドラッグ中のプレビュー）とSortableItemCard（実際のグリッドアイテム）で
 * 共通して使用されるpresentational componentです。
 */
export function ItemCardContent({
  item,
  isDropTarget = false,
  isOverlay = false,
}: ItemCardContentProps) {
  const Icon = getItemIcon(item);
  const DefaultIcon = ITEM_CONFIGS[item.type].icon;

  return (
    <Card
      className={`group flex flex-col h-full p-4 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
        isDropTarget
          ? 'bg-primary/10 scale-105'
          : isOverlay
            ? 'bg-background shadow-xl ring-1 ring-border cursor-grabbing scale-105'
            : 'hover:bg-accent/50 hover:shadow-md'
      }`}
    >
      <div className="flex justify-end mb-2">
        <Badge variant="secondary" className="flex items-center">
          <DefaultIcon className="size-5!" />
        </Badge>
      </div>
      <div className="flex-1 flex items-center justify-center">
        {createElement(Icon, {
          className:
            'size-12 text-primary transition-transform group-hover:scale-110',
        })}
      </div>
      <div className="text-center mt-2">
        <h2 className="font-semibold text-lg line-clamp-2">{item.name}</h2>
      </div>
    </Card>
  );
}

type SortableItemCardProps = {
  item: Item;
  isDropTarget?: boolean;
  preventClick?: boolean;
  canEdit?: boolean;
};

/**
 * ドラッグ&ドロップ可能なアイテムカード
 *
 * グリッド表示画面（WorkspaceLayout, FolderLayout）で使用される、
 * 並び替え可能なカード型コンポーネントです。
 * クリックでそのアイテムへの遷移、ドラッグで並び替えやフォルダ移動が可能です。
 */
export function SortableItemCard({
  item,
  isDropTarget = false,
  preventClick = false,
  canEdit = true,
}: SortableItemCardProps) {
  const router = useRouter();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !canEdit });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1, // ドラッグ元の透明度を下げる
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!preventClick && !isDragging) {
      router.push(`/${item.id}`);
    }
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none cursor-pointer w-full text-left group"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
      type="button"
    >
      <ItemCardContent item={item} isDropTarget={isDropTarget} />
    </button>
  );
}
