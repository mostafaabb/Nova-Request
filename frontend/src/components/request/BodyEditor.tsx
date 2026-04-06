'use client';

import { useRequestStore } from '@/store/requestStore';
import { BodyType } from '@/types';
import { cn } from '@/lib/utils';

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'form-data', label: 'Form Data' },
  { value: 'raw', label: 'Raw' },
];

export function BodyEditor() {
  const { getActiveTab, updateActiveTab } = useRequestStore();
  const activeTab = getActiveTab();

  if (!activeTab) return null;

  const { body, bodyType, method } = activeTab;

  if (method === 'GET') {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground bg-muted/5 rounded-xl border-2 border-dashed border-border m-4">
        <p className="text-sm font-medium">GET requests cannot have a request body.</p>
        <p className="text-xs mt-1">Try switching the method to POST or PUT.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Body type selector */}
      <div className="flex gap-2 p-1 bg-muted/30 rounded-lg w-fit">
        {BODY_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => updateActiveTab({ bodyType: type.value })}
            className={cn(
              'px-4 py-1.5 text-xs font-semibold rounded-md transition-all',
              bodyType === type.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Body editor */}
      {bodyType !== 'none' && (
        <textarea
          value={body}
          onChange={(e) => updateActiveTab({ body: e.target.value })}
          placeholder={
            bodyType === 'json'
              ? `{\n  "key": "value"\n}`
              : bodyType === 'form-data'
              ? 'key1=value1&key2=value2'
              : 'Enter raw body content'
          }
          className={cn(
            'w-full h-80 p-4 rounded-xl border border-border bg-muted/5',
            'font-mono text-xs resize-none transition-all',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background'
          )}
        />
      )}
    </div>
  );
}