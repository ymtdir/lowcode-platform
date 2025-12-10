import type { UserRole } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { AppSidebar } from '@/features/layout/components/app-sidebar';
import { BreadcrumbContainer } from '@/features/layout/components/breadcrumb/container';

/**
 * 保護されたレイアウトコンポーネント（認証必須）
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  // 認証済みの場合のみユーザー情報を表示
  const userName = currentUser?.name || 'Unknown';
  const userRole: UserRole = currentUser?.role || 'MEMBER';

  return (
    <SidebarProvider>
      <AppSidebar userName={userName} userRole={userRole} />
      <main className="w-full overflow-hidden">
        <div className="flex items-center gap-2 m-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <BreadcrumbContainer />
        </div>
        {children}
      </main>
    </SidebarProvider>
  );
}
