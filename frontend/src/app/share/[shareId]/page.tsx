'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookText,
  Check,
  Copy,
  FileCode2,
  Globe2,
  Link2,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { shareApi } from '@/lib/api';
import type { Collection } from '@/types';
import {
  copyToClipboard,
  formatRelativeTime,
  getApiErrorMessage,
} from '@/lib/utils';
import { NovaLogo, NovaMark } from '@/components/brand/NovaLogo';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { EndpointDocCard, EndpointDocNav } from '@/components/docs/EndpointDocCard';

type SharedCollection = Collection & { author?: string };

export default function SharePage() {
  const params = useParams();
  const [collection, setCollection] = useState<SharedCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await shareApi.getCollection(params.shareId as string);
        setCollection(response.data.collection);
      } catch (requestError: unknown) {
        setError(
          getApiErrorMessage(
            requestError,
            'This collection could not be found. It may have been removed or made private.'
          )
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params.shareId]);

  const endpoints = useMemo(() => collection?.endpoints || [], [collection]);
  const visibleEndpoints = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return endpoints;
    return endpoints.filter(
      (endpoint) =>
        endpoint.name.toLowerCase().includes(term) ||
        endpoint.url.toLowerCase().includes(term) ||
        endpoint.method.toLowerCase().includes(term) ||
        (endpoint.description || '').toLowerCase().includes(term)
    );
  }, [endpoints, query]);

  const copyLink = async () => {
    try {
      await copyToClipboard(window.location.href);
      setCopied(true);
      toast.success('Share link copied');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Could not access the clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <NovaLogo href="/auth/register" />
          <span className="hidden h-5 w-px bg-border sm:block" aria-hidden />
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Globe2 className="h-3.5 w-3.5" aria-hidden />
            Shared collection
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <Link href="/auth/register">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                Try Nova Request
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="space-y-3">
            <div className="h-3 w-28 animate-pulse rounded bg-surface-3" />
            <div className="h-8 w-80 max-w-full animate-pulse rounded bg-surface-3" />
            <div className="h-3 w-full max-w-xl animate-pulse rounded bg-surface-3" />
          </div>
          <div className="mt-8 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="hidden space-y-2 lg:block">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="h-7 animate-pulse rounded bg-surface-2" />
              ))}
            </div>
            <div className="space-y-4">
              {[0, 1].map((index) => (
                <div key={index} className="h-48 animate-pulse rounded-xl border border-border bg-surface" />
              ))}
            </div>
          </div>
        </div>
      ) : error || !collection ? (
        <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-destructive/25 bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" aria-hidden />
          </span>
          <h1 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
            Collection not available
          </h1>
          <p className="mt-2 text-pretty text-[13px] leading-relaxed text-muted-foreground">
            {error || 'This collection may have been removed or made private by its owner.'}
          </p>
          <Link href="/auth/register" className="mt-5">
            <Button variant="primary" size="sm">
              <NovaMark size={16} className="rounded border-0 bg-transparent" />
              Create your own workspace
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <section className="relative overflow-hidden border-b border-border bg-surface-2/20">
            <div className="app-grid-background pointer-events-none absolute inset-0 opacity-30" aria-hidden />
            <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary">
                  <Globe2 className="h-3 w-3" aria-hidden />
                  Public collection
                </Badge>
                <Badge>Read-only</Badge>
              </div>
              <h1 className="mt-3 text-balance text-[27px] font-semibold leading-tight tracking-[-0.03em] text-foreground sm:text-[32px]">
                {collection.name}
              </h1>
              {collection.description ? (
                <p className="mt-2 max-w-2xl text-pretty text-[13px] leading-relaxed text-muted-foreground">
                  {collection.description}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-2xs text-muted-foreground">
                {collection.author ? (
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" aria-hidden />
                    {collection.author}
                  </span>
                ) : null}
                <span>
                  {endpoints.length} {endpoints.length === 1 ? 'endpoint' : 'endpoints'}
                </span>
                <span>Updated {formatRelativeTime(collection.updatedAt)}</span>
                <Button variant="ghost" size="xs" onClick={copyLink} className="gap-1.5">
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-success" aria-hidden />
                  ) : (
                    <Link2 className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {copied ? 'Link copied' : 'Copy link'}
                </Button>
              </div>
            </div>
          </section>

          <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
            <div className="flex items-start gap-2.5 rounded-lg border border-warning/25 bg-warning/[0.06] px-3 py-2.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
              <p className="text-2xs leading-relaxed text-muted-foreground">
                This read-only view masks sensitive header values. Request bodies, URLs, and
                non-sensitive headers are shown exactly as saved, so owners should avoid storing
                secrets there. You cannot send requests or edit this collection from this page.
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
            <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
              <aside className="min-w-0">
                <div className="lg:sticky lg:top-20">
                  <div className="hidden lg:block">
                    <p className="mb-2 px-2 text-2xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Endpoints
                    </p>
                    <EndpointDocNav
                      endpoints={endpoints}
                      query={query}
                      onQueryChange={setQuery}
                    />
                  </div>

                  <details className="surface-panel overflow-hidden lg:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
                      <span>Browse endpoints ({endpoints.length})</span>
                      <span className="text-muted-foreground" aria-hidden>
                        ▾
                      </span>
                    </summary>
                    <div className="border-t border-border p-3">
                      <EndpointDocNav
                        endpoints={endpoints}
                        query={query}
                        onQueryChange={setQuery}
                      />
                    </div>
                  </details>
                </div>
              </aside>

              <main className="min-w-0 space-y-4">
                {endpoints.length === 0 ? (
                  <EmptyState
                    icon={FileCode2}
                    title="No endpoints shared yet"
                    description="The owner has not published any requests in this collection."
                  />
                ) : visibleEndpoints.length === 0 ? (
                  <EmptyState
                    icon={BookText}
                    title="No endpoints match"
                    description="Try a different name, method, or URL."
                    action={
                      <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
                        Clear filter
                      </Button>
                    }
                    compact
                  />
                ) : (
                  visibleEndpoints.map((endpoint) => (
                    <EndpointDocCard key={endpoint.id} endpoint={endpoint} masked />
                  ))
                )}

                {query && visibleEndpoints.length > 0 ? (
                  <p className="px-1 text-2xs text-muted-foreground">
                    Showing {visibleEndpoints.length} of {endpoints.length} endpoints.
                  </p>
                ) : null}

                <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-surface-2/25 p-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">
                      Build and test APIs in one workspace
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      Nova Request keeps collections, environments, and response history together.
                    </p>
                  </div>
                  <Link href="/auth/register" className="shrink-0">
                    <Button variant="primary" size="sm">
                      Create an account
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </Link>
                </div>
              </main>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
