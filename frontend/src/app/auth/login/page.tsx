'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { AuthPasswordField, AuthTextField } from '@/components/auth/AuthField';
import { GoogleAuthSection } from '@/components/auth/GoogleAuthSection';
import { getApiErrorMessage } from '@/lib/utils';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = 'Enter the email address for your account.';
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Enter your password.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back');
      router.push('/dashboard');
    } catch (error: unknown) {
      setFormError(getApiErrorMessage(error, 'Could not sign in. Check your email and password.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout
      eyebrow="Sign in"
      title="Welcome back to Nova"
      description="Sign in to pick up your collections, environments, and recent requests."
      footer={
        <>
          New to Nova?{' '}
          <Link
            href="/auth/register"
            className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary"
          >
            Create an account
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <GoogleAuthSection />

        {formError ? (
          <div
            className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/[0.07] px-3 py-2.5"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden />
            <p className="text-xs leading-relaxed text-destructive">{formError}</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <AuthTextField
            id="login-email"
            label="Email"
            type="email"
            icon={Mail}
            autoComplete="email"
            inputMode="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (errors.email) setErrors((previous) => ({ ...previous, email: undefined }));
            }}
            error={errors.email}
            required
          />

          <AuthPasswordField
            id="login-password"
            label="Password"
            icon={Lock}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (errors.password) setErrors((previous) => ({ ...previous, password: undefined }));
            }}
            error={errors.password}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="mt-1 w-full"
            loading={isLoading}
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
            {!isLoading ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
          </Button>
        </form>

        <p className="text-center text-2xs leading-relaxed text-muted-foreground">
          By continuing you agree to keep your workspace access secure. Sign out from the account
          menu on shared devices.
        </p>
      </div>
    </AuthPageLayout>
  );
}
