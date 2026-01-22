import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { canManageSettings } from '@/lib/permissions';
import { getSettings } from '@/features/setting/api';
import { getStyles, extractStyles } from '@/features/style';
import { getScripts, extractScripts } from '@/features/script';
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

  const [settings, globalStylesResult, globalScriptsResult] = await Promise.all([
    getSettings(),
    getStyles(null),
    getScripts(null),
  ]);

  // グローバルスタイル・スクリプトデータの展開
  const globalStyles = extractStyles(globalStylesResult);
  const globalScripts = extractScripts(globalScriptsResult);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">アプリケーション設定</h1>
      </div>

      <SettingsForm
        initialSettings={settings}
        initialGlobalStyles={globalStyles}
        initialGlobalScripts={globalScripts}
      />
    </div>
  );
}
