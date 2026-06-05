'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';


export default function DeleteProjectButton({ projectSlug }: { projectSlug: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectSlug}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Project deleted successfully');
        router.push('/projects');
        router.refresh();
      } else {
        throw new Error(data.error || 'Failed to delete project');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting project');
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="border-4 border-black bg-neo-accent p-4 text-white shadow-neo-sm space-y-3">
        <p className="text-xs font-black uppercase tracking-widest">Are you absolutely sure?</p>
        <p className="text-xs font-bold">This will permanently delete this project and all associated scan history events and secrets.</p>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 border-2 border-white bg-white text-black py-2 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1"
          >
            {deleting ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Deleting...
              </>
            ) : (
              'Yes, Delete'
            )}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={deleting}
            className="flex-1 border-2 border-white bg-transparent text-white py-2 text-xs font-black uppercase tracking-wider"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex w-full items-center justify-center gap-2 border-4 border-black bg-neo-accent px-4 py-3 text-sm font-black uppercase tracking-widest text-white shadow-neo-sm transition-all duration-100 hover:bg-red-700 hover:shadow-none"
    >
      <Trash2 className="h-4 w-4" />
      Delete Project
    </button>
  );
}
