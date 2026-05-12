'use client';

import { useRequestStore } from '@/store/requestStore';
import { cn, getMethodColor } from '@/lib/utils';
import { X, Plus } from 'lucide-react';

export function RequestTabs() {
  const { tabs, activeTabId, setActiveTab, removeTab, addTab } = useRequestStore();

  return (
    <div className="flex items-center bg-background border-b border-border/80 overflow-x-auto no-scrollbar shadow-sm">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-3 border-r border-border/80 cursor-pointer min-w-[140px] max-w-[240px] transition-smooth group',
            activeTabId === tab.id
              ? 'bg-muted/40 border-b-2 border-b-primary shadow-sm'
              : 'hover:bg-muted/20 text-muted-foreground hover:text-foreground'
          )}
        >
          <span className={cn('text-[10px] font-black w-10', getMethodColor(tab.method))}>
            {tab.method}
          </span>
          <span className="text-xs font-semibold truncate flex-1">
            {tab.name}
            {tab.isDirty && <span className="ml-1 text-primary font-bold">•</span>}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeTab(tab.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-smooth"
            title="Close tab"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      <button
        onClick={() => addTab()}
        className="p-3 hover:bg-muted/20 transition-smooth border-r border-border/80 text-muted-foreground hover:text-foreground"
        title="New Tab"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
