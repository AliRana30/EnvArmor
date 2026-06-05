'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

const navLinks = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Projects', href: '/projects' },
  { name: 'Blog', href: '/blog/ai-env-leak' },
  { name: 'Stats', href: '/stats' },
];

export function Navbar() {
  const pathname = usePathname();
  
  const isDashboardRoute = pathname.startsWith('/dashboard') || 
                           pathname.startsWith('/projects') || 
                           pathname.startsWith('/scan-history') || 
                           pathname.startsWith('/vault') || 
                           pathname.startsWith('/settings');

  if (isDashboardRoute) return null;

  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // getSession is safer for initial client-side check as it avoids 
        // unnecessary network calls if the session is already in memory/storage
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (isMounted) setUser(session?.user ?? null);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn("Supabase connectivity issue detected in Navbar. Check your internet or Supabase project status.");
        }
      }
    };
    
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
    } catch (err) {
      toast.error('Failed to log out');
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b-8 border-black bg-neo-bg py-4">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3 transition-all hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1">
            <Image
              src="/EnvGuard.png"
              alt="EnvArmor"
              width={180}
              height={60}
              className="h-12 w-auto"
              priority
            />
          </Link>
          
          {/* Desktop Links */}
          <div className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-black uppercase tracking-widest transition-colors hover:text-neo-accent ${
                  pathname === link.href ? 'border-b-4 border-black' : ''
                }`}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 border-4 border-black bg-neo-accent px-6 py-2 text-sm font-black uppercase tracking-widest text-white shadow-neo-sm transition-all hover:-translate-y-0.5 hover:shadow-neo-md active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="border-4 border-black bg-[#eab308] px-6 py-2 text-sm font-black uppercase tracking-widest shadow-neo-sm transition-all hover:-translate-y-0.5 hover:shadow-neo-md active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-12 w-12 items-center justify-center border-4 border-black bg-white shadow-neo-sm lg:hidden"
          >
            {isOpen ? <X className="h-6 w-6 stroke-[3px]" /> : <Menu className="h-6 w-6 stroke-[3px]" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="mt-4 flex flex-col gap-4 border-t-4 border-black pt-4 lg:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`text-sm font-black uppercase tracking-widest ${
                  pathname === link.href ? 'text-neo-accent' : ''
                }`}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="flex items-center justify-center gap-2 border-4 border-black bg-neo-accent px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-neo-sm"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="border-4 border-black bg-[#eab308] px-6 py-3 text-center text-sm font-black uppercase tracking-widest shadow-neo-sm"
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
