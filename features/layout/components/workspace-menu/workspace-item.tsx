'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { UserRole } from '@prisma/client';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { CreateItemButton } from './create-item-button';
import { EditItemButton } from './edit-item-button';
import type { Item as ItemType } from '@/features/item/types';
import { ITEM_CONFIGS } from '@/features/item/constants';
import { getItemIcon } from '@/features/item/utils';
import { canManageStructure } from '@/lib/permissions';

/**
 * ドロップ位置の型
 */
type DropPosition = 'before' | 'after' | 'inside';

/**
 * アイテムコンポーネントのProps型
 */
type ItemProps = {
  item: ItemType;
  level?: number;
  overId?: string | null;
  dropPosition?: DropPosition;
  insideTargetId?: string | null;
  isUnderInsideTarget?: boolean;
  activeItem?: ItemType | null;
  userRole: UserRole;
};

/**
 * ワークスペースメニューのアイテムコンポーネント
 */
export function Item({
  item,
  level = 0,
  overId,
  dropPosition,
  insideTargetId,
  isUnderInsideTarget = false,
  activeItem,
  userRole,
}: ItemProps) {
  const [isOpen, setIsOpen] = useState(true);
  const Icon = getItemIcon(item);
  const config = ITEM_CONFIGS[item.type];
  const hasChildren =
    config.canHaveChildren && item.children && item.children.length > 0;
  const isOver = overId === item.id;

  const isInsideTarget = insideTargetId === item.id;
  const shouldHighlight = isInsideTarget || isUnderInsideTarget;

  // 同じ親を持つかチェック（青いラインを表示するかの判定用）
  const isSameParent =
    activeItem && isOver ? activeItem.parentId === item.parentId : false;
  const shouldShowLine = isOver && isSameParent && dropPosition !== 'inside';

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: item.id,
    data: {
      type: 'item',
      item,
    },
    disabled: !canManageStructure(userRole), // 権限がない場合はドラッグ不可
  });

  const { setNodeRef: setDropRef } = useDroppable({
    id: item.id,
    data: {
      type: 'item',
      item,
    },
    disabled: !canManageStructure(userRole), // 権限がない場合はドロップ不可
  });

  // refを結合
  const setNodeRef = (node: HTMLElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  const style = {
    opacity: isDragging ? 0.5 : 1,
  };

  // Workspace Menu Item
  if (level === 0) {
    return (
      <SidebarMenuItem ref={setNodeRef} style={style}>
        {/* ドロップインジケーター - 前 */}
        {shouldShowLine && dropPosition === 'before' && (
          <div className="h-0.5 bg-primary -mt-1 mb-1 rounded-full" />
        )}

        <SidebarMenuButton
          asChild
          className={
            shouldHighlight && dropPosition === 'inside' ? 'bg-primary/20' : ''
          }
        >
          <div
            {...(canManageStructure(userRole) ? attributes : {})}
            {...(canManageStructure(userRole) ? listeners : {})}
            className="flex items-center w-full group/item touch-none"
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="flex items-center justify-center shrink-0 rounded hover:bg-primary/10"
            >
              <Icon
                className={
                  config.showChevron
                    ? 'size-4 group-hover/item:hidden'
                    : 'size-4'
                }
              />
              {config.showChevron && (
                <ChevronRight
                  className={`size-4 hidden group-hover/item:block transition-transform duration-200 ${
                    isOpen ? 'rotate-90' : ''
                  }`}
                />
              )}
            </button>
            <Link href={`/${item.id}`} className="flex-1">
              <span>{item.name}</span>
            </Link>
            {canManageStructure(userRole) && (
              <EditItemButton
                itemId={item.id}
                itemName={item.name}
                itemType={item.type}
              />
            )}
            {canManageStructure(userRole) && config.showAddButton && (
              <CreateItemButton parentId={item.id} />
            )}
          </div>
        </SidebarMenuButton>

        {hasChildren && isOpen && (
          <SidebarMenuSub className="mr-0 pr-0">
            {item.children!.map((child: ItemType) => (
              <Item
                key={child.id}
                item={child}
                level={level + 1}
                overId={overId}
                dropPosition={dropPosition}
                insideTargetId={insideTargetId}
                isUnderInsideTarget={
                  shouldHighlight && dropPosition === 'inside'
                }
                activeItem={activeItem}
                userRole={userRole}
              />
            ))}
          </SidebarMenuSub>
        )}

        {/* ドロップインジケーター - 後（子なしまたは折りたたみ済み） */}
        {shouldShowLine &&
          dropPosition === 'after' &&
          (!hasChildren || !isOpen) && (
            <div className="h-0.5 bg-primary mt-1 -mb-1 rounded-full" />
          )}
        {/* ドロップインジケーター - 後（子が表示されている場合） */}
        {shouldShowLine &&
          dropPosition === 'after' &&
          hasChildren &&
          isOpen && (
            <div className="h-0.5 bg-primary mt-2 -mb-1 rounded-full" />
          )}
      </SidebarMenuItem>
    );
  }

  // Workspace Menu Sub Item
  return (
    <SidebarMenuSubItem ref={setNodeRef} style={style}>
      {/* ドロップインジケーター - 前 */}
      {shouldShowLine && dropPosition === 'before' && (
        <div className="h-0.5 bg-primary -mt-1 mb-1 rounded-full" />
      )}

      <SidebarMenuSubButton
        asChild
        className={
          shouldHighlight && dropPosition === 'inside' ? 'bg-primary/20' : ''
        }
      >
        <div
          {...(canManageStructure(userRole) ? attributes : {})}
          {...(canManageStructure(userRole) ? listeners : {})}
          className="flex items-center w-full group/item touch-none"
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="flex items-center justify-center shrink-0 rounded hover:bg-primary/10"
          >
            <Icon
              className={
                config.showChevron ? 'size-4 group-hover/item:hidden' : 'size-4'
              }
            />
            {config.showChevron && (
              <ChevronRight
                className={`size-4 hidden group-hover/item:block transition-transform duration-200 ${
                  isOpen ? 'rotate-90' : ''
                }`}
              />
            )}
          </button>
          <Link href={`/${item.id}`} className="flex-1">
            <span>{item.name}</span>
          </Link>
          {canManageStructure(userRole) && (
            <EditItemButton
              itemId={item.id}
              itemName={item.name}
              itemType={item.type}
            />
          )}
          {canManageStructure(userRole) && config.showAddButton && (
            <CreateItemButton parentId={item.id} />
          )}
        </div>
      </SidebarMenuSubButton>

      {hasChildren && isOpen && (
        <SidebarMenuSub className="mr-0 pr-0">
          {item.children!.map((child) => (
            <Item
              key={child.id}
              item={child}
              level={level + 1}
              overId={overId}
              dropPosition={dropPosition}
              insideTargetId={insideTargetId}
              isUnderInsideTarget={shouldHighlight && dropPosition === 'inside'}
              activeItem={activeItem}
              userRole={userRole}
            />
          ))}
        </SidebarMenuSub>
      )}

      {/* ドロップインジケーター - 後（子なしまたは折りたたみ済み） */}
      {shouldShowLine &&
        dropPosition === 'after' &&
        (!hasChildren || !isOpen) && (
          <div className="h-0.5 bg-primary mt-1 -mb-1 rounded-full" />
        )}
      {/* ドロップインジケーター - 後（子が表示されている場合） */}
      {shouldShowLine && dropPosition === 'after' && hasChildren && isOpen && (
        <div className="h-0.5 bg-primary mt-2 -mb-1 rounded-full" />
      )}
    </SidebarMenuSubItem>
  );
}
