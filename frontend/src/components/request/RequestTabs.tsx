'use client';

import { useRequestStore, Tab } from '@/store/requestStore';
import { cn, getMethodColor } from '@/lib/utils';
import { X, Plus, Save } from 'lucide-react';

export function RequestTabs() {
  const { tabs, activeTabId, setActiveTab, removeTab, addTab } = useRequestStore();

  return (
    <div className="flex items-center bg-muted/50 border-b border-border overflow-x-auto no-scrollbar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer min-w-[120px] max-w-[200px] transition-colors group",
            activeTabId === tab.id 
              ? "bg-background border-b-2 border-b-primary" 
              : "hover:bg-muted"
          )}
        >
          <span className={cn("text-[10px] font-bold", getMethodColor(tab.method))}>
            {tab.method}
          </span>
          <span className="text-xs truncate flex-1">
            {tab.name}
            {tab.isDirty && <span className="ml-1 text-primary">•</span>}
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
        className="p-2 hover:bg-muted transition-colors border-r border-border"
        title="New Tab"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
