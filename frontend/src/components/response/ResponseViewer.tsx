'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Database,
  FileWarning,
  Loader2,
  RotateCcw,
  Send,
  Server,
  TestTube2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRequestStore } from '@/store/requestStore';
import {
  cn,
  copyToClipboard,
  formatBytes,
  formatJson,
  formatResponseTime,
  getStatusColor,
} from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { JsonViewer } from './JsonViewer';

interface TestResult {
  name?: string;
  path?: string;
  passed?: boolean;
  expected?: unknown;
  actual?: unknown;
  error?: string;
}

export function ResponseViewer() {
  const { getActiveTab, sendRequest } = useRequestStore();
  const activeTab = getActiveTab();
  const [copied, setCopied] = useState<string | null>(null);

  const response = activeTab?.response;

  const rawText = useMemo(() => {
    if (!response) return '';
    try {
      if (typeof response.data === 'string') return response.data;
      const serialized = JSON.stringify(response.data);
      return typeof serialized === 'string' ? serialized : String(response.data);
    } catch {
      return String(response.data);
    }
  }, [response]);

  const rawDisplay = useMemo(() => {
    if (!response) return '';
    if (typeof response.data === 'string') return response.data;
    return formatJson(response.data);
  }, [response]);

  const responseSize = useMemo(() => {
    if (!rawText) return 0;
    try {
      return new TextEncoder().encode(rawText).length;
    } catch {
      return rawText.length;
    }
  }, [rawText]);

  const bodyView = useMemo(() => {
    if (!response) return { kind: 'text' as const, value: '' };
    const data = response.data;
    if (typeof data === 'string') {
      const trimmed = data.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          return { kind: 'json' as const, value: JSON.parse(trimmed) };
        } catch {
          /* fall through to text */
        }
      }
      return { kind: 'text' as const, value: data };
    }
    if (data === undefined) return { kind: 'text' as const, value: '' };
    if (typeof data === 'object' && data !== null) {
      return { kind: 'json' as const, value: data };
    }
    return { kind: 'text' as const, value: String(data) };
  }, [response]);

  const testResults = (response?.tests?.results || []) as TestResult[];
  const testTotal = (response?.tests?.passed || 0) + (response?.tests?.failed || 0);

  if (!activeTab) return null;

  const copy = async (key: string, value: string) => {
    if (!value) return;
    try {
      await copyToClipboard(value);
      setCopied(key);
      toast.success('Copied to clipboard');
      window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1800);
    } catch {
      toast.error('Could not access the clipboard');
    }
  };

  const retry = () => sendRequest(activeTab.endpointId);

  if (activeTab.isLoading) {
    return (
      <div className="flex h-full flex-col bg-background" role="status" aria-live="polite">
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">Sending request…</p>
            <p className="mt-0.5 truncate font-mono text-2xs text-muted-foreground">
              {activeTab.method} {activeTab.url || 'No URL'}
            </p>
          </div>
        </div>
        <div className="space-y-2 p-4">
          <div className="h-9 w-40 animate-pulse rounded-md bg-surface-2" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-surface-2" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
          <div className="h-40 animate-pulse rounded-lg border border-border bg-surface-2/40" />
        </div>
        <p className="px-4 text-2xs text-muted-foreground">
          Waiting for the proxy to return a status, headers, and body.
        </p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background px-5 py-10 text-center">
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground">
          <Server className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-[13px] font-semibold text-foreground">No response yet</p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
          Send this request to inspect the status, headers, body, and any test results.
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => sendRequest(activeTab.endpointId)}
          disabled={!activeTab.url.trim()}
        >
          <Send className="h-3.5 w-3.5" aria-hidden />
          Send request
        </Button>
        <p className="mt-3 text-2xs text-muted-foreground">
          You can also press <kbd className="kbd h-4 min-w-4 px-1 text-[9px]">Ctrl</kbd>{' '}
          <span aria-hidden>+</span>{' '}
          <kbd className="kbd h-4 min-w-4 px-1 text-[9px]">Enter</kbd>
        </p>
      </div>
    );
  }

  if (!response.success) {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="flex shrink-0 items-center gap-3 border-b border-destructive/25 bg-destructive/[0.06] px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-destructive/25 bg-destructive/10 text-destructive">
            <AlertCircle className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">Request failed</p>
            <p className="mt-0.5 text-2xs text-muted-foreground">
              The proxy could not complete this request.
            </p>
          </div>
          <Button variant="outline" size="xs" className="ml-auto shrink-0" onClick={retry}>
            <RotateCcw className="h-3 w-3" aria-hidden />
            Retry
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="rounded-lg border border-destructive/25 bg-destructive/[0.04] p-3">
            <p className="font-mono text-xs leading-relaxed text-destructive break-words">
              {response.error?.message || 'No error message was returned.'}
            </p>
            {response.error?.code ? (
              <p className="mt-2 font-mono text-2xs text-muted-foreground">
                Error code: {response.error.code}
              </p>
            ) : null}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
              <p className="text-2xs uppercase tracking-[0.12em] text-muted-foreground">Request</p>
              <p className="mt-1 break-all font-mono text-xs">
                <span className="font-semibold">{activeTab.method}</span> {activeTab.url}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
              <p className="text-2xs uppercase tracking-[0.12em] text-muted-foreground">
                Response time
              </p>
              <p className="mt-1 font-mono text-xs">
                {response.responseTime ? formatResponseTime(response.responseTime) : 'Not recorded'}
              </p>
            </div>
          </div>

          {response.requestId ? (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-2xs uppercase tracking-[0.12em] text-muted-foreground">
                  Request ID
                </p>
                <p className="mt-1 truncate font-mono text-xs">{response.requestId}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => copy('request-id', response.requestId || '')}
                aria-label="Copy request ID"
              >
                {copied === 'request-id' ? (
                  <Check className="h-3.5 w-3.5 text-success" aria-hidden />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                )}
              </Button>
            </div>
          ) : null}

          <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-surface-2/35 px-3 py-2.5 text-2xs leading-relaxed text-muted-foreground">
            <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <p>
              Check that the URL is reachable from the API proxy, that required headers are set, and
              that the host allows requests from the backend. A failed request is not added to your
              history.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const headerEntries = Object.entries(response.headers || {}).sort(([a], [b]) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );
  const contentTypeEntry = headerEntries.find(
    ([key]) => key.toLowerCase() === 'content-type'
  );
  const contentType = contentTypeEntry
    ? String(contentTypeEntry[1]).split(';')[0]
    : null;
  const hasBody = !(
    bodyView.kind === 'text' && bodyView.value.trim().length === 0
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="shrink-0 border-b border-border bg-surface">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2.5 sm:px-4">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-xs font-semibold',
              getStatusColor(response.status || 0)
            )}
          >
            {response.status}
            {response.statusText ? (
              <span className="font-sans text-2xs font-medium opacity-80">
                {response.statusText}
              </span>
            ) : null}
          </span>

          <span className="flex items-center gap-1.5 text-2xs text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden />
            <span className="font-mono text-xs text-foreground">
              {response.responseTime ? formatResponseTime(response.responseTime) : '—'}
            </span>
          </span>

          <span className="flex items-center gap-1.5 text-2xs text-muted-foreground">
            <Database className="h-3 w-3" aria-hidden />
            <span className="font-mono text-xs text-foreground">{formatBytes(responseSize)}</span>
          </span>

          {contentType ? (
            <span className="hidden max-w-[12rem] truncate font-mono text-2xs text-muted-foreground sm:inline">
              {contentType}
            </span>
          ) : null}

          {testTotal > 0 ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-3xs font-semibold',
                (response.tests?.failed || 0) > 0
                  ? 'border-destructive/25 bg-destructive/10 text-destructive'
                  : 'border-success/25 bg-success/10 text-success'
              )}
            >
              <TestTube2 className="h-3 w-3" aria-hidden />
              {response.tests?.passed}/{testTotal} tests
            </span>
          ) : null}

          {response.scripts?.preRequest?.error || response.scripts?.postRequest?.error ? (
            <span
              className="max-w-[10rem] truncate text-2xs font-medium text-warning"
              title={[response.scripts?.preRequest?.error, response.scripts?.postRequest?.error]
                .filter(Boolean)
                .join(' · ')}
            >
              Script error
            </span>
          ) : null}

          <div className="ml-auto flex items-center gap-1.5">
            {response.requestId ? (
              <Button
                variant="ghost"
                size="icon"
                className="hidden h-7 w-7 text-muted-foreground sm:inline-flex"
                onClick={() => copy('request-id', response.requestId || '')}
                aria-label="Copy request ID"
                title={`Request ID: ${response.requestId}`}
              >
                {copied === 'request-id' ? (
                  <Check className="h-3.5 w-3.5 text-success" aria-hidden />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                )}
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="xs"
              onClick={() => copy('body', rawText)}
              className="gap-1.5"
            >
              {copied === 'body' ? (
                <Check className="h-3 w-3 text-success" aria-hidden />
              ) : (
                <Copy className="h-3 w-3" aria-hidden />
              )}
              {copied === 'body' ? 'Copied' : 'Copy body'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={retry}
              aria-label="Send request again"
              title="Send again"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </div>
        </div>

        {response.requestId ? (
          <div className="border-t border-border/60 px-3 py-1.5 sm:px-4">
            <p className="truncate font-mono text-3xs text-muted-foreground">
              Request ID {response.requestId}
            </p>
          </div>
        ) : null}
      </div>

      <Tabs defaultValue="body" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-border bg-background px-2">
          <TabsList className="flex h-10 w-full items-stretch justify-start gap-0 overflow-x-auto rounded-none border-0 bg-transparent p-0 no-scrollbar">
            <TabsTrigger
              value="body"
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-2.5 text-xs font-medium text-muted-foreground shadow-none hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none sm:px-3"
            >
              Body
            </TabsTrigger>
            <TabsTrigger
              value="headers"
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-2.5 text-xs font-medium text-muted-foreground shadow-none hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none sm:px-3"
            >
              Headers
              {headerEntries.length > 0 ? (
                <span className="rounded bg-surface-3 px-1 text-3xs font-medium tabular-nums text-muted-foreground">
                  {headerEntries.length}
                </span>
              ) : null}
            </TabsTrigger>
            {testTotal > 0 ? (
              <TabsTrigger
                value="tests"
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-2.5 text-xs font-medium text-muted-foreground shadow-none hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none sm:px-3"
              >
                Tests
                <span
                  className={cn(
                    'rounded px-1 text-3xs font-medium tabular-nums',
                    (response.tests?.failed || 0) > 0
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-success/10 text-success'
                  )}
                >
                  {response.tests?.passed}/{testTotal}
                </span>
              </TabsTrigger>
            ) : null}
            <TabsTrigger
              value="raw"
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-2.5 text-xs font-medium text-muted-foreground shadow-none hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none sm:px-3"
            >
              Raw
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="relative min-h-0 flex-1 bg-background">
          <TabsContent
            value="body"
            className="m-0 mt-0 absolute inset-0 overflow-y-auto p-3 focus-visible:outline-none sm:p-4"
          >
            {hasBody ? (
              <div className="min-h-full rounded-lg border border-border bg-[hsl(var(--code-bg))] p-3 sm:p-4">
                {bodyView.kind === 'json' ? (
                  <JsonViewer data={bodyView.value} />
                ) : (
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-foreground/90">
                    {bodyView.value}
                  </pre>
                )}
              </div>
            ) : (
              <div className="flex min-h-full flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-12 text-center">
                <p className="text-[13px] font-medium text-foreground">Empty response body</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The server returned status {response.status} without a body.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="headers"
            className="m-0 mt-0 absolute inset-0 overflow-y-auto p-3 focus-visible:outline-none sm:p-4"
          >
            {headerEntries.length > 0 ? (
              <div className="space-y-1.5">
                {headerEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="group rounded-lg border border-border bg-surface px-2.5 py-2 transition-colors hover:border-border-strong"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 break-all font-mono text-2xs font-medium text-primary">
                        {key}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground"
                        onClick={() => copy(`header-${key}`, String(value))}
                        aria-label={`Copy ${key} header value`}
                        title="Copy value"
                      >
                        {copied === `header-${key}` ? (
                          <Check className="h-3 w-3 text-success" aria-hidden />
                        ) : (
                          <Copy className="h-3 w-3" aria-hidden />
                        )}
                      </Button>
                    </div>
                    <p className="mt-0.5 break-all font-mono text-xs leading-relaxed text-muted-foreground">
                      {String(value)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full min-h-48 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                No response headers were returned.
              </div>
            )}
          </TabsContent>

          {testTotal > 0 ? (
            <TabsContent
              value="tests"
              className="m-0 mt-0 absolute inset-0 overflow-y-auto p-3 focus-visible:outline-none sm:p-4"
            >
              <div className="space-y-1.5">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={cn(
                      'rounded-lg border bg-surface px-3 py-2.5',
                      result.passed ? 'border-success/25' : 'border-destructive/25'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={cn(
                          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                          result.passed
                            ? 'bg-success/15 text-success'
                            : 'bg-destructive/15 text-destructive'
                        )}
                      >
                        {result.passed ? (
                          <Check className="h-3 w-3" aria-hidden />
                        ) : (
                          <X className="h-3 w-3" aria-hidden />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">
                          {result.name || result.path || `Test ${index + 1}`}
                        </p>
                        {result.path && result.name ? (
                          <p className="mt-0.5 font-mono text-2xs text-muted-foreground">
                            {result.path}
                          </p>
                        ) : null}
                        {result.error ? (
                          <p className="mt-1 break-words font-mono text-2xs text-destructive">
                            {result.error}
                          </p>
                        ) : result.expected !== undefined || result.actual !== undefined ? (
                          <p className="mt-1 break-words font-mono text-2xs text-muted-foreground">
                            expected <span className="text-foreground">{String(result.expected)}</span>
                            {' · '}
                            received <span className="text-foreground">{String(result.actual)}</span>
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
                {testResults.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
                    Test counts were returned without per-test details.
                  </div>
                ) : null}
              </div>
            </TabsContent>
          ) : null}

          <TabsContent
            value="raw"
            className="m-0 mt-0 absolute inset-0 overflow-auto p-3 focus-visible:outline-none sm:p-4"
          >
            <div className="min-h-full rounded-lg border border-border bg-[hsl(var(--code-bg))] p-3 sm:p-4">
              <pre className="whitespace-pre font-mono text-xs leading-6 text-muted-foreground">
                {rawDisplay || 'Empty response'}
              </pre>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
