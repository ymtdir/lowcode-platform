import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/features/layout/components/app-sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: data.user.email },
    select: { name: true },
  });

  const userName = user?.name || 'Unknown';

  return (
    <SidebarProvider>
      <AppSidebar userName={userName} />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
}
