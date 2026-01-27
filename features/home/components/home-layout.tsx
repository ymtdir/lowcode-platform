'use client';

import { WorkspaceWidget } from './workspace-widget';
import { UserManagementWidget } from './user-management-widget';
import { GroupManagementWidget } from './group-management-widget';
import { SettingsWidget } from './settings-widget';

type HomeLayoutProps = {
  userName: string;
};

export function HomeLayout({ userName }: HomeLayoutProps) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ようこそ {userName} さん</h1>
          <p className="text-muted-foreground mt-4">
            直感的な操作で、ビジネスを加速させるアプリケーションを構築しましょう。
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <WorkspaceWidget />
        <UserManagementWidget />
        <GroupManagementWidget />
        <SettingsWidget />
      </div>
    </div>
  );
}
