import type { LucideIcon } from 'lucide-react';
import type { UserRole } from '@prisma/client';

/**
 * メインメニューアイテムの型
 */
export type MainMenuItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  requiredRole?: UserRole;
};
