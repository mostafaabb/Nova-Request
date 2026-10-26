import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'outline';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'secondary',
      size = 'md',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[13px] font-medium',
          'transition-[background-color,border-color,color,box-shadow,transform] duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/65 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover active:translate-y-px':
              variant === 'default' || variant === 'primary',
            'border border-border bg-surface-2 text-foreground hover:border-border-strong hover:bg-surface-3 active:translate-y-px':
              variant === 'secondary',
            'border border-border bg-transparent text-foreground hover:bg-surface-2 active:translate-y-px':
              variant === 'outline',
            'text-muted-foreground hover:bg-surface-2 hover:text-foreground active:translate-y-px':
              variant === 'ghost',
            'border border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/15 active:translate-y-px':
              variant === 'destructive',
          },
          {
            'h-7 px-2 text-xs': size === 'xs',
            'h-8 px-2.5 text-xs': size === 'sm',
            'h-9 px-3.5': size === 'md',
            'h-10 px-4 text-sm': size === 'lg',
            'h-9 w-9 p-0': size === 'icon',
          },
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
