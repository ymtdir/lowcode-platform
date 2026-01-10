import { LoginForm } from '@/features/auth/components';
import { getSettings } from '@/features/setting/api';

/**
 * ログインページ
 */
export default async function LoginPage() {
  const settings = await getSettings();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoginForm appIcon={settings.appIcon} appName={settings.appName} />
    </div>
  );
}
