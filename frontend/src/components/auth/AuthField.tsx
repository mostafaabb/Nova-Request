'use client';

import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const shell =
  'flex min-h-[3rem] items-center gap-0 rounded-xl border border-border/70 bg-muted/[0.45] px-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-[border-color,box-shadow,background-color] duration-200 dark:bg-muted/25 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]';

const shellFocus =
  'focus-within:border-primary/50 focus-within:bg-background focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.12),inset_0_1px_0_rgba(255,255,255,0.06)] dark:focus-within:border-primary/45 dark:focus-within:bg-background/95';

const inputReset =
  'border-0 bg-transparent shadow-none ring-0 ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/65';

export function AuthTextField({
  id,
  label,
  type = 'text',
  icon: Icon,
  className,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string;
  icon: LucideIcon;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={id} className="block text-[13px] font-semibold tracking-wide text-foreground">
        {label}
      </label>
      <div className={cn(shell, shellFocus)}>
        <span className="flex h-10 w-11 shrink-0 items-center justify-center text-muted-foreground/85">
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <Input
          id={id}
          type={type}
          className={cn(inputReset, 'h-11 flex-1 px-0 pr-3 text-[15px]')}
          {...props}
        />
      </div>
    </div>
  );
}

export function AuthPasswordField({
  id,
  label,
  icon: Icon,
  className,
  ...props
}: React.ComponentProps<typeof PasswordInput> & {
  label: string;
  icon: LucideIcon;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={id} className="block text-[13px] font-semibold tracking-wide text-foreground">
        {label}
      </label>
      <div className={cn(shell, shellFocus)}>
        <span className="flex h-10 w-11 shrink-0 items-center justify-center text-muted-foreground/85">
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <PasswordInput
          id={id}
          wrapperClassName="min-w-0 flex-1"
          className={cn(inputReset, 'h-11 w-full px-0 pl-0 pr-1 text-[15px]')}
          {...props}
        />
      </div>
    </div>
  );
}
