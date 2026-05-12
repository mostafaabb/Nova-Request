'use client';

import { useRequestStore } from '@/store/requestStore';
import { cn, getMethodColor } from '@/lib/utils';
import { X, Plus } from 'lucide-react';

export function RequestTabs() {
  const { tabs, activeTabId, setActiveTab, removeTab, addTab } = useRequestStore();

  return (
    <div className="flex items-center bg-muted/50 border-b border-border/80 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 border-r border-border/80 cursor-pointer min-w-[132px] max-w-[220px] transition-colors group',
            activeTabId === tab.id
              ? 'bg-background border-b-2 border-b-primary shadow-sm'
              : 'hover:bg-background/60'
          )}
        >
          <span className={cn('text-[10px] font-black', getMethodColor(tab.method))}>
            {tab.method}
          </span>
          <span className="text-xs font-semibold truncate flex-1">
            {tab.name}
            {tab.isDirty && <span className="ml-1 text-primary">*</span>}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeTab(tab.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted-foreground/20 rounded transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      <button
        onClick={() => addTab()}
        className="p-2.5 hover:bg-background/60 transition-colors border-r border-border/80"
        title="New Tab"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
