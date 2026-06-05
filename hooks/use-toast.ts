'use client';

export function useToast() {
  const toast = ({ title, description }: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
    if (typeof window !== 'undefined') {
      const message = description ? `${title}: ${description}` : title;
      window.console.log(`[toast] ${message}`);
    }
  };

  return { toast };
}
