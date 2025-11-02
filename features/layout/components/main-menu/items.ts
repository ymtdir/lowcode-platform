import { Home, Users, Building, Calendar, Settings } from 'lucide-react';

import type { MainMenuItem } from '../../types';

export const mainMenuItems: MainMenuItem[] = [
  {
    title: 'Home',
    url: '/',
    icon: Home,
  },
  {
    title: 'Users',
    url: '/users',
    icon: Users,
  },
  {
    title: 'Groups',
    url: '/groups',
    icon: Building,
  },
  {
    title: 'Calendar',
    url: '#',
    icon: Calendar,
  },
  {
    title: 'Settings',
    url: '#',
    icon: Settings,
  },
];
