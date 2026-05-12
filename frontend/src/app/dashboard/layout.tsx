'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ResizableSplit } from '@/components/layout/ResizableSplit';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <Header />
      <div className="flex-1 overflow-hidden px-4 py-3 gap-3">
        <ResizableSplit
          defaultSize={22}
          minSize={14}
          maxSize={38}
          storageKey="nova-sidebar-width"
          handleClassName="mx-2 rounded-full bg-border/40 hover:bg-border/60 transition-colors"
          first={<Sidebar />}
          second={
            <main className="h-full overflow-hidden rounded-lg border border-border/80 bg-background/70 shadow-sm backdrop-blur">
              {children}
            </main>
          }
        />
      </div>
    </div>
  );
}
