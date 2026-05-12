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
          className={cn('h-11 pr-11', className)}
          {...props}
        />
        <button
          type="button"
          className={cn(
            'absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md',
            'text-muted-foreground hover:bg-muted hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset'
          )}
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
