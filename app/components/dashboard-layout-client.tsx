'use client';

import { ReactNode, useState } from 'react';
import { Sidebar } from '@/app/components/dashboard/sidebar';
import { TopBar } from '@/app/components/dashboard/topbar';
import { cn } from '@/lib/utils';

export function DashboardLayoutClient({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-neo-bg bg-halftone text-neo-ink">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={cn("min-h-screen pt-16 lg:pt-0 transition-all duration-200", isCollapsed ? "lg:pl-20" : "lg:pl-64")}>
        <TopBar />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
