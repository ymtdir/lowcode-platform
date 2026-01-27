'use client';

import { Database } from 'lucide-react';
import { ActionCard } from './action-card';

export function WorkspaceWidget() {
  return (
    <ActionCard
      href="/workspace"
      icon={Database}
      title="ワークスペース"
      description="ノーコードでデータベースとアプリを即座に構築。業務にフィットする専用ツールをスピーディに提供します。"
      color="text-blue-500"
    />
  );
}
