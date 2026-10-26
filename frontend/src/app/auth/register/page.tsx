'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Lock, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { AuthPasswordField, AuthTextField } from '@/components/auth/AuthField';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { GoogleAuthSection } from '@/components/auth/GoogleAuthSection';
import { getApiErrorMessage } from '@/lib/utils';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState('');

  const validate = () => {
    const next: { name?: string; email?: string; password?: string } = {};
    if (!name.trim()) next.name = 'Enter your name.';
    else if (name.trim().length < 2) next.name = 'Your name needs at least 2 characters.';
    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Choose a password.';
    else if (password.length < 6) next.password = 'Use at least 6 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      await register(email.trim(), password, name.trim());
      toast.success('Workspace created');
      router.push('/dashboard');
    } catch (error: unknown) {
      setFormError(
        getApiErrorMessage(error, 'Could not create your account. Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout
      eyebrow="Create account"
      title="Start your Nova workspace"
      description="A private workspace for your API requests, environments, and documentation."
      footer={
        <>
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary"
          >
            Sign in
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
            id="register-name"
            label="Full name"
            type="text"
            icon={User}
            autoComplete="name"
            placeholder="Alex Morgan"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (errors.name) setErrors((previous) => ({ ...previous, name: undefined }));
            }}
            error={errors.name}
            required
            minLength={2}
          />

          <AuthTextField
            id="register-email"
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

          <div className="space-y-2">
            <AuthPasswordField
              id="register-password"
              label="Password"
              icon={Lock}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (errors.password) {
                  setErrors((previous) => ({ ...previous, password: undefined }));
                }
              }}
              error={errors.password}
              required
              minLength={6}
            />
            <PasswordStrength password={password} />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="mt-1 w-full"
            loading={isLoading}
          >
            {isLoading ? 'Creating account…' : 'Create account'}
            {!isLoading ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
          </Button>
        </form>

        <p className="text-center text-2xs leading-relaxed text-muted-foreground">
          Your workspace starts private. Invite teammates later from workspace settings.
        </p>
      </div>
    </AuthPageLayout>
  );
}
