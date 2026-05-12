'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';
import { AxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { cn } from '@/lib/utils';

export function GoogleAuthSection({ className }: { className?: string }) {
  const router = useRouter();
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const [busy, setBusy] = useState(false);

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div className={cn('space-y-5', className)}>
      <div className="relative flex min-h-[44px] w-full items-center justify-center">
        {busy ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/85 backdrop-blur-[2px]"
            aria-busy
          >
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : null}
        <div className="flex w-full justify-center overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm">
          <GoogleLogin
            onSuccess={async (res) => {
              if (!res.credential) return;
              setBusy(true);
              try {
                await loginWithGoogle(res.credential);
                toast.success('Signed in with Google');
                router.push('/dashboard');
              } catch (error: unknown) {
                const msg =
                  error instanceof AxiosError
                    ? (error.response?.data as { error?: string } | undefined)?.error
                    : undefined;
                toast.error(msg || 'Google sign-in failed');
              } finally {
                setBusy(false);
              }
            }}
            onError={() => {
              toast.error('Google sign-in was interrupted');
            }}
            theme="outline"
            size="large"
            width={384}
            text="continue_with"
            shape="rectangular"
            logo_alignment="left"
          />
        </div>
      </div>
      <AuthDivider />
    </div>
  );
}
