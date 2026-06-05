import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  asChild?: boolean;
};

export function Button({ className, variant = 'default', size = 'default', asChild, ...props }: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition',
    variant === 'default' && 'bg-slate-200 text-slate-900 hover:bg-white',
    variant === 'outline' && 'border border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800',
    variant === 'ghost' && 'bg-transparent text-slate-100 hover:bg-slate-800',
    size === 'sm' && 'px-2 py-1 text-xs',
    size === 'lg' && 'px-4 py-3',
    className
  );

  if (asChild && React.isValidElement(props.children)) {
    const child = props.children as React.ReactElement<{ className?: string }>;
    return React.cloneElement(child, {
      className: cn(classes, child.props.className)
    });
  }

  return <button className={classes} {...props} />;
}
