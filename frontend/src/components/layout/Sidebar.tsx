'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Clock3,
  Globe2,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  SquarePen,
  X,
} from 'lucide-react';
import { useEnvironmentStore } from '@/store/environmentStore';
import { useRequestStore } from '@/store/requestStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { NovaMark } from '@/components/brand/NovaLogo';
import { SidebarCollections } from './SidebarCollections';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed?: boolean;
  isMobile?: boolean;
  onCloseMobile?: () => void;
  onToggleCollapsed?: () => void;
  onOpenEnvironment: () => void;
  onOpenWorkspace: () => void;
  onNavigate?: () => void;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/request', label: 'Request builder', icon: SquarePen },
  { href: '/dashboard/history', label: 'History', icon: Clock3 },
];

export function Sidebar({
  collapsed = false,
  isMobile = false,
  onCloseMobile,
  onToggleCollapsed,
  onOpenEnvironment,
  onOpenWorkspace,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const tabs = useRequestStore((state) => state.tabs);
  const activeWorkspace = useWorkspaceStore((state) =>
    state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId)
  );
  const {
    environments,
    activeEnvironmentId,
    setActiveEnvironment,
  } = useEnvironmentStore();

  const activeEnvironment = environments.find(
    (environment) => environment.id === activeEnvironmentId
  );

  return (
    <aside
      className={cn(
        'flex h-full min-h-0 flex-col border-border bg-sidebar',
        isMobile ? 'w-[min(88vw,20rem)] border-r shadow-2xl' : 'border-r'
      )}
      aria-label="Workspace navigation"
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3">
        {isMobile ? (
          <>
            <NovaMark size={28} />
            <span className="text-[13px] font-semibold">Nova Request</span>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8"
              onClick={onCloseMobile}
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onOpenWorkspace}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              title="Workspace settings"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-3xs font-semibold uppercase text-muted-foreground">
                {(activeWorkspace?.name || 'Nova').slice(0, 2)}
              </span>
              {!collapsed ? (
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold">
                    {activeWorkspace?.name || 'Workspace'}
                  </span>
                  <span className="block truncate text-3xs capitalize text-muted-foreground">
                    {activeWorkspace?.role || 'No workspace'}
                    {activeWorkspace ? ` · ${activeWorkspace.memberCount} members` : ''}
                  </span>
                </span>
              ) : null}
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <PanelLeftClose className="h-3.5 w-3.5" aria-hidden />
              )}
            </Button>
          </>
        )}
      </div>

      <nav className="shrink-0 space-y-0.5 p-2" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                'relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
                collapsed && 'justify-center px-0'
              )}
            >
              {isActive ? (
                <span
                  className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                  aria-hidden
                />
              ) : null}
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
              {!collapsed && item.href === '/dashboard/request' && tabs.length > 0 ? (
                <span className="ml-auto rounded bg-surface-3 px-1.5 py-0.5 text-3xs tabular-nums text-muted-foreground">
                  {tabs.length}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 h-px shrink-0 bg-border" />

      <SidebarCollections
        collapsed={collapsed}
        onExpandSidebar={onToggleCollapsed}
        onNavigate={onNavigate}
      />

      <div className="shrink-0 border-t border-border p-2.5">
        {collapsed ? (
          <Button
            variant="ghost"
            size="icon"
            className="w-full text-muted-foreground"
            onClick={onOpenEnvironment}
            aria-label="Environment variables"
            title="Environment variables"
          >
            <Globe2 className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <>
            <div className="mb-1 flex items-center justify-between px-1">
              <label
                htmlFor="sidebar-environment"
                className="text-2xs font-medium uppercase tracking-[0.14em] text-muted-foreground"
              >
                Environment
              </label>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onOpenEnvironment}
                aria-label="Manage environment variables"
                title="Manage variables"
              >
                <Settings2 className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </div>
            <Select
              id="sidebar-environment"
              value={activeEnvironmentId || 'globals'}
              onChange={(event) =>
                setActiveEnvironment(event.target.value === 'globals' ? null : event.target.value)
              }
              className="h-8 bg-surface-2/40 text-xs"
              wrapperClassName="w-full"
              aria-label="Active environment"
            >
              <option value="globals">Globals only</option>
              {environments
                .filter((environment) => environment.id !== 'globals')
                .map((environment) => (
                  <option key={environment.id} value={environment.id}>
                    {environment.name}
                  </option>
                ))}
            </Select>
            {activeEnvironment ? (
              <p className="mt-1.5 truncate px-1 text-3xs text-muted-foreground">
                {activeEnvironment.variables.filter((variable) => variable.key && variable.enabled).length}{' '}
                active variables
              </p>
            ) : (
              <p className="mt-1.5 px-1 text-3xs text-muted-foreground">
                Global variables still apply.
              </p>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
