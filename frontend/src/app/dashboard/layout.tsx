'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useEnvironmentStore } from '@/store/environmentStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ResizableSplit } from '@/components/layout/ResizableSplit';
import { PendingInvitationsBanner } from '@/components/workspace/PendingInvitationsBanner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const fetchMyInvitations = useWorkspaceStore((s) => s.fetchMyInvitations);
  const fetchEnvironments = useEnvironmentStore((s) => s.fetchForWorkspace);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated || !activeWorkspaceId) return;
    fetchEnvironments(activeWorkspaceId).catch(() => {
      toast.error('Failed to sync environments for this workspace');
    });
  }, [isAuthenticated, activeWorkspaceId, fetchEnvironments]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchMyInvitations().catch(() => {});
  }, [isAuthenticated, fetchMyInvitations]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <Header />
      <div className="flex-1 overflow-hidden px-3 pb-3">
        <ResizableSplit
          defaultSize={22}
          minSize={14}
          maxSize={38}
          storageKey="nova-sidebar-width"
          handleClassName="mx-1.5 rounded-full"
          first={<Sidebar />}
          second={
            <main className="h-full overflow-hidden rounded-lg border border-border/80 bg-background/70 shadow-sm backdrop-blur">
              <div className="flex h-full flex-col overflow-auto p-3 md:p-4">
                <PendingInvitationsBanner />
                <div className="min-h-0 flex-1">{children}</div>
              </div>
            </main>
          }
        />
      </div>
    </div>
  );
}
