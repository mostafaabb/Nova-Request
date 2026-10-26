'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock3,
  Filter,
  History,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { historyApi } from '@/lib/api';
import type { HttpMethod, KeyValuePair, RequestHistory } from '@/types';
import {
  cn,
  formatDateTime,
  formatJson,
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
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useRequestStore } from '@/store/requestStore';

const PAGE_SIZE = 50;

type StatusFilter = 'all' | '2xx' | '3xx' | '4xx' | '5xx';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: '2xx', label: '2xx success' },
  { value: '3xx', label: '3xx redirect' },
  { value: '4xx', label: '4xx client error' },
  { value: '5xx', label: '5xx server error' },
];

function parseHeaders(raw: unknown): KeyValuePair[] {
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

function parseHeaderRecord(raw: unknown): [string, string][] {
  if (!raw) return [];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return Object.entries(parsed).map(([key, value]) => [key, String(value)]);
    } catch {
      return [];
    }
  }
  if (typeof raw === 'object') {
    return Object.entries(raw as Record<string, unknown>).map(([key, value]) => [key, String(value)]);
  }
  return [];
}

function getDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Earlier';

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

function statusMatches(status: number | undefined, filter: StatusFilter) {
  if (filter === 'all') return true;
  if (!status) return false;
  const bucket = `${Math.floor(status / 100)}xx`;
  return bucket === filter;
}

