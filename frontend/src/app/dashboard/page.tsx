'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  BookText,
  ChevronRight,
  Clock3,
  FolderKanban,
  FolderPlus,
  Globe2,
  History,
  LayoutPanelTop,
  Loader2,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { historyApi } from '@/lib/api';
import type { Collection, KeyValuePair, RequestHistory, HttpMethod } from '@/types';
import { useCollectionStore } from '@/store/collectionStore';
import { useEnvironmentStore } from '@/store/environmentStore';
import { useRequestStore } from '@/store/requestStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import {
  cn,
  formatRelativeTime,
  formatResponseTime,
  getApiErrorMessage,
  getMethodColor,
  getRequestLabel,
  getStatusColor,
  isJsonString,
} from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { CollectionFormDialog } from '@/components/collections/CollectionFormDialog';
import { ImportCollectionDialog } from '@/components/collections/ImportCollectionDialog';
import { EnvironmentManagerDialog } from '@/components/workspace/EnvironmentManagerDialog';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

function countEndpoints(collections: Collection[]) {
  return collections.reduce(
    (total, collection) => total + (collection.endpoints?.length ?? collection._count?.endpoints ?? 0),
    0
  );
}

function historyHeaders(entry: RequestHistory): KeyValuePair[] {
  const raw = entry.headers as unknown;
  if (Array.isArray(raw)) return raw as KeyValuePair[];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as KeyValuePair[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading = false,
}: {
  label: string;
  value: number | string;
  hint: string;
  icon: typeof FolderKanban;
  loading?: boolean;
}) {
  return (
    <div className="surface-panel p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-2xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
        <Icon className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden />
      </div>
      <p className="mt-3 text-[26px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-foreground">
        {loading ? <span className="inline-block h-6 w-8 animate-pulse rounded bg-surface-3" /> : value}
      </p>
      <p className="mt-2 truncate text-2xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    collections,
    isLoading: collectionsLoading,
    fetchCollections,
    fetchCollection,
    selectEndpoint,
  } = useCollectionStore();
  const { tabs, addTab, setActiveTab, sendRequest } = useRequestStore();
  const {
    environments,
    activeEnvironmentId,
    setActiveEnvironment,
  } = useEnvironmentStore();
  const activeWorkspace = useWorkspaceStore((state) =>
    state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId)
  );

  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [collectionsError, setCollectionsError] = useState('');
  const [openingCollectionId, setOpeningCollectionId] = useState<string | null>(null);

  const [quickMethod, setQuickMethod] = useState<HttpMethod>('GET');
  const [quickUrl, setQuickUrl] = useState('');
  const [quickError, setQuickError] = useState('');

  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [environmentDialogOpen, setEnvironmentDialogOpen] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const response = await historyApi.getAll({ limit: 6 });
      setHistory(response.data.history || []);
      setHistoryTotal(response.data.total || 0);
    } catch (error: unknown) {
      setHistoryError(getApiErrorMessage(error, 'Could not load recent requests.'));
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (collections.length > 0 || collectionsLoading) return;
    fetchCollections().catch((error: unknown) => {
      setCollectionsError(getApiErrorMessage(error, 'Could not load collections.'));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSavedRequests = countEndpoints(collections);
  const workspaceEnvironments = environments.filter((environment) => environment.id !== 'globals');
  const globals = environments.find((environment) => environment.id === 'globals');
  const activeEnvironment = environments.find(
    (environment) => environment.id === activeEnvironmentId
  );
  const activeVariableCount = activeEnvironment
    ? activeEnvironment.variables.filter((variable) => variable.key && variable.enabled).length
    : 0;
  const recentCollections = collections.slice(0, 4);

  const openBuilder = () => {
    addTab();
    router.push('/dashboard/request');
  };

  const handleQuickSend = (event: React.FormEvent) => {
    event.preventDefault();
    const url = quickUrl.trim();
    if (!url) {
      setQuickError('Enter a request URL to send it.');
      return;
    }

    addTab({
      name: getRequestLabel(url),
      method: quickMethod,
      url,
    });
    sendRequest();
    router.push('/dashboard/request');
  };

  const handleReplay = (entry: RequestHistory) => {
    const body = entry.body || '';
    addTab({
      name: entry.endpoint?.name || getRequestLabel(entry.url),
      method: (entry.method.toUpperCase() as HttpMethod) || 'GET',
      url: entry.url,
      headers: historyHeaders(entry),
      body,
      bodyType: !body.trim() ? 'none' : isJsonString(body) ? 'json' : 'raw',
    });
    router.push('/dashboard/request');
  };

  const handleOpenCollection = async (collection: Collection) => {
    setOpeningCollectionId(collection.id);
    try {
      await fetchCollection(collection.id);
      const full = useCollectionStore.getState().currentCollection;
      const firstEndpoint = full?.endpoints?.[0];
      if (firstEndpoint) {
        selectEndpoint(firstEndpoint);
        const existingTab = useRequestStore
          .getState()
          .tabs.find((tab) => tab.endpointId === firstEndpoint.id);
        if (existingTab) {
          setActiveTab(existingTab.id);
        } else {
          addTab(firstEndpoint);
        }
      }
      router.push('/dashboard/request');
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Could not open this collection.'));
    } finally {
      setOpeningCollectionId(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={activeWorkspace?.name || 'Workspace'}
        title="Overview"
        description={
          activeWorkspace
            ? `Collections, environments, and recent request activity for ${activeWorkspace.name}.`
            : 'Collections, environments, and recent activity across your workspace.'
        }
        actions={
          <>
            <Button variant="primary" onClick={openBuilder}>
              <Plus className="h-4 w-4" aria-hidden />
              New request
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/history')}>
              <History className="h-4 w-4" aria-hidden />
              History
            </Button>
          </>
        }
      />

      {collections.length === 0 && !collectionsLoading ? (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary/[0.05] p-4 sm:flex-row sm:items-center">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground">Set up your first collection</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Collections keep saved requests together. You can also send a quick request without
              saving it.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" size="sm" onClick={() => setImportDialogOpen(true)}>
              <Upload className="h-3.5 w-3.5" aria-hidden />
              Import
            </Button>
            <Button variant="primary" size="sm" onClick={() => setCollectionDialogOpen(true)}>
              <FolderPlus className="h-3.5 w-3.5" aria-hidden />
              New collection
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <StatCard
          label="Collections"
          value={collectionsLoading && collections.length === 0 ? '—' : collections.length}
          hint={`${totalSavedRequests} saved ${totalSavedRequests === 1 ? 'request' : 'requests'}`}
          icon={FolderKanban}
          loading={collectionsLoading && collections.length === 0}
        />
        <StatCard
          label="Environments"
          value={workspaceEnvironments.length}
          hint={
            activeEnvironment
              ? `${activeEnvironment.name} · ${activeVariableCount} active`
              : 'Globals only'
          }
          icon={Globe2}
        />
        <StatCard
          label="Open tabs"
          value={tabs.length}
          hint={tabs.length === 0 ? 'No request tabs open' : 'In the request builder'}
          icon={LayoutPanelTop}
        />
        <StatCard
          label="History"
          value={historyLoading ? '—' : historyTotal}
          hint={historyError ? 'Could not load history' : 'Requests sent by you'}
          icon={Clock3}
          loading={historyLoading && !historyError}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <section className="surface-panel overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <h2 className="text-[13px] font-semibold text-foreground">Quick request</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Send a one-off request with the active environment.
                </p>
              </div>
              <Link
                href="/dashboard/request"
                className="inline-flex shrink-0 items-center gap-1 rounded text-2xs font-medium text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                Full builder
                <ArrowUpRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>
            <form onSubmit={handleQuickSend} className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Select
                  value={quickMethod}
                  onChange={(event) => setQuickMethod(event.target.value as HttpMethod)}
                  className={cn(
                    'h-9 w-[5.75rem] shrink-0 bg-surface-2/60 font-mono text-xs font-semibold sm:w-24',
                    getMethodColor(quickMethod)
                  )}
                  aria-label="Quick request method"
                >
                  {METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </Select>
                <Input
                  value={quickUrl}
                  onChange={(event) => {
                    setQuickUrl(event.target.value);
                    if (quickError) setQuickError('');
                  }}
                  placeholder="https://api.example.com/v1/health"
                  className="h-9 min-w-0 flex-1 bg-surface-2/60 font-mono text-xs focus:bg-surface"
                  aria-label="Quick request URL"
                  aria-invalid={Boolean(quickError)}
                  spellCheck={false}
                  autoComplete="off"
                />
                <Button variant="primary" type="submit" className="h-9 shrink-0 px-2.5 sm:px-4">
                  <Send className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">Send</span>
                  <span className="sr-only sm:hidden">Send request</span>
                </Button>
              </div>
              {quickError ? (
                <p className="mt-2 text-xs font-medium text-destructive" role="alert">
                  {quickError}
                </p>
              ) : (
                <p className="mt-2 text-2xs leading-relaxed text-muted-foreground">
                  Opens in the request builder and records the result in history.{' '}
                  {activeEnvironment ? (
                    <>
                      Using <span className="text-foreground">{activeEnvironment.name}</span>.
                    </>
                  ) : (
                    <>Global variables still apply.</>
                  )}{' '}
                  Use <code className="font-mono text-foreground">{'{{variable}}'}</code> tokens.
                </p>
              )}
            </form>
          </section>

          <section className="surface-panel overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <h2 className="text-[13px] font-semibold text-foreground">Recent requests</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Reopen a request from your history.
                </p>
              </div>
              <Link
                href="/dashboard/history"
                className="inline-flex shrink-0 items-center gap-1 rounded text-2xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                View all
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>

            {historyLoading ? (
              <div className="space-y-1 p-2">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="flex h-12 items-center gap-3 px-2">
                    <span className="h-4 w-10 animate-pulse rounded bg-surface-3" />
                    <span className="h-2.5 flex-1 animate-pulse rounded bg-surface-3" />
                    <span className="h-3 w-12 animate-pulse rounded bg-surface-3" />
                  </div>
                ))}
              </div>
            ) : historyError ? (
              <div className="flex flex-col items-center px-4 py-8 text-center">
                <p className="text-xs text-muted-foreground">{historyError}</p>
                <Button variant="ghost" size="xs" className="mt-2" onClick={loadHistory}>
                  Try again
                </Button>
              </div>
            ) : history.length === 0 ? (
              <div className="p-3">
                <EmptyState
                  icon={History}
                  title="No requests sent yet"
                  description="Send a request from the builder and it will show up here."
                  compact
                />
              </div>
            ) : (
              <div className="divide-y divide-border/70">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="group flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-surface-2/40 sm:px-4"
                  >
                    <span
                      className={cn(
                        'w-11 shrink-0 font-mono text-3xs font-bold tracking-tight',
                        getMethodColor(entry.method)
                      )}
                    >
                      {entry.method}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {entry.endpoint?.name || getRequestLabel(entry.url)}
                      </p>
                      <p className="mt-0.5 hidden truncate font-mono text-2xs text-muted-foreground sm:block">
                        {entry.url}
                      </p>
                    </div>
                    {entry.responseStatus ? (
                      <span
                        className={cn(
                          'shrink-0 rounded border px-1.5 py-0.5 font-mono text-3xs font-semibold',
                          getStatusColor(entry.responseStatus)
                        )}
                      >
                        {entry.responseStatus}
                      </span>
                    ) : null}
                    {entry.responseTime ? (
                      <span className="hidden shrink-0 font-mono text-2xs text-muted-foreground md:inline">
                        {formatResponseTime(entry.responseTime)}
                      </span>
                    ) : null}
                    <span className="hidden shrink-0 text-2xs text-muted-foreground lg:inline">
                      {formatRelativeTime(entry.createdAt)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground"
                      onClick={() => handleReplay(entry)}
                      aria-label={`Replay ${entry.method} ${entry.url}`}
                      title="Replay request"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="surface-panel overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <div>
                <h2 className="text-[13px] font-semibold text-foreground">Collections</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {collections.length === 0
                    ? 'Organize saved requests.'
                    : `${collections.length} ${collections.length === 1 ? 'collection' : 'collections'} in this workspace`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setImportDialogOpen(true)}
                  aria-label="Import collection"
                  title="Import collection"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setCollectionDialogOpen(true)}
                  aria-label="New collection"
                  title="New collection"
                >
                  <FolderPlus className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            </div>

            {collectionsError ? (
              <div className="flex flex-col items-center px-4 py-8 text-center">
                <p className="text-xs text-muted-foreground">{collectionsError}</p>
                <Button
                  variant="ghost"
                  size="xs"
                  className="mt-2"
                  onClick={() => {
                    setCollectionsError('');
                    fetchCollections().catch((error: unknown) => {
                      setCollectionsError(
                        getApiErrorMessage(error, 'Could not load collections.')
                      );
                    });
                  }}
                >
                  Try again
                </Button>
              </div>
            ) : collectionsLoading && collections.length === 0 ? (
              <div className="space-y-1 p-2">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="flex h-12 items-center gap-2 px-2">
                    <span className="h-4 w-4 animate-pulse rounded bg-surface-3" />
                    <span className="h-2.5 flex-1 animate-pulse rounded bg-surface-3" />
                  </div>
                ))}
              </div>
            ) : recentCollections.length === 0 ? (
              <div className="p-3">
                <EmptyState
                  icon={FolderKanban}
                  title="No collections yet"
                  description="Create a collection to start saving requests."
                  action={
                    <Button variant="secondary" size="sm" onClick={() => setCollectionDialogOpen(true)}>
                      <FolderPlus className="h-3.5 w-3.5" aria-hidden />
                      New collection
                    </Button>
                  }
                  compact
                />
              </div>
            ) : (
              <div className="divide-y divide-border/70">
                {recentCollections.map((collection) => {
                  const endpointCount =
                    collection.endpoints?.length ?? collection._count?.endpoints ?? 0;
                  const isOpening = openingCollectionId === collection.id;
                  return (
                    <div key={collection.id} className="group flex items-center gap-0.5 pr-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenCollection(collection)}
                        disabled={Boolean(openingCollectionId)}
                        className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-surface-2/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 disabled:opacity-60 sm:px-4"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 text-muted-foreground">
                          {isOpening ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                          ) : (
                            <FolderKanban className="h-3.5 w-3.5" aria-hidden />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-medium text-foreground">
                            {collection.name}
                          </span>
                          <span className="mt-0.5 block truncate text-2xs text-muted-foreground">
                            {endpointCount} {endpointCount === 1 ? 'request' : 'requests'}
                            {collection.updatedAt
                              ? ` · ${formatRelativeTime(collection.updatedAt)}`
                              : ''}
                          </span>
                        </span>
                        <ChevronRight
                          className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </button>
                      <Link
                        href={`/docs/${collection.id}`}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                        aria-label={`Open documentation for ${collection.name}`}
                        title="View documentation"
                      >
                        <BookText className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="surface-panel overflow-hidden">
            <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
              <div>
                <h2 className="text-[13px] font-semibold text-foreground">Environments</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Pick the variables used by new sends.
                </p>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setEnvironmentDialogOpen(true)}
                className="shrink-0"
              >
                Manage
              </Button>
            </div>

            <div className="space-y-0.5 p-2">
              <button
                type="button"
                onClick={() => setActiveEnvironment(null)}
                aria-pressed={!activeEnvironmentId}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                  !activeEnvironmentId ? 'bg-accent text-accent-foreground' : 'hover:bg-surface-2'
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-full',
                    !activeEnvironmentId ? 'bg-primary' : 'bg-border-strong'
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">Globals only</span>
                  <span className="mt-0.5 block text-2xs text-muted-foreground">
                    {globals?.variables.filter((variable) => variable.key && variable.enabled).length || 0}{' '}
                    global variables
                  </span>
                </span>
                {!activeEnvironmentId ? <Badge variant="primary">Active</Badge> : null}
              </button>

              {workspaceEnvironments.map((environment) => {
                const isActive = environment.id === activeEnvironmentId;
                const variableCount = environment.variables.filter(
                  (variable) => variable.key && variable.enabled
                ).length;
                return (
                  <button
                    key={environment.id}
                    type="button"
                    onClick={() => setActiveEnvironment(environment.id)}
                    aria-pressed={isActive}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                      isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-surface-2'
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 shrink-0 rounded-full',
                        isActive ? 'bg-primary' : 'bg-border-strong'
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium">{environment.name}</span>
                      <span className="mt-0.5 block text-2xs text-muted-foreground">
                        {variableCount} active {variableCount === 1 ? 'variable' : 'variables'}
                      </span>
                    </span>
                    {isActive ? <Badge variant="primary">Active</Badge> : null}
                  </button>
                );
              })}

              {workspaceEnvironments.length === 0 ? (
                <p className="px-2 py-2 text-2xs leading-relaxed text-muted-foreground">
                  No workspace environments yet. Create one to switch between base URLs and
                  credentials.
                </p>
              ) : null}
            </div>
          </section>

          {activeWorkspace ? (
            <div className="rounded-xl border border-border bg-surface-2/25 px-4 py-3">
              <p className="text-2xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Workspace
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">{activeWorkspace.name}</p>
                  <p className="mt-0.5 text-2xs capitalize text-muted-foreground">
                    {activeWorkspace.role} · {activeWorkspace.memberCount}{' '}
                    {activeWorkspace.memberCount === 1 ? 'member' : 'members'}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <CollectionFormDialog
        open={collectionDialogOpen}
        onClose={() => setCollectionDialogOpen(false)}
      />
      <ImportCollectionDialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} />
      <EnvironmentManagerDialog
        open={environmentDialogOpen}
        onClose={() => setEnvironmentDialogOpen(false)}
      />
    </div>
  );
}
