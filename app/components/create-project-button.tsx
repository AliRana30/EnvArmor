'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CreateProjectModal } from './create-project-modal';

export function CreateProjectButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex w-fit items-center gap-2 border-4 border-black bg-neo-accent px-5 py-3 text-sm font-black uppercase tracking-widest text-white shadow-neo-md active:translate-x-0.5 active:translate-y-0.5 hover:-translate-y-0.5 transition-all"
      >
        <Plus className="h-4 w-4 stroke-[3px] text-white" />
        New Project
      </button>
      <CreateProjectModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
