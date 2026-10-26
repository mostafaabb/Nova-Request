import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex w-full rounded-lg border border-border bg-surface-2/60 px-3 py-2.5 text-[13px] text-foreground',
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

Textarea.displayName = 'Textarea';
