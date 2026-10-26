'use client';

import { Plus, X } from 'lucide-react';
import { useRequestStore } from '@/store/requestStore';
import { cn, getMethodColor, getRequestLabel } from '@/lib/utils';

export function RequestTabs() {
  const { tabs, activeTabId, setActiveTab, removeTab, addTab } = useRequestStore();

  return (
    <div
      className="flex min-h-10 shrink-0 items-stretch overflow-x-auto border-b border-border bg-surface-2/35 no-scrollbar"
      role="tablist"
      aria-label="Open requests"
    >
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        const label = tab.name && tab.name !== 'New Request' ? tab.name : getRequestLabel(tab.url);

        return (
          <div
            key={tab.id}
            className={cn(
              'group relative flex min-w-[9.5rem] max-w-[15rem] items-center border-r border-border/80 transition-colors',
              isActive ? 'bg-background' : 'hover:bg-surface-2/70'
            )}
          >
            {isActive ? (
              <span
                className="absolute inset-x-0 top-0 h-0.5 bg-primary"
                aria-hidden
              />
            ) : null}
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className="flex min-w-0 flex-1 items-center gap-2 py-2.5 pl-3 pr-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60"
              title={`${tab.method} ${tab.url || 'Untitled request'}`}
            >
              <span
                className={cn(
                  'shrink-0 font-mono text-3xs font-bold tracking-tight',
                  getMethodColor(tab.method),
                  !isActive && 'opacity-70'
                )}
              >
                {tab.method}
              </span>
              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-xs',
                  isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
              {tab.isDirty ? (
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  aria-label="Unsaved changes"
                  title="Unsaved changes"
                />
              ) : null}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                removeTab(tab.id);
              }}
              className="mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-surface-3 hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
              aria-label={`Close ${label}`}
              title="Close tab"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => addTab()}
        className="flex w-10 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60"
        aria-label="New request tab"
        title="New request tab"
      >
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
