'use client';

import { Users } from 'lucide-react';
import { ActionCard } from './action-card';

export function UserManagementWidget() {
  return (
    <ActionCard
      href="/users"
      icon={Users}
      title="ユーザー管理"
      description="アカウントの発行と権限管理を一元化。メンバーを安全に迎え入れチームのコラボレーションを加速させます。"
      color="text-emerald-500"
    />
  );
}
