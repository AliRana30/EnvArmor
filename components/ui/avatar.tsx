import * as React from 'react';
import { cn } from '@/lib/utils';

export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-800', className)} {...props} />;
}

export function AvatarImage({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img className={cn('h-full w-full object-cover', className)} {...props} />;
}

export function AvatarFallback({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('text-xs text-slate-100', className)} {...props} />;
}
