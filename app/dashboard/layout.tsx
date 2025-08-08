import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  const supabase = createServiceClient();
  
  // Get user role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('clerk_user_id', user.id)
    .single();

  if (!roleData) {
    redirect('/onboarding');
  }

  const userEmail = user.emailAddresses?.[0]?.emailAddress;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar userRole={roleData.role} userEmail={userEmail} />
        <SidebarInset className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}