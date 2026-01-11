import { Home, Users, Building, Settings } from 'lucide-react';

import type { MainMenuItem } from '../../types';

/**
 * メインメニューアイテムの配列
 */
export const mainMenuItems: MainMenuItem[] = [
  {
    title: 'ホーム',
    url: '/',
    icon: Home,
  },
  // {
  //   title: 'カレンダー',
  //   url: '#',
  //   icon: Calendar,
  // },
  {
    title: 'ユーザー',
    url: '/users',
    icon: Users,
    requiredRole: 'ADMIN',
  },
  {
    title: 'グループ',
    url: '/groups',
    icon: Building,
    requiredRole: 'ADMIN',
  },
  {
    title: '設定',
    url: '/settings',
    icon: Settings,
    requiredRole: 'ADMIN',
  },
];
