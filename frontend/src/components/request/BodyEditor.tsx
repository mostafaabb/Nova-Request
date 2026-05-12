'use client';

import { useRequestStore } from '@/store/requestStore';
import { BodyType } from '@/types';
import { cn } from '@/lib/utils';
import { ParamsEditor } from './ParamsEditor';

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'raw', label: 'Raw' },
  { value: 'form-data', label: 'Form Data' },
  { value: 'x-www-form-urlencoded', label: 'URL Encoded' },
];

export function BodyEditor() {
  const { getActiveTab, updateActiveTab } = useRequestStore();
  const activeTab = getActiveTab();

  if (!activeTab) return null;

  const { body, bodyType, method } = activeTab;

  const methodAllowsBody = method !== 'GET' && method !== 'HEAD';

  if (!methodAllowsBody) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground bg-muted/5 rounded-xl border-2 border-dashed border-border m-4">
        <p className="text-sm font-medium">{method} requests do not send a body.</p>
        <p className="text-xs mt-1 text-center max-w-sm">
          Switch to POST, PUT, PATCH, DELETE, or OPTIONS if you need a request body.
        </p>
      </div>
    );
  }

  const usesFormTable =
    bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 p-1 bg-muted/30 rounded-lg w-fit max-w-full">
        {BODY_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => updateActiveTab({ bodyType: type.value })}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-md transition-all',
              bodyType === type.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {type.label}
          </button>
        ))}
      </div>

      {usesFormTable && (
        <div className="rounded-xl border border-border/80 bg-muted/5 p-2">
          <ParamsEditor variant="form" />
        </div>
      )}

      {bodyType !== 'none' && !usesFormTable && (
        <textarea
          value={body}
          onChange={(e) => updateActiveTab({ body: e.target.value })}
          placeholder={
            bodyType === 'json'
              ? `{\n  "key": "value"\n}`
              : 'Enter raw body (text, XML, etc.)'
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
