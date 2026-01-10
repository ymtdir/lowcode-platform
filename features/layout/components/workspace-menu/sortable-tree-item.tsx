'use client';

import { createElement } from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { UserRole } from '@prisma/client';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { CreateItemButton } from './create-item-button';
import { EditItemButton } from './edit-item-button';
import { ITEM_CONFIGS } from '@/features/item/constants';
import { getItemIcon } from '@/features/item/utils';
import { canManageStructure } from '@/lib/permissions';
import type { FlattenedItem } from '@/features/layout/utils/sortable-tree-utils';

/**
 * ソート可能なツリーアイテムのProps型
 */
type SortableTreeItemProps = {
  item: FlattenedItem;
  depth: number;
  projected?: { depth: number; parentId: string | null };
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  userRole: UserRole;
  indentationWidth: number;
};

/**
 * ソート可能なツリーアイテムコンポーネント
 * 元のUIを維持しつつ、useSortableでスムーズなソートを実現
 */
export function SortableTreeItem({
  item,
  depth,
  projected,
  isExpanded,
  onToggleExpand,
  userRole,
  indentationWidth,
}: SortableTreeItemProps) {
  const IconComponent = getItemIcon(item);
  const config = ITEM_CONFIGS[item.type];
  const canEdit = canManageStructure(userRole);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: !canEdit,
  });

  // 投影された深さを使用（ドラッグ中）
  const displayDepth = projected?.depth ?? depth;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    paddingLeft: `${displayDepth * indentationWidth}px`,
  };

  return (
    <SidebarMenuItem
      ref={setNodeRef}
      style={style}
      className={
        displayDepth > 0 ? 'border-l border-sidebar-border ml-3.5 pl-2' : ''
      }
    >
      <SidebarMenuButton asChild>
        <div
          {...(canEdit ? attributes : {})}
          {...(canEdit ? listeners : {})}
          className="flex items-center w-full group/item touch-none"
        >
          {/* フォルダの場合は展開/折りたたみボタン */}
          {config.canHaveChildren ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleExpand(item.id);
              }}
              className="flex items-center justify-center shrink-0 rounded hover:bg-primary/10"
            >
              {createElement(IconComponent, {
                className: config.showChevron
                  ? 'size-4 group-hover/item:hidden'
                  : 'size-4',
              })}
              {config.showChevron && (
                <ChevronRight
                  className={`size-4 hidden group-hover/item:block transition-transform duration-200 ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              )}
            </button>
          ) : (
            <span className="flex items-center justify-center shrink-0">
              {createElement(IconComponent, { className: 'size-4' })}
            </span>
          )}

          <Link href={`/${item.id}`} className="flex-1">
            <span>{item.name}</span>
          </Link>

          {canEdit && (
            <EditItemButton
              itemId={item.id}
              itemName={item.name}
              itemType={item.type}
            />
          )}
          {canEdit && config.showAddButton && (
            <CreateItemButton parentId={item.id} />
          )}
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
