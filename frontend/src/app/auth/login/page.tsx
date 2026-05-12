'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { AuthPasswordField, AuthTextField } from '@/components/auth/AuthField';
import { GoogleAuthSection } from '@/components/auth/GoogleAuthSection';
import { Mail, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back');
      router.push('/dashboard');
    } catch (error: unknown) {
      const msg =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error ===
          'string'
          ? (error as { response: { data: { error: string } } }).response.data.error
          : 'Login failed';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout
      eyebrow="Secure access"
      title="Sign in to your workspace"
      description="Pick up where you left off — collections, environments, proxy runs, and history stay tied to your account."
      footer={
        <>
          Need an account?{' '}
          <Link
            href="/auth/register"
            className="font-semibold text-primary underline-offset-[5px] transition-colors hover:text-primary/85 hover:underline"
          >
            Create one free
          </Link>
        </>
      }
    >
      <div className="space-y-8">
        <GoogleAuthSection />

        <form onSubmit={handleSubmit} className="space-y-6">
          <AuthTextField
            id="login-email"
            label="Work email"
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <AuthPasswordField
            id="login-password"
            label="Password"
            icon={Lock}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

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
                Signing in…
              </>
            ) : (
              'Continue with email'
            )}
          </Button>
        </form>
      </div>
    </AuthPageLayout>
  );
}
