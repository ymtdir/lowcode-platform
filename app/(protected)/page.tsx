import { auth } from '@/lib/auth-config';
import { HomeClient } from './_components/home-client';

export const dynamic = 'force-dynamic';

/**
 * ホーム画面（旧ダッシュボード）
 */
export default async function HomePage() {
  const session = await auth();
  const userName = session?.user?.name || 'Guest';

  return <HomeClient userName={userName} />;
}
