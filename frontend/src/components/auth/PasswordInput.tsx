'use client';

import { forwardRef, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type PasswordInputProps = React.ComponentProps<typeof Input> & {
  wrapperClassName?: string;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, wrapperClassName, ...props }, ref) {
    const [show, setShow] = useState(false);

    return (
      <div className={cn('relative', wrapperClassName)}>
        <Input
          ref={ref}
          type={show ? 'text' : 'password'}
          className={cn('h-10 pr-10', className)}
          {...props}
        />
        <button
          type="button"
          className={cn(
            'absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md',
            'text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60'
          )}
          onClick={() => setShow((value) => !value)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
        >
          {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
