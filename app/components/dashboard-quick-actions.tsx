'use client';

import { useState } from 'react';
import { CreateProjectModal } from './create-project-modal';
import Link from 'next/link';

export function DashboardQuickActions() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="mt-6 space-y-4">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full border-4 border-white bg-white px-4 py-3 text-left font-black uppercase tracking-widest text-black hover:bg-neo-secondary transition-all active:translate-x-1 active:translate-y-1"
        >
          New Project
        </button>
        <Link
          href="/docs"
          className="block w-full border-4 border-white bg-transparent px-4 py-3 text-left font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-colors"
        >
          Scan CLI Docs
        </Link>
        <div className="mt-8 border-2 border-white/20 p-4 font-mono text-xs text-white/60">
          <p>// CLI Shortcut</p>
          <p className="mt-2 text-neo-secondary">$ envarmor scan</p>
        </div>
      </div>
      <CreateProjectModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
