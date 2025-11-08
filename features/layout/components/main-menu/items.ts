import { Home, Users, Building, Calendar, Settings } from 'lucide-react';

import type { MainMenuItem } from '../../types';

export const mainMenuItems: MainMenuItem[] = [
  {
    title: 'ホーム',
    url: '/',
    icon: Home,
  },
  {
    title: 'カレンダー',
    url: '#',
    icon: Calendar,
  },
  {
    title: 'ユーザー',
    url: '/users',
    icon: Users,
  },
  {
    title: 'グループ',
    url: '/groups',
    icon: Building,
  },
  {
    title: '設定',
    url: '#',
    icon: Settings,
  },
];
