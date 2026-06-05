import * as React from 'react';
import { cn } from '@/lib/utils';

type DropdownMenuContentProps = React.HTMLAttributes<HTMLDivElement> & {
  align?: 'start' | 'end' | 'center';
};

type DropdownMenuItemProps = React.HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean;
};

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  return <div className="relative inline-block">{children}</div>;
}

export function DropdownMenuTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  if (asChild && React.isValidElement(children)) {
    return children;
  }
  return <button type="button">{children}</button>;
}

export function DropdownMenuContent({ className, ...props }: DropdownMenuContentProps) {
  return <div className={cn('absolute right-0 z-20 mt-2 min-w-40 rounded-md border border-slate-700 bg-slate-900 p-1', className)} {...props} />;
}

export function DropdownMenuItem({ className, asChild, children, ...props }: DropdownMenuItemProps) {
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>;
    return React.cloneElement(child, {
      className: cn('cursor-pointer rounded px-2 py-1 text-sm text-slate-200 hover:bg-slate-800', className, child.props.className)
    });
  }

  return (
    <div className={cn('cursor-pointer rounded px-2 py-1 text-sm text-slate-200 hover:bg-slate-800', className)} {...props}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn('my-1 border-slate-700', className)} {...props} />;
}
