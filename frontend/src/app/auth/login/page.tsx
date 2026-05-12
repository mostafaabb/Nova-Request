'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { PasswordInput } from '@/components/auth/PasswordInput';
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
      title="Sign in"
      description="Use your workspace account to sync collections, environments, and history across devices."
      footer={
        <>
          Need an account?{' '}
          <Link
            href="/auth/register"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <GoogleAuthSection />

        <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="login-email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 rounded-lg border-border/80 pl-10 text-[15px] shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="login-password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <PasswordInput
              id="login-password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 rounded-lg border-border/80 pl-10 text-[15px] shadow-sm"
            />
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className={cn(
            'w-full rounded-lg text-[15px] font-semibold shadow-md shadow-primary/15',
            'transition-shadow hover:shadow-lg hover:shadow-primary/10'
          )}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            'Sign in with email'
          )}
        </Button>
      </form>
      </div>
    </AuthPageLayout>
  );
}
