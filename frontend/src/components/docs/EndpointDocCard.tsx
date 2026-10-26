'use client';

import { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  FileJson,
  FlaskConical,
  Info,
  KeyRound,
  List,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { AuthConfig, Endpoint, KeyValuePair, RequestTest } from '@/types';
import {
  cn,
  copyToClipboard,
  formatJson,
  getMethodBadgeColor,
  getMethodColor,
  isJsonString,
} from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

const SENSITIVE_HEADER = /authorization|cookie|token|secret|api[-_]?key|signature|password/i;

function normalizeRows(rows: KeyValuePair[] | null | undefined): KeyValuePair[] {
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => row && row.key);
}

function normalizeTests(raw: Endpoint['tests']): RequestTest[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeAuth(raw: Endpoint['auth']): AuthConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  return raw as AuthConfig;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-2xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </h4>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyToClipboard(value);
      setCopied(true);
      toast.success('Copied to clipboard');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Could not access the clipboard');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      aria-label={label}
      title={label}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-success" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden />
      )}
    </button>
  );
}

export function EndpointDocCard({
  endpoint,
  masked = false,
}: {
  endpoint: Endpoint;
  masked?: boolean;
}) {
  const headers = normalizeRows(endpoint.headers);
  const queryParams = normalizeRows(endpoint.queryParams);
  const tests = normalizeTests(endpoint.tests);
  const auth = normalizeAuth(endpoint.auth);
  const hasRequestBody = Boolean(endpoint.body && endpoint.body.trim());
  const bodyIsJson = hasRequestBody && isJsonString(endpoint.body || '');

  const authLabel = useMemo(() => {
    if (!auth || auth.type === 'none') return 'No authorization';
    if (auth.type === 'bearer') return 'Bearer token';
    if (auth.type === 'basic') return 'Basic credentials';
    return `API key (${auth.apiKeyIn === 'query' ? 'query parameter' : 'header'})`;
  }, [auth]);

  return (
    <article
      id={`endpoint-${endpoint.id}`}
      className="scroll-mt-24 overflow-hidden rounded-xl border border-border bg-surface shadow-panel"
    >
      <header className="border-b border-border px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'rounded border px-1.5 py-0.5 font-mono text-2xs font-semibold tracking-wide',
              getMethodBadgeColor(endpoint.method)
            )}
          >
            {endpoint.method}
          </span>
          <h3 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground">
            {endpoint.name}
          </h3>
          {endpoint.tags?.length ? (
            <div className="hidden flex-wrap gap-1 sm:flex">
              {endpoint.tags.slice(0, 3).map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          ) : null}
        </div>
        {endpoint.description ? (
          <p className="mt-2 text-pretty text-xs leading-relaxed text-muted-foreground">
            {endpoint.description}
          </p>
        ) : null}
      </header>

      <div className="space-y-4 p-4">
        <section aria-label="Request URL">
          <SectionTitle>Request URL</SectionTitle>
          <div className="mt-1.5 flex items-start gap-1 rounded-lg border border-border bg-[hsl(var(--code-bg))] py-1.5 pl-3 pr-1">
            <code className="min-w-0 flex-1 break-all pt-1 font-mono text-xs leading-relaxed text-foreground/90">
              {endpoint.url}
            </code>
            <CopyButton value={endpoint.url} label={`Copy URL for ${endpoint.name}`} />
          </div>
        </section>

        {(queryParams.length > 0 || headers.length > 0 || auth) && (
          <div className="grid gap-4 lg:grid-cols-2">
            {queryParams.length > 0 ? (
              <section aria-label="Query parameters">
                <SectionTitle>Query parameters</SectionTitle>
                <div className="mt-1.5 overflow-hidden rounded-lg border border-border">
                  {queryParams.map((param, index) => (
                    <div
                      key={`${param.key}-${index}`}
                      className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] border-b border-border/60 px-2.5 py-1.5 last:border-b-0"
                    >
                      <span className="break-all font-mono text-2xs text-primary">{param.key}</span>
                      <span className="break-all font-mono text-2xs text-muted-foreground">
                        {param.value || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {headers.length > 0 ? (
              <section aria-label="Headers">
                <SectionTitle>Headers</SectionTitle>
                <div className="mt-1.5 overflow-hidden rounded-lg border border-border">
                  {headers.map((header, index) => {
                    const isSensitive = masked && SENSITIVE_HEADER.test(header.key);
                    return (
                      <div
                        key={`${header.key}-${index}`}
                        className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] border-b border-border/60 px-2.5 py-1.5 last:border-b-0"
                      >
                        <span className="break-all font-mono text-2xs text-primary">{header.key}</span>
                        {isSensitive ? (
                          <span
                            className="flex min-w-0 items-center gap-1 text-2xs text-muted-foreground"
                            title="Header value hidden in public views"
                          >
                            <span className="font-mono tracking-wider">••••••••</span>
                            <span className="text-3xs">hidden</span>
                          </span>
                        ) : (
                          <span className="break-all font-mono text-2xs text-muted-foreground">
                            {header.value || '—'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {auth ? (
              <section aria-label="Authorization">
                <SectionTitle>Authorization</SectionTitle>
                <div className="mt-1.5 flex items-start gap-2 rounded-lg border border-border bg-surface-2/35 px-2.5 py-2">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-2xs font-medium text-foreground">{authLabel}</p>
                    <p className="mt-0.5 text-3xs leading-relaxed text-muted-foreground">
                      Credentials are configured in the request and are not shown here.
                    </p>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        )}

        {hasRequestBody ? (
          <section aria-label="Request body">
            <div className="flex items-center justify-between gap-2">
              <SectionTitle>
                Request body
                {endpoint.bodyType ? (
                  <span className="ml-2 normal-case tracking-normal text-muted-foreground/70">
                    {endpoint.bodyType}
                  </span>
                ) : null}
              </SectionTitle>
              <FileJson className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
            </div>
            <pre className="mt-1.5 max-h-80 overflow-auto rounded-lg border border-border bg-[hsl(var(--code-bg))] p-3 font-mono text-2xs leading-relaxed text-foreground/90">
              {bodyIsJson ? formatJson(endpoint.body) : endpoint.body}
            </pre>
          </section>
        ) : null}

        {tests.length > 0 ? (
          <section aria-label="Response tests">
            <div className="flex items-center gap-1.5">
              <FlaskConical className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden />
              <SectionTitle>Expected response tests</SectionTitle>
            </div>
            <div className="mt-1.5 space-y-1">
              {tests.map((test, index) => (
                <div
                  key={`${test.path}-${index}`}
                  className="rounded-md border border-border bg-surface-2/30 px-2.5 py-1.5 font-mono text-2xs text-muted-foreground"
                >
                  <span className="text-foreground">{test.path || 'response'}</span>{' '}
                  <span>{test.operator}</span>
                  {test.value ? (
                    <>
                      {' '}
                      <span className="text-primary">{test.value}</span>
                    </>
                  ) : null}
                  {test.name ? (
                    <span className="ml-2 font-sans text-3xs text-muted-foreground/70">
                      {test.name}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!hasRequestBody && queryParams.length === 0 && headers.length === 0 && !auth ? (
          <p className="flex items-start gap-2 text-2xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            This saved request has no additional parameters, headers, body, or authorization.
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function EndpointDocNav({
  endpoints,
  query,
  onQueryChange,
  activeId,
}: {
  endpoints: Endpoint[];
  query: string;
  onQueryChange: (value: string) => void;
  activeId?: string | null;
}) {
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return endpoints;
    return endpoints.filter(
      (endpoint) =>
        endpoint.name.toLowerCase().includes(term) ||
        endpoint.url.toLowerCase().includes(term) ||
        endpoint.method.toLowerCase().includes(term)
    );
  }, [endpoints, query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <List
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Filter endpoints"
          aria-label="Filter endpoints"
          className="h-8 w-full rounded-lg border border-border bg-surface-2/50 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <nav className="space-y-0.5" aria-label="Collection endpoints">
        {filtered.map((endpoint) => (
          <a
            key={endpoint.id}
            href={`#endpoint-${endpoint.id}`}
            className={cn(
              'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
              activeId === endpoint.id
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
            )}
          >
            <span
              className={cn(
                'w-10 shrink-0 font-mono text-3xs font-semibold',
                getMethodColor(endpoint.method)
              )}
            >
              {endpoint.method}
            </span>
            <span className="min-w-0 flex-1 truncate">{endpoint.name}</span>
          </a>
        ))}
        {filtered.length === 0 ? (
          <p className="px-2 py-2 text-2xs text-muted-foreground">No endpoints match.</p>
        ) : null}
      </nav>

      <p className="flex items-start gap-1.5 px-2 text-3xs leading-relaxed text-muted-foreground">
        <KeyRound className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
        Credentials are hidden in documentation and public views.
      </p>
    </div>
  );
}
