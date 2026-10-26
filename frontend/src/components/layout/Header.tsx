'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  ChevronRight,
  Clock3,
  Globe2,
  History,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Settings2,
  Sun,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useEnvironmentStore } from '@/store/environmentStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useTheme } from '@/components/ThemeProvider';
import { NovaLogo, NovaMark } from '@/components/brand/NovaLogo';
import { Button } from '@/components/ui/Button';
import {
  Dropdown,
  DropdownContent,
  DropdownGroup,
  DropdownItem,
  DropdownLabel,
  DropdownRadioGroup,
  DropdownRadioItem,
  DropdownSeparator,
  DropdownSub,
  DropdownSubContent,
  DropdownSubTrigger,
  DropdownTrigger,
} from '@/components/ui/Dropdown';
import { cn, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/request': 'Request builder',
  '/dashboard/history': 'History',
};

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenWorkspace: () => void;
  onOpenEnvironment: () => void;
}

export function Header({ onOpenSidebar, onOpenWorkspace, onOpenEnvironment }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { workspaces, activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore();
  const {
    environments,
    activeEnvironmentId,
    setActiveEnvironment,
  } = useEnvironmentStore();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) || workspaces[0],
    [workspaces, activeWorkspaceId]
  );
  const activeEnvironment =
    environments.find((environment) => environment.id === activeEnvironmentId) ||
    environments.find((environment) => environment.id === 'globals');
  const pageTitle = PAGE_TITLES[pathname] || 'Workspace';

  const handleSignOut = () => {
    logout();
    toast.success('Signed out');
    router.push('/auth/login');
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-2.5 sm:px-4">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" aria-hidden />
      </Button>

      <NovaLogo className="hidden md:inline-flex" />
      <Link
        href="/dashboard"
        className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/65 md:hidden"
        aria-label="Nova Request home"
      >
        <NovaMark size={28} />
      </Link>

      <div className="mx-1 hidden h-5 w-px bg-border md:block" aria-hidden />

      <div className="flex min-w-0 items-center gap-2">
        <Dropdown>
          <DropdownTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="max-w-[10.5rem] gap-1.5 px-2 text-muted-foreground sm:max-w-[15rem]"
              aria-label="Switch workspace"
            >
              <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate text-xs font-medium">
                {activeWorkspace?.name || 'No workspace'}
              </span>
              <ChevronRight
                className="hidden h-3 w-3 shrink-0 rotate-90 opacity-50 sm:block"
                aria-hidden
              />
            </Button>
          </DropdownTrigger>
          <DropdownContent align="start" className="w-64">
            <DropdownLabel>Workspace</DropdownLabel>
            <DropdownRadioGroup
              value={activeWorkspace?.id || ''}
              onValueChange={(value) => setActiveWorkspace(value)}
            >
              {workspaces.map((workspace) => (
                <DropdownRadioItem key={workspace.id} value={workspace.id}>
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span className="truncate">{workspace.name}</span>
                    <span className="shrink-0 text-2xs capitalize text-muted-foreground">
                      {workspace.role} · {workspace.memberCount}
                    </span>
                  </span>
                </DropdownRadioItem>
              ))}
            </DropdownRadioGroup>
            {workspaces.length === 0 ? (
              <p className="px-2 py-2 text-xs text-muted-foreground">No workspaces yet.</p>
            ) : null}
            <DropdownSeparator />
            <DropdownItem onSelect={onOpenWorkspace}>
              <Settings2 className="h-3.5 w-3.5" aria-hidden />
              Workspace settings
            </DropdownItem>
            <DropdownItem onSelect={onOpenWorkspace}>
              <Users className="h-3.5 w-3.5" aria-hidden />
              Members & invitations
            </DropdownItem>
          </DropdownContent>
        </Dropdown>

        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground xl:flex">
          <ChevronRight className="h-3.5 w-3.5 opacity-50" aria-hidden />
          <span className="font-medium text-foreground">{pageTitle}</span>
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Dropdown>
          <DropdownTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="hidden max-w-[12rem] gap-1.5 px-2 text-muted-foreground sm:inline-flex"
              aria-label="Switch environment"
            >
              <Globe2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate text-xs font-medium">
                {activeEnvironmentId ? activeEnvironment?.name : 'Globals only'}
              </span>
              <ChevronRight
                className="h-3 w-3 shrink-0 rotate-90 opacity-50"
                aria-hidden
              />
            </Button>
          </DropdownTrigger>
          <DropdownContent align="end" className="w-60">
            <DropdownLabel>Environment</DropdownLabel>
            <DropdownRadioGroup
              value={activeEnvironmentId || 'globals'}
              onValueChange={(value) =>
                setActiveEnvironment(value === 'globals' ? null : value)
              }
            >
              <DropdownRadioItem value="globals">
                <span className="flex flex-1 items-center justify-between gap-2">
                  No environment
                  <span className="text-2xs text-muted-foreground">globals only</span>
                </span>
              </DropdownRadioItem>
              {environments
                .filter((environment) => environment.id !== 'globals')
                .map((environment) => (
                  <DropdownRadioItem key={environment.id} value={environment.id}>
                    <span className="flex-1 truncate">{environment.name}</span>
                  </DropdownRadioItem>
                ))}
            </DropdownRadioGroup>
            <DropdownSeparator />
            <DropdownItem onSelect={onOpenEnvironment}>
              <Settings2 className="h-3.5 w-3.5" aria-hidden />
              Manage variables
            </DropdownItem>
          </DropdownContent>
        </Dropdown>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'hidden text-muted-foreground sm:inline-flex',
            pathname === '/dashboard/history' && 'bg-surface-2 text-foreground'
          )}
          aria-label="Request history"
          title="Request history"
          onClick={() => router.push('/dashboard/history')}
        >
          <History className="h-4 w-4" aria-hidden />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4" aria-hidden />
          ) : (
            <Moon className="h-4 w-4" aria-hidden />
          )}
        </Button>

        <Dropdown>
          <DropdownTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="ml-0.5 h-8 gap-2 rounded-full px-1.5 text-muted-foreground sm:pr-2.5"
              aria-label="Account menu"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-3xs font-semibold text-primary">
                {getInitials(user?.name, user?.email)}
              </span>
              <span className="hidden max-w-24 truncate text-xs font-medium text-foreground md:block">
                {user?.name || user?.email}
              </span>
            </Button>
          </DropdownTrigger>
          <DropdownContent align="end" className="w-64">
            <div className="px-2 py-2">
              <p className="truncate text-xs font-semibold text-foreground">
                {user?.name || 'Nova user'}
              </p>
              <p className="mt-0.5 truncate text-2xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownSeparator />
            <DropdownItem onSelect={onOpenWorkspace}>
              <Users className="h-3.5 w-3.5" aria-hidden />
              Workspace & members
            </DropdownItem>
            <DropdownItem onSelect={onOpenEnvironment}>
              <Globe2 className="h-3.5 w-3.5" aria-hidden />
              Environments
            </DropdownItem>
            <DropdownItem onSelect={() => router.push('/dashboard/history')}>
              <Clock3 className="h-3.5 w-3.5" aria-hidden />
              Request history
            </DropdownItem>
            <DropdownSeparator />
            <DropdownSub>
              <DropdownSubTrigger>
                {resolvedTheme === 'dark' ? (
                  <Moon className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Sun className="h-3.5 w-3.5" aria-hidden />
                )}
                Theme
              </DropdownSubTrigger>
              <DropdownSubContent>
                <DropdownRadioGroup value={theme} onValueChange={(value) => setTheme(value as typeof theme)}>
                  <DropdownRadioItem value="light">
                    <Sun className="h-3.5 w-3.5" aria-hidden />
                    Light
                  </DropdownRadioItem>
                  <DropdownRadioItem value="dark">
                    <Moon className="h-3.5 w-3.5" aria-hidden />
                    Dark
                  </DropdownRadioItem>
                  <DropdownRadioItem value="system">
                    <Monitor className="h-3.5 w-3.5" aria-hidden />
                    System
                  </DropdownRadioItem>
                </DropdownRadioGroup>
              </DropdownSubContent>
            </DropdownSub>
            <DropdownSeparator />
            <DropdownItem destructive onSelect={handleSignOut}>
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              Sign out
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
    </header>
  );
}
