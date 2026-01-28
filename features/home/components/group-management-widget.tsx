'use client';

import { Building2 } from 'lucide-react';
import { ActionCard } from './action-card';

export function GroupManagementWidget() {
  return (
    <ActionCard
      href="/groups"
      icon={Building2}
      title="グループ管理"
      description="組織構造に合わせて階層的なグループを作成。複雑な体制にフィットした効率的な管理を実現します。"
      color="text-indigo-500"
    />
  );
}
