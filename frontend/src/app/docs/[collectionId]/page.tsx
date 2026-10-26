'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  BookText,
  ExternalLink,
  FileCode2,
  Globe2,
} from 'lucide-react';
import { collectionApi } from '@/lib/api';
import type { Collection } from '@/types';
import { formatRelativeTime, getApiErrorMessage } from '@/lib/utils';
import { NovaLogo } from '@/components/brand/NovaLogo';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { EndpointDocCard, EndpointDocNav } from '@/components/docs/EndpointDocCard';

export default function DocsPage() {
  const params = useParams();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const loadCollection = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await collectionApi.getOne(params.collectionId as string);
      setCollection(response.data.collection);
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'Could not load this collection.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.collectionId]);

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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <NovaLogo href="/dashboard" />
          <span className="hidden h-5 w-px bg-border sm:block" aria-hidden />
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <BookText className="h-3.5 w-3.5" aria-hidden />
            Documentation
          </span>
          <div className="ml-auto flex items-center gap-2">
            {collection?.isPublic && collection.shareId ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(`/share/${collection.shareId}`, '_blank', 'noopener,noreferrer')
                }
              >
                <Globe2 className="h-3.5 w-3.5" aria-hidden />
                Public view
              </Button>
            ) : null}
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden sm:inline">Workspace</span>
                <span className="sr-only sm:hidden">Back to workspace</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="space-y-3">
            <div className="h-3 w-24 animate-pulse rounded bg-surface-3" />
            <div className="h-8 w-72 max-w-full animate-pulse rounded bg-surface-3" />
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
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-destructive/25 bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" aria-hidden />
          </span>
          <h1 className="text-lg font-semibold text-foreground">Documentation unavailable</h1>
          <p className="mt-1.5 text-pretty text-xs leading-relaxed text-muted-foreground">
            {error || 'This collection could not be found in your workspace.'}
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" size="sm" onClick={loadCollection}>
              Try again
            </Button>
            <Link href="/dashboard">
              <Button variant="primary" size="sm">
                Back to workspace
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <section className="relative overflow-hidden border-b border-border bg-surface-2/20">
            <div className="app-grid-background pointer-events-none absolute inset-0 opacity-30" aria-hidden />
            <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xs font-medium uppercase tracking-[0.16em] text-primary">
                  API documentation
                </span>
                {collection.isPublic ? (
                  <Badge variant="primary">
                    <Globe2 className="h-3 w-3" aria-hidden />
                    Public
                  </Badge>
                ) : (
                  <Badge>Workspace only</Badge>
                )}
              </div>
              <h1 className="mt-3 text-balance text-[26px] font-semibold leading-tight tracking-[-0.03em] text-foreground sm:text-[30px]">
                {collection.name}
              </h1>
              {collection.description ? (
                <p className="mt-2 max-w-2xl text-pretty text-[13px] leading-relaxed text-muted-foreground">
                  {collection.description}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-2xs text-muted-foreground">
                <span>
                  {endpoints.length} {endpoints.length === 1 ? 'endpoint' : 'endpoints'}
                </span>
                <span className="hidden h-3 w-px bg-border sm:block" aria-hidden />
                <span>Updated {formatRelativeTime(collection.updatedAt)}</span>
                <span className="hidden h-3 w-px bg-border sm:block" aria-hidden />
                <span>Read-only reference</span>
              </div>
            </div>
          </section>

          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
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
                    title="No endpoints documented yet"
                    description="Save requests to this collection and they will appear here as reference documentation."
                    action={
                      <Link href="/dashboard/request">
                        <Button variant="secondary" size="sm">
                          Open request builder
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                      </Link>
                    }
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
                    <EndpointDocCard key={endpoint.id} endpoint={endpoint} />
                  ))
                )}

                {query && visibleEndpoints.length > 0 ? (
                  <p className="px-1 text-2xs text-muted-foreground">
                    Showing {visibleEndpoints.length} of {endpoints.length} endpoints.
                  </p>
                ) : null}
              </main>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
