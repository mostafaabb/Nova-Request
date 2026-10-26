'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';
import { AxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/components/ThemeProvider';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { cn } from '@/lib/utils';

export function GoogleAuthSection({ className }: { className?: string }) {
  const router = useRouter();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const { resolvedTheme } = useTheme();
  const [busy, setBusy] = useState(false);
  const [width, setWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const measure = () => setWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div ref={containerRef} className="relative flex min-h-10 justify-center">
        {busy ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-surface/90"
            aria-busy="true"
            aria-label="Signing in with Google"
          >
            <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
          </div>
        ) : null}
        {width > 0 ? (
          <div className="overflow-hidden rounded-lg border border-border">
            <GoogleLogin
              onSuccess={async (response) => {
                if (!response.credential) return;
                setBusy(true);
                try {
                  await loginWithGoogle(response.credential);
                  toast.success('Signed in with Google');
                  router.push('/dashboard');
                } catch (error: unknown) {
                  const message =
                    error instanceof AxiosError
                      ? (error.response?.data as { error?: string } | undefined)?.error
                      : undefined;
                  toast.error(message || 'Google sign-in failed');
                } finally {
                  setBusy(false);
                }
              }}
              onError={() => {
                toast.error('Google sign-in was interrupted');
              }}
              theme={resolvedTheme === 'dark' ? 'filled_black' : 'outline'}
              size="large"
              width={Math.max(200, Math.min(width, 400))}
              text="continue_with"
              shape="rectangular"
              logo_alignment="left"
            />
          </div>
        ) : null}
      </div>
      <AuthDivider />
    </div>
  );
}
