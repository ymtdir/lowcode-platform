'use client';

import { Settings } from 'lucide-react';
import { ActionCard } from './action-card';

export function SettingsWidget() {
  return (
    <ActionCard
      href="/settings"
      icon={Settings}
      title="設定"
      description="システム全体の設定やデザインをカスタマイズ。独自の業務要件に合わせてプラットフォームを最適化します。"
      color="text-purple-500"
    />
  );
}
