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
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 active:scale-[0.98]': variant === 'default' || variant === 'primary',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]': variant === 'secondary',
            'hover:bg-accent hover:text-accent-foreground active:scale-[0.98]': variant === 'ghost',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]': variant === 'destructive',
            'border border-input bg-background/70 shadow-sm hover:bg-accent hover:text-accent-foreground active:scale-[0.98]': variant === 'outline',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-11 px-6 text-base': size === 'lg',
            'h-9 w-9': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
