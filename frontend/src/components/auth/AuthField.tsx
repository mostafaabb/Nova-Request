'use client';

import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const shell =
  'flex min-h-10 items-center rounded-lg border border-border bg-surface-2/60 transition-[border-color,box-shadow,background-color] duration-150 hover:border-border-strong focus-within:border-primary/60 focus-within:bg-surface focus-within:ring-2 focus-within:ring-primary/15';

const shellError =
  'border-destructive/70 focus-within:border-destructive/70 focus-within:ring-destructive/15';

const inputReset =
  'h-10 min-w-0 flex-1 border-0 bg-transparent px-0 text-[13px] shadow-none focus:border-0 focus:bg-transparent focus:ring-0';

interface AuthFieldProps {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
  hint?: string;
}

export function AuthTextField({
  id,
  label,
  type = 'text',
  icon: Icon,
  className,
  error,
  hint,
  ...props
}: React.ComponentProps<typeof Input> & AuthFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-[13px] font-medium text-foreground">
        {label}
      </label>
      <div className={cn(shell, error && shellError)}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center text-muted-foreground">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <Input
          id={id}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(inputReset, 'pr-3')}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-2xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function AuthPasswordField({
  id,
  label,
  icon: Icon,
  className,
  error,
  hint,
  ...props
}: React.ComponentProps<typeof PasswordInput> & AuthFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-[13px] font-medium text-foreground">
        {label}
      </label>
      <div className={cn(shell, error && shellError)}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center text-muted-foreground">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <PasswordInput
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          wrapperClassName="min-w-0 flex-1"
          className={cn(inputReset, 'h-10 w-full pr-1')}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-2xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
