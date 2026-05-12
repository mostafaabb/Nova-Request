import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-semibold transition-smooth',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/95 active:scale-[0.98] hover:shadow-lg hover:shadow-primary/30': variant === 'default' || variant === 'primary',
            'bg-secondary text-secondary-foreground shadow-sm shadow-secondary/20 hover:bg-secondary/90 active:scale-[0.98]': variant === 'secondary',
            'text-foreground hover:bg-muted hover:text-foreground active:scale-[0.98]': variant === 'ghost',
            'bg-destructive text-destructive-foreground shadow-sm shadow-destructive/20 hover:bg-destructive/90 active:scale-[0.98]': variant === 'destructive',
            'border border-input bg-background shadow-sm hover:bg-muted hover:border-foreground/20 active:scale-[0.98]': variant === 'outline',
          },
          {
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-11 px-6 text-base': size === 'lg',
            'h-9 w-9 p-0': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
