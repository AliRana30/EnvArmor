'use client';

import { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      const data = await res.json();
      if (res.ok && data.project) {
        toast.success('Project created successfully!');
        onClose();
        router.push(`/projects/${data.project.slug}`);
      } else {
        throw new Error(data.error || 'Failed to create project');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md border-8 border-black bg-white p-6 shadow-neo-lg relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 border-4 border-black bg-white p-1 hover:bg-neo-bg"
          aria-label="Close modal"
        >
          <X className="h-5 w-5 stroke-[3px]" />
        </button>

        <p className="mb-2 inline-flex border-4 border-black bg-neo-secondary px-2 py-0.5 text-xs font-black uppercase tracking-[0.2em] shadow-neo-sm text-black">
          Initialize
        </p>
        <h2 className="text-2xl font-black text-black uppercase tracking-tight mb-4">Create Project</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-black text-black uppercase text-xs mb-1">Project Name</label>
            <input
              type="text"
              placeholder="e.g. My Awesome App"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-4 border-black bg-white p-3 font-bold text-black outline-none transition-all placeholder:text-gray-400 focus:bg-neo-bg shadow-neo-sm"
              required
            />
          </div>

          <div>
            <label className="block font-black text-black uppercase text-xs mb-1">Description (Optional)</label>
            <textarea
              placeholder="Short summary of your repository..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border-4 border-black bg-white p-3 font-bold text-black outline-none transition-all placeholder:text-gray-400 focus:bg-neo-bg shadow-neo-sm h-24 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="border-4 border-black bg-white px-5 py-2.5 text-xs font-black uppercase tracking-widest text-black shadow-neo-sm hover:bg-neo-bg active:translate-x-0.5 active:translate-y-0.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 border-4 border-black bg-neo-accent px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 text-white" />
                  Create
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
