'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Server, SlidersHorizontal } from 'lucide-react';
import { useRequestStore } from '@/store/requestStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ResizableSplit } from '@/components/layout/ResizableSplit';
import { RequestBuilder } from '@/components/request/RequestBuilder';
import { ResponseViewer } from '@/components/response/ResponseViewer';
import { cn, getMethodColor, getStatusColor } from '@/lib/utils';

type Pane = 'request' | 'response';

export default function RequestPage() {
  const isWide = useMediaQuery('(min-width: 1280px)');
  const tabs = useRequestStore((state) => state.tabs);
  const activeTabId = useRequestStore((state) => state.activeTabId);
  const activeTab = tabs.find((tab) => tab.id === activeTabId) || null;
  const [pane, setPane] = useState<Pane>('request');
  const wasLoading = useRef(false);

  useEffect(() => {
    if (activeTab?.isLoading && !wasLoading.current) {
      setPane('response');
    }
    wasLoading.current = Boolean(activeTab?.isLoading);
  }, [activeTab?.isLoading]);

  if (isWide) {
    return (
      <div className="h-full min-h-0 bg-background">
        <ResizableSplit
          defaultSize={48}
          minSize={32}
          maxSize={68}
          storageKey="nova-request-response-width"
          handleClassName="border-x border-border bg-surface-2/30 hover:bg-primary/10"
          first={
            <div className="h-full min-h-0 border-r border-border/0">
              <RequestBuilder />
            </div>
          }
          second={
            <div className="h-full min-h-0">
              <ResponseViewer />
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface px-2 py-1.5">
        <div
          className="inline-flex rounded-lg border border-border bg-surface-2/50 p-0.5"
          role="group"
          aria-label="Switch between request and response"
        >
          <button
            type="button"
            onClick={() => setPane('request')}
            aria-pressed={pane === 'request'}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-2xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
              pane === 'request'
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            Request
          </button>
          <button
            type="button"
            onClick={() => setPane('response')}
            aria-pressed={pane === 'response'}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-2xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
              pane === 'response'
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Server className="h-3.5 w-3.5" aria-hidden />
            Response
            {activeTab?.response && !activeTab.isLoading ? (
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  activeTab.response.success ? 'bg-success' : 'bg-destructive'
                )}
                aria-hidden
              />
            ) : null}
          </button>
        </div>

        <div className="ml-auto flex min-w-0 items-center gap-2 text-2xs">
          {activeTab ? (
            <span className={cn('shrink-0 font-mono font-semibold', getMethodColor(activeTab.method))}>
              {activeTab.method}
            </span>
          ) : null}
          {activeTab?.isLoading ? (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              Sending
            </span>
          ) : activeTab?.response?.status ? (
            <span
              className={cn(
                'shrink-0 rounded border px-1.5 py-0.5 font-mono text-3xs font-semibold',
                getStatusColor(activeTab.response.status)
              )}
            >
              {activeTab.response.status}
            </span>
          ) : (
            <span className="text-muted-foreground">No response</span>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className={cn('h-full min-h-0', pane === 'request' ? 'block' : 'hidden')}>
          <RequestBuilder />
        </div>
        <div className={cn('h-full min-h-0', pane === 'response' ? 'block' : 'hidden')}>
          <ResponseViewer />
        </div>
      </div>
    </div>
  );
}
