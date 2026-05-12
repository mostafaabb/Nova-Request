'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { AuthPasswordField, AuthTextField } from '@/components/auth/AuthField';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { GoogleAuthSection } from '@/components/auth/GoogleAuthSection';
import { User, Mail, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);

    try {
      await register(email, password, name);
      toast.success('Account created');
      router.push('/dashboard');
    } catch (error: unknown) {
      const msg =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error ===
          'string'
          ? (error as { response: { data: { error: string } } }).response.data.error
          : 'Registration failed';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout
      eyebrow="Get started"
      title="Create your Nova workspace"
      description="Google or email — either route spins up your profile, default workspace, and synced tooling in seconds."
      mobileTagline="Structure collections, environments, and runs without juggling scratchpads."
      footer={
        <>
          Already on Nova?{' '}
          <Link
            href="/auth/login"
            className="font-semibold text-primary underline-offset-[5px] transition-colors hover:text-primary/85 hover:underline"
          >
            Sign in instead
          </Link>
        </>
      }
    >
      <div className="space-y-8">
        <GoogleAuthSection />

        <form onSubmit={handleSubmit} className="space-y-6">
          <AuthTextField
            id="register-name"
            label="Full name"
            type="text"
            icon={User}
            autoComplete="name"
            placeholder="Alex Morgan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />

          <AuthTextField
            id="register-email"
            label="Work email"
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="space-y-3">
            <AuthPasswordField
              id="register-password"
              label="Password"
              icon={Lock}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <PasswordStrength password={password} />
          </div>

          <p className="rounded-xl border border-border/60 bg-muted/[0.35] px-4 py-3 text-[13px] leading-relaxed text-muted-foreground dark:bg-muted/15">
            Your workspace starts private. Invite teammates later from workspace settings when you are ready
            to collaborate.
          </p>

          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className={cn(
              'relative h-12 w-full overflow-hidden rounded-xl text-[15px] font-semibold tracking-tight',
              'bg-gradient-to-r from-primary to-primary shadow-[0_14px_40px_-16px_hsl(var(--primary))]',
              'transition-[filter,transform,box-shadow] duration-200 hover:brightness-[1.06] active:scale-[0.99]',
              'disabled:opacity-60 disabled:hover:brightness-100 disabled:active:scale-100'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating workspace…
              </>
            ) : (
              'Create workspace'
            )}
          </Button>
        </form>
      </div>
    </AuthPageLayout>
  );
}
