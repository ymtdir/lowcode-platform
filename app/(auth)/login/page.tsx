import { LoginForm } from '@/features/auth/components';
import { getSettings } from '@/features/setting/api';
import { isGuestLoginEnabled } from '@/features/auth/api';

/**
 * ログインページ
 */
export default async function LoginPage() {
  const settings = await getSettings();
  const guestLoginEnabled = await isGuestLoginEnabled();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoginForm
        appIcon={settings.appIcon}
        appName={settings.appName}
        isGuestLoginEnabled={guestLoginEnabled}
      />
    </div>
  );
}
