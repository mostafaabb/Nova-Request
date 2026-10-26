'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useEnvironmentStore } from '@/store/environmentStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { PendingInvitationsBanner } from '@/components/workspace/PendingInvitationsBanner';
import { WorkspaceManagerDialog } from '@/components/workspace/WorkspaceManagerDialog';
import { EnvironmentManagerDialog } from '@/components/workspace/EnvironmentManagerDialog';
import { NovaMark } from '@/components/brand/NovaLogo';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const fetchMyInvitations = useWorkspaceStore((state) => state.fetchMyInvitations);
  const fetchEnvironments = useEnvironmentStore((state) => state.fetchForWorkspace);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [environmentOpen, setEnvironmentOpen] = useState(false);

  const isBuilder = pathname === '/dashboard/request';

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const stored = localStorage.getItem('nova-sidebar-collapsed');
    if (stored === 'true') setCollapsed(true);
  }, []);

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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      localStorage.setItem('nova-sidebar-collapsed', String(next));
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background">
        <NovaMark size={38} className="animate-pulse" />
        <p className="text-xs text-muted-foreground">Loading your workspace…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const sidebarProps = {
    collapsed,
    onToggleCollapsed: toggleCollapsed,
    onOpenEnvironment: () => setEnvironmentOpen(true),
    onOpenWorkspace: () => setWorkspaceOpen(true),
  };

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only z-[300] rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      <Header
        onOpenSidebar={() => setMobileOpen(true)}
        onOpenWorkspace={() => setWorkspaceOpen(true)}
        onOpenEnvironment={() => setEnvironmentOpen(true)}
      />

      <div className="flex min-h-0 flex-1">
        <div
          className={cn(
            'hidden shrink-0 transition-[width] duration-200 ease-out lg:block',
            collapsed ? 'w-[60px]' : 'w-[264px]'
          )}
        >
          <Sidebar {...sidebarProps} />
        </div>

        <main
          id="main-content"
          className={cn(
            'min-h-0 min-w-0 flex-1',
            isBuilder ? 'overflow-hidden' : 'overflow-y-auto'
          )}
        >
          {isBuilder ? (
            <div className="flex h-full min-h-0 flex-col">{children}</div>
          ) : (
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <PendingInvitationsBanner />
              {children}
            </div>
          )}
        </main>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[150] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
          <div className="relative h-full w-[min(88vw,20rem)] animate-slide-down">
            <Sidebar
              {...sidebarProps}
              collapsed={false}
              isMobile
              onCloseMobile={() => setMobileOpen(false)}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <WorkspaceManagerDialog open={workspaceOpen} onClose={() => setWorkspaceOpen(false)} />
      <EnvironmentManagerDialog
        open={environmentOpen}
        onClose={() => setEnvironmentOpen(false)}
      />
    </div>
  );
}
