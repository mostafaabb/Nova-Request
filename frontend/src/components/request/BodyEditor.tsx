'use client';

import { useMemo } from 'react';
import { AlertCircle, CheckCircle2, Info, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRequestStore } from '@/store/requestStore';
import type { BodyType } from '@/types';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { ParamsEditor } from './ParamsEditor';

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'raw', label: 'Raw' },
  { value: 'form-data', label: 'Form data' },
  { value: 'x-www-form-urlencoded', label: 'URL encoded' },
];

export function BodyEditor() {
  const { getActiveTab, updateActiveTab } = useRequestStore();
  const activeTab = getActiveTab();

  const jsonState = useMemo(() => {
    if (!activeTab || activeTab.bodyType !== 'json' || !activeTab.body.trim()) return null;
    try {
      JSON.parse(activeTab.body);
      return 'valid' as const;
    } catch {
      return 'invalid' as const;
    }
  }, [activeTab]);

  if (!activeTab) return null;

  const { body, bodyType, method } = activeTab;
  const methodAllowsBody = method !== 'GET' && method !== 'HEAD';
  const usesFormTable = bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded';

  if (!methodAllowsBody) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-2/25 px-6 py-12 text-center">
        <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground">
          <Info className="h-4 w-4" aria-hidden />
        </span>
        <p className="text-[13px] font-semibold text-foreground">
          {method} requests do not send a body
        </p>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
          Switch to POST, PUT, PATCH, DELETE, or OPTIONS to configure a request body. Parameters,
          headers, and auth still apply.
        </p>
      </div>
    );
  }

  const formatJson = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(body), null, 2);
      updateActiveTab({ body: formatted });
      toast.success('JSON formatted');
    } catch {
      toast.error('Body is not valid JSON');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-2/45 p-1"
          role="group"
          aria-label="Request body type"
        >
          {BODY_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => updateActiveTab({ bodyType: type.value })}
              aria-pressed={bodyType === type.value}
              className={cn(
                'h-7 rounded-md px-2.5 text-2xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                bodyType === type.value
                  ? 'bg-surface text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {type.label}
            </button>
          ))}
        </div>

        {bodyType === 'json' ? (
          <Button
            variant="ghost"
            size="xs"
            onClick={formatJson}
            disabled={!body.trim()}
            className="gap-1.5"
          >
            <Wand2 className="h-3.5 w-3.5" aria-hidden />
            Format JSON
          </Button>
        ) : null}
      </div>

      {usesFormTable ? (
        <div className="rounded-lg border border-border bg-surface p-3">
          <ParamsEditor variant="form" />
        </div>
      ) : bodyType === 'none' ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-2/25 px-6 py-10 text-center">
          <p className="text-[13px] font-semibold text-foreground">This request has no body</p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Choose JSON, raw, or a form body type to send data with this request.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-[hsl(var(--code-bg))]">
          <div className="flex min-h-8 items-center justify-between gap-3 border-b border-border px-3 py-1">
            <span className="font-mono text-2xs uppercase tracking-wide text-muted-foreground">
              {bodyType === 'json' ? 'application/json' : 'text/plain'}
            </span>
            {jsonState === 'valid' ? (
              <span className="flex items-center gap-1 text-2xs font-medium text-success">
                <CheckCircle2 className="h-3 w-3" aria-hidden />
                Valid JSON
              </span>
            ) : jsonState === 'invalid' ? (
              <span className="flex items-center gap-1 text-2xs font-medium text-warning">
                <AlertCircle className="h-3 w-3" aria-hidden />
                Invalid JSON
              </span>
            ) : (
              <span className="text-2xs text-muted-foreground">
                {body.length.toLocaleString()} characters
              </span>
            )}
          </div>
          <textarea
            value={body}
            onChange={(event) => updateActiveTab({ body: event.target.value })}
            placeholder={
              bodyType === 'json'
                ? '{\n  "key": "value"\n}'
                : 'Enter a raw request body (text, XML, etc.)'
            }
            spellCheck={false}
            aria-label="Request body"
            className="min-h-[18rem] w-full resize-y bg-transparent p-3 font-mono text-xs leading-6 text-foreground outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
          />
        </div>
      )}
    </div>
  );
}
