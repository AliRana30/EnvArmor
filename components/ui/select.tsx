import * as React from 'react';
import { cn } from '@/lib/utils';

type SelectProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
};

export function Select({ children }: SelectProps) {
  return <div>{children}</div>;
}

export function SelectTrigger({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cn('w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-left text-sm text-slate-100', className)} {...props}>
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span>{placeholder}</span>;
}

export function SelectContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-1 space-y-1 rounded-md border border-slate-700 bg-slate-900 p-1', className)} {...props} />;
}

type SelectItemProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: string;
};

export function SelectItem({ className, children, ...props }: SelectItemProps) {
  return <div className={cn('cursor-pointer rounded px-2 py-1 text-sm text-slate-200 hover:bg-slate-800', className)} {...props}>{children}</div>;
}
