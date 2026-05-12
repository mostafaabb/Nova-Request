'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { PasswordInput } from '@/components/auth/PasswordInput';
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
      title="Create your account"
      description="Join with Google or email. One profile powers shared workspaces, environments, and request history."
      mobileTagline="Start testing APIs with structure and speed."
      footer={
        <>
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <GoogleAuthSection />

        <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="register-name" className="text-sm font-medium text-foreground">
            Full name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="register-name"
              type="text"
              autoComplete="name"
              placeholder="Alex Morgan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="h-11 rounded-lg border-border/80 pl-10 text-[15px] shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="register-email" className="text-sm font-medium text-foreground">
            Work email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="register-email"
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
          <label htmlFor="register-password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <PasswordInput
              id="register-password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-11 rounded-lg border-border/80 pl-10 text-[15px] shadow-sm"
            />
          </div>
          <PasswordStrength password={password} />
        </div>

        <p className="text-[13px] leading-relaxed text-muted-foreground">
          By registering you can use team workspaces, sync collections, and keep execution history in one
          place.
        </p>

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
              Creating account…
            </>
          ) : (
            'Create account with email'
          )}
        </Button>
      </form>
      </div>
    </AuthPageLayout>
  );
}