export default function HistoryPage() {
  const router = useRouter();
  const addTab = useRequestStore((state) => state.addTab);

  const [entries, setEntries] = useState<RequestHistory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | HttpMethod>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RequestHistory | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadHistory = useCallback(async (mode: 'initial' | 'more' = 'initial') => {
    if (mode === 'initial') {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError('');

    try {
      const offset = mode === 'more' ? entries.length : 0;
      const response = await historyApi.getAll({ limit: PAGE_SIZE, offset });
      const items: RequestHistory[] = response.data.history || [];
      setEntries((current) => (mode === 'more' ? [...current, ...items] : items));
      setTotal(response.data.total || items.length);
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'Could not load request history.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [entries.length]);

  useEffect(() => {
    loadHistory('initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (methodFilter !== 'ALL' && entry.method.toUpperCase() !== methodFilter) return false;
      if (!statusMatches(entry.responseStatus, statusFilter)) return false;
      if (!term) return true;
      return (
        entry.url.toLowerCase().includes(term) ||
        entry.method.toLowerCase().includes(term) ||
        (entry.endpoint?.name || '').toLowerCase().includes(term) ||
        String(entry.responseStatus || '').includes(term)
      );
    });
  }, [entries, search, methodFilter, statusFilter]);

  const groups = useMemo(() => {
    const map = new Map<string, RequestHistory[]>();
    filteredEntries.forEach((entry) => {
      const label = getDateLabel(entry.createdAt);
      const group = map.get(label);
      if (group) {
        group.push(entry);
      } else {
        map.set(label, [entry]);
      }
    });
    return Array.from(map.entries());
  }, [filteredEntries]);

  const hasFilters = Boolean(search.trim()) || methodFilter !== 'ALL' || statusFilter !== 'all';

  const replayEntry = (entry: RequestHistory) => {
    const body = entry.body || '';
    addTab({
      name: entry.endpoint?.name || getRequestLabel(entry.url),
      method: (entry.method.toUpperCase() as HttpMethod) || 'GET',
      url: entry.url,
      headers: parseHeaders(entry.headers),
      body,
      bodyType: !body.trim() ? 'none' : isJsonString(body) ? 'json' : 'raw',
    });
    router.push('/dashboard/request');
  };

  const deleteEntry = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await historyApi.delete(deleteTarget.id);
      setEntries((current) => current.filter((entry) => entry.id !== deleteTarget.id));
      setTotal((current) => Math.max(0, current - 1));
      if (expandedId === deleteTarget.id) setExpandedId(null);
      setDeleteTarget(null);
      toast.success('History entry deleted');
    } catch (requestError: unknown) {
      toast.error(getApiErrorMessage(requestError, 'Could not delete this entry.'));
    } finally {
      setBusy(false);
    }
  };

  const clearHistory = async () => {
    setBusy(true);
    try {
      await historyApi.clearAll();
      setEntries([]);
      setTotal(0);
      setExpandedId(null);
      setClearOpen(false);
      toast.success('History cleared');
    } catch (requestError: unknown) {
      toast.error(getApiErrorMessage(requestError, 'Could not clear history.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Activity"
        title="Request history"
        description="Every request you send through the proxy is recorded here, including status, timing, headers, and response bodies."
        actions={
          <>
            <Button variant="primary" onClick={() => router.push('/dashboard/request')}>
              <Plus className="h-4 w-4" aria-hidden />
              New request
            </Button>
            {total > 0 ? (
              <Button variant="destructive" onClick={() => setClearOpen(true)}>
                <Trash2 className="h-4 w-4" aria-hidden />
                Clear history
              </Button>
            ) : null}
          </>
        }
      />

      <div className="surface-panel p-3 sm:p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by URL, request name, or status"
              className="h-9 pl-8 pr-8"
              aria-label="Search history"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden items-center gap-1.5 text-2xs text-muted-foreground sm:flex">
              <Filter className="h-3.5 w-3.5" aria-hidden />
              Filter
            </span>
            <Select
              value={methodFilter}
              onChange={(event) => setMethodFilter(event.target.value as 'ALL' | HttpMethod)}
              className="h-9 w-[8.5rem] text-xs"
              aria-label="Filter by method"
            >
              <option value="ALL">All methods</option>
              {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as HttpMethod[]).map(
                (method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                )
              )}
            </Select>
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="h-9 w-[9.5rem] text-xs"
              aria-label="Filter by response status"
            >
              {STATUS_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </Select>
            {hasFilters ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setMethodFilter('ALL');
                  setStatusFilter('all');
                }}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Reset
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 text-2xs text-muted-foreground">
          <span>
            {loading
              ? 'Loading requests…'
              : hasFilters
                ? `${filteredEntries.length} of ${entries.length} loaded requests match`
                : `${entries.length} of ${total} requests loaded`}
          </span>
          {total > 0 ? (
            <span className="hidden sm:inline">
              Sends are recorded automatically by the proxy.
            </span>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center rounded-xl border border-destructive/25 bg-destructive/[0.05] px-6 py-10 text-center">
          <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-destructive/25 bg-destructive/10 text-destructive">
            <AlertCircle className="h-4 w-4" aria-hidden />
          </span>
          <p className="text-[13px] font-semibold text-foreground">History is unavailable</p>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">{error}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => loadHistory('initial')}>
            Try again
          </Button>
        </div>
      ) : loading ? (
        <div className="space-y-2" aria-label="Loading history">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-3"
            >
              <span className="h-4 w-11 animate-pulse rounded bg-surface-3" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <span className="block h-2.5 w-1/2 animate-pulse rounded bg-surface-3" />
                <span className="block h-2 w-3/4 animate-pulse rounded bg-surface-3" />
              </div>
              <span className="h-4 w-10 animate-pulse rounded bg-surface-3" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={History}
          title="No request history yet"
          description="Send a request from the builder and its status, timing, and response will appear here."
          action={
            <Button variant="primary" size="sm" onClick={() => router.push('/dashboard/request')}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Open request builder
            </Button>
          }
        />
      ) : filteredEntries.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching requests"
          description="Try a different URL, method, or status filter."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch('');
                setMethodFilter('ALL');
                setStatusFilter('all');
              }}
            >
              Reset filters
            </Button>
          }
          compact
        />
      ) : (
        <div className="space-y-5">
          {groups.map(([label, groupEntries]) => (
            <section key={label} aria-label={label}>
              <h2 className="mb-2 px-1 text-2xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {label}
              </h2>
              <div className="overflow-hidden rounded-xl border border-border bg-surface">
                <div className="divide-y divide-border/70">
                  {groupEntries.map((entry) => {
                    const expanded = expandedId === entry.id;
                    const requestHeaders = parseHeaders(entry.headers).filter((header) => header.key);
                    const responseHeaders = parseHeaderRecord(entry.responseHeaders);

                    return (
                      <div key={entry.id} className={cn('transition-colors', expanded && 'bg-surface-2/20')}>
                        <div className="flex items-center gap-2 px-2.5 py-2.5 sm:gap-3 sm:px-3">
                          <span
                            className={cn(
                              'w-11 shrink-0 font-mono text-3xs font-bold tracking-tight',
                              getMethodColor(entry.method)
                            )}
                          >
                            {entry.method}
                          </span>

                          <button
                            type="button"
                            onClick={() => setExpandedId(expanded ? null : entry.id)}
                            aria-expanded={expanded}
                            aria-controls={`history-detail-${entry.id}`}
                            className="flex min-w-0 flex-1 items-center gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-medium text-foreground">
                                {entry.endpoint?.name || getRequestLabel(entry.url)}
                              </span>
                              <span className="mt-0.5 block truncate font-mono text-2xs text-muted-foreground">
                                {entry.url}
                              </span>
                            </span>
                          </button>

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
                            <span className="hidden w-14 shrink-0 text-right font-mono text-2xs text-muted-foreground sm:inline">
                              {formatResponseTime(entry.responseTime)}
                            </span>
                          ) : null}

                          <span className="hidden w-16 shrink-0 text-right text-2xs text-muted-foreground md:inline">
                            {formatRelativeTime(entry.createdAt)}
                          </span>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground"
                            onClick={() => replayEntry(entry)}
                            aria-label={`Replay ${entry.method} ${entry.url}`}
                            title="Replay request"
                          >
                            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground"
                            onClick={() => setExpandedId(expanded ? null : entry.id)}
                            aria-label={expanded ? 'Collapse request details' : 'Expand request details'}
                            aria-expanded={expanded}
                            aria-controls={`history-detail-${entry.id}`}
                            title={expanded ? 'Hide details' : 'Show details'}
                          >
                            {expanded ? (
                              <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                            )}
                          </Button>
                        </div>

                        {expanded ? (
                          <div
                            id={`history-detail-${entry.id}`}
                            className="border-t border-border bg-surface-2/20 px-3 py-3 sm:px-4"
                          >
                            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <Clock3 className="h-3 w-3" aria-hidden />
                                {formatDateTime(entry.createdAt)}
                              </span>
                              {entry.responseTime ? (
                                <span className="font-mono">
                                  {formatResponseTime(entry.responseTime)}
                                </span>
                              ) : null}
                              {entry.endpoint?.name ? (
                                <span className="text-foreground">{entry.endpoint.name}</span>
                              ) : null}
                            </div>

                            <div className="grid gap-3 lg:grid-cols-2">
                              <div className="min-w-0 rounded-lg border border-border bg-surface p-3">
                                <p className="text-2xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                                  Request
                                </p>
                                <p className="mt-1.5 break-all font-mono text-2xs leading-relaxed text-foreground">
                                  <span className="font-semibold">{entry.method}</span> {entry.url}
                                </p>

                                {requestHeaders.length > 0 ? (
                                  <div className="mt-3">
                                    <p className="mb-1 text-2xs font-medium text-muted-foreground">
                                      Headers
                                    </p>
                                    <div className="space-y-0.5">
                                      {requestHeaders.map((header, index) => (
                                        <p
                                          key={`${header.key}-${index}`}
                                          className="break-all font-mono text-2xs leading-relaxed"
                                        >
                                          <span className="text-primary">{header.key}</span>
                                          <span className="text-muted-foreground">: </span>
                                          <span className="text-foreground/80">{header.value}</span>
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}

                                {entry.body ? (
                                  <div className="mt-3">
                                    <p className="mb-1 text-2xs font-medium text-muted-foreground">
                                      Body
                                    </p>
                                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded border border-border bg-[hsl(var(--code-bg))] p-2 font-mono text-2xs leading-relaxed text-muted-foreground">
                                      {formatJson(entry.body)}
                                    </pre>
                                  </div>
                                ) : null}
                              </div>

                              <div className="min-w-0 rounded-lg border border-border bg-surface p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-2xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                                    Response
                                  </p>
                                  {entry.responseStatus ? (
                                    <span
                                      className={cn(
                                        'rounded border px-1.5 py-0.5 font-mono text-3xs font-semibold',
                                        getStatusColor(entry.responseStatus)
                                      )}
                                    >
                                      {entry.responseStatus}
                                    </span>
                                  ) : null}
                                </div>

                                {responseHeaders.length > 0 ? (
                                  <div className="mt-3">
                                    <p className="mb-1 text-2xs font-medium text-muted-foreground">
                                      Headers
                                    </p>
                                    <div className="max-h-32 space-y-0.5 overflow-auto">
                                      {responseHeaders.map(([key, value]) => (
                                        <p
                                          key={key}
                                          className="break-all font-mono text-2xs leading-relaxed"
                                        >
                                          <span className="text-primary">{key}</span>
                                          <span className="text-muted-foreground">: </span>
                                          <span className="text-foreground/80">{value}</span>
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}

                                {entry.responseBody ? (
                                  <div className="mt-3">
                                    <p className="mb-1 text-2xs font-medium text-muted-foreground">
                                      Body
                                    </p>
                                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded border border-border bg-[hsl(var(--code-bg))] p-2 font-mono text-2xs leading-relaxed text-muted-foreground">
                                      {formatJson(entry.responseBody)}
                                    </pre>
                                  </div>
                                ) : (
                                  <p className="mt-3 text-2xs text-muted-foreground">
                                    No response body was recorded.
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap justify-end gap-2">
                              <Button variant="secondary" size="xs" onClick={() => replayEntry(entry)}>
                                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                                Replay in builder
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setDeleteTarget(entry)}
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                Delete entry
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}

          {entries.length < total ? (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={() => loadHistory('more')}
                disabled={loadingMore}
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {loadingMore ? 'Loading…' : `Load ${Math.min(PAGE_SIZE, total - entries.length)} more`}
              </Button>
            </div>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteEntry}
        title="Delete this history entry?"
        description={
          deleteTarget
            ? `${deleteTarget.method} ${deleteTarget.url} will be removed from your history. Saved requests are not affected.`
            : ''
        }
        confirmLabel="Delete entry"
        loading={busy}
      />

      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={clearHistory}
        title="Clear all request history?"
        description={`This permanently removes ${total} ${total === 1 ? 'entry' : 'entries'} from your history. Collections and saved requests are not affected.`}
        confirmLabel="Clear history"
        loading={busy}
      />
    </div>
  );
}
