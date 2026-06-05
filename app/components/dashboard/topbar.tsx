'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { FolderKanban } from 'lucide-react';

export function TopBar() {
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [projects, setProjects] = useState<{ name: string; slug: string }[]>([]);

  const match = pathname.match(/^\/projects\/([^/]+)/);
  const currentSlug = match ? match[1] : null;

  useEffect(() => {
    if (currentSlug) {
      fetch('/api/v1/projects')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.projects) {
            setProjects(data.projects);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [currentSlug]);

  if (!user) {
    return null;
  }

  const plan = user.plan ?? 'FREE';
  const initials = (user.email || 'U').slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 w-full border-b-4 border-black bg-white">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          <h1 className="hidden text-sm font-black uppercase tracking-[0.3em] sm:block">Operations Center</h1>
          
          {currentSlug && projects.length > 0 && (
            <div className="flex items-center gap-2 border-4 border-black bg-white px-3 py-1.5 shadow-neo-sm">
              <FolderKanban className="h-4 w-4 stroke-[3px] text-black" />
              <select
                value={currentSlug}
                onChange={(e) => {
                  const newSlug = e.target.value;
                  const parts = pathname.split('/');
                  parts[2] = newSlug;
                  router.push(parts.join('/'));
                }}
                className="bg-transparent text-xs font-black uppercase tracking-wider text-black outline-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="inline-flex -rotate-1 border-4 border-black bg-neo-secondary px-3 py-2 text-xs font-black uppercase tracking-[0.3em] shadow-neo-sm">
            {plan} Plan
          </span>

          <div className="flex items-center gap-2 border-4 border-black bg-neo-bg px-2 py-1 shadow-neo-sm">
            <div className="flex h-8 w-8 items-center justify-center border-4 border-black bg-neo-muted">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.email} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-black uppercase">{initials}</span>
              )}
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-black uppercase tracking-[0.25em]">{user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
