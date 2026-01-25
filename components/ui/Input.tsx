'use client';

import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export function Input({ label, error, className, id, icon: Icon, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground transition-all',
            'focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20',
            'hover:border-border/80',
            Icon && 'pl-9',
            error && 'border-danger/50 focus:border-danger focus:ring-danger/20',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
