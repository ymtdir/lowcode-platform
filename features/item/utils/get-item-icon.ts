import * as LucideIcons from 'lucide-react';
import { ITEM_CONFIGS } from '../constants/item-config';
import type { Item } from '../types';

/**
 * Itemの表示アイコンを取得する
 *
 * カスタムアイコンが設定されている場合はそれを優先、
 * 未設定の場合はタイプのデフォルトアイコンを返す
 *
 * @param item - アイテムオブジェクト
 * @returns Lucideアイコンコンポーネント
 *
 * @example
 * ```tsx
 * const Icon = getItemIcon(item);
 * return <Icon className="size-4" />;
 * ```
 */
export function getItemIcon(item: Item): LucideIcons.LucideIcon {
  // カスタムアイコンが設定されている場合
  if (item.icon && item.icon.trim() !== '') {
    const CustomIcon = LucideIcons[item.icon as keyof typeof LucideIcons];
    // 有効なLucideアイコンかチェック（objectまたはfunctionの場合はReactコンポーネント）
    if (
      CustomIcon &&
      (typeof CustomIcon === 'object' || typeof CustomIcon === 'function')
    ) {
      return CustomIcon as LucideIcons.LucideIcon;
    }
  }

  // デフォルトアイコン（タイプに応じた固定アイコン）
  return ITEM_CONFIGS[item.type].icon;
}
