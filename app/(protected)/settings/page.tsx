import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { canManageSettings } from '@/lib/permissions';
import { getSettings } from '@/features/setting/api';
import { getStyles } from '@/features/style';
import { SettingsForm } from '@/features/setting/components/settings-form';

export const dynamic = 'force-dynamic';

/**
 * アプリケーション設定ページ
 * ADMINロールのみアクセス可能
 */
export default async function SettingsPage() {
  // 権限チェック
  const currentUser = await getCurrentUser();
  if (!currentUser || !canManageSettings(currentUser.role)) {
    redirect('/');
  }

  const [settings, globalStyles] = await Promise.all([
    getSettings(),
    getStyles(null),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">アプリケーション設定</h1>
      </div>

      <SettingsForm
        initialSettings={settings}
        initialGlobalStyles={globalStyles}
      />
    </div>
  );
}
