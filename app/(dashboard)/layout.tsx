import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { DashboardLayoutClient } from '@/app/components/dashboard-layout-client';

export const metadata = {
  title: 'Dashboard | EnvArmor',
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
