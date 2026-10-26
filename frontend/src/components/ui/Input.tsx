import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-9 w-full rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-[13px] text-foreground',
          'shadow-none transition-[background-color,border-color,box-shadow] duration-150',
          'placeholder:text-muted-foreground/65',
          'hover:border-border-strong',
          'focus:border-primary/60 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/15',
          'aria-[invalid=true]:border-destructive/70 aria-[invalid=true]:ring-destructive/15',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
