'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderOpen,
  ScanLine,
  KeyRound,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  BookOpen,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const navigationItems = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: FolderOpen,
  },
  {
    label: 'Scan History',
    href: '/scan-history',
    icon: ScanLine,
  },
  {
    label: 'Vault',
    href: '/vault',
    icon: KeyRound,
  },
  {
    label: 'CLI Docs',
    href: '/docs',
    icon: BookOpen,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export interface SidebarProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export function Sidebar({ isCollapsed = false, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [logoFallback, setLogoFallback] = useState(false);

  const collapsed = isCollapsed ?? localCollapsed;
  const toggleCollapsed = (val: boolean) => {
    if (setIsCollapsed) {
      setIsCollapsed(val);
    } else {
      setLocalCollapsed(val);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch {
      toast.error('Failed to log out');
    }
  };

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b-4 border-black bg-neo-bg px-4 lg:hidden">
        <Link href="/" className="flex items-center gap-2 border-4 border-black bg-neo-secondary px-3 py-1 shadow-neo-sm">
          {!logoFallback ? (
            <Image
              src="/EnvGuard.png"
              alt="EnvArmor"
              width={110}
              height={32}
              className="h-7 w-auto"
              onError={() => setLogoFallback(true)}
            />
          ) : (
            <span className="text-xs font-black uppercase tracking-[0.3em]">EnvArmor</span>
          )}
        </Link>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="border-4 border-black bg-white p-2 shadow-neo-sm"
        >
          {isMobileOpen ? <X className="h-5 w-5 stroke-[3px]" /> : <Menu className="h-5 w-5 stroke-[3px]" />}
        </button>
      </div>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed bottom-0 left-0 top-16 z-40 flex flex-col border-r-4 border-black bg-white transition-all duration-200 lg:top-0',
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0',
          collapsed && 'lg:w-20'
        )}
      >
        <div className="hidden h-16 items-center justify-between border-b-4 border-black bg-neo-secondary px-3 lg:flex">
          {!collapsed && (
            <Link href="/" className="border-4 border-black bg-white px-2 py-1 shadow-neo-sm">
              {!logoFallback ? (
                <Image
                  src="/EnvGuard.png"
                  alt="EnvArmor"
                  width={110}
                  height={32}
                  className="h-7 w-auto"
                  onError={() => setLogoFallback(true)}
                />
              ) : (
                <span className="text-xs font-black uppercase tracking-[0.3em]">EnvArmor</span>
              )}
            </Link>
          )}
          {!collapsed && (
            <button
              onClick={() => toggleCollapsed(true)}
              className="hidden border-4 border-black bg-white p-1 shadow-neo-sm lg:block"
            >
              <ChevronLeft className="h-4 w-4 stroke-[3px]" />
            </button>
          )}
          {collapsed && (
            <button
              onClick={() => toggleCollapsed(false)}
              className="hidden w-full border-4 border-black bg-white p-1 shadow-neo-sm lg:block"
            >
              <ChevronRight className="mx-auto h-4 w-4 stroke-[3px]" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-3">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 border-4 px-3 py-3 text-sm font-black uppercase tracking-wider transition-all duration-100',
                  isActive
                    ? 'border-black bg-neo-secondary shadow-neo-sm'
                    : 'border-transparent bg-white hover:border-black hover:bg-neo-bg hover:shadow-neo-sm'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0 stroke-[3px]" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t-4 border-black bg-neo-bg p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 border-4 border-black bg-neo-accent px-3 py-2 text-sm font-black uppercase tracking-wider text-white shadow-neo-sm transition-all duration-100 active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            <LogOut className="h-4 w-4 stroke-[3px]" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <div
        className={cn(
          'hidden transition-all duration-200 lg:block',
          collapsed ? 'w-20' : 'w-64'
        )}
      />
    </>
  );
}
