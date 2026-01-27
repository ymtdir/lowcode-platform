import { auth } from '@/lib/auth-config';
import { HomeLayout } from '@/features/home/components/home-layout';

export const dynamic = 'force-dynamic';

/**
 * ホーム画面
 */
export default async function HomePage() {
  const session = await auth();
  const userName = session?.user?.name || 'Guest';

  return <HomeLayout userName={userName} />;
}
