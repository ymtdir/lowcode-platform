import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { name } = (await prisma.user.findUnique({
    where: { email: user!.email },
    select: { name: true },
  })) ?? { name: null };

  const userName = name || 'Unknown';

  return (
    <SidebarProvider>
      <AppSidebar userName={userName} />
      <main className="w-full">
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
