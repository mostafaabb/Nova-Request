'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JsonViewerProps {
  data: unknown;
  initialExpanded?: boolean;
  depth?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function PrimitiveValue({ value }: { value: unknown }) {
  if (value === null) {
    return <span className="text-[hsl(var(--json-null))]">null</span>;
  }
  if (typeof value === 'undefined') {
    return <span className="text-muted-foreground">undefined</span>;
  }
  if (typeof value === 'boolean') {
    return <span className="text-[hsl(var(--json-boolean))]">{String(value)}</span>;
  }
  if (typeof value === 'number') {
    return <span className="text-[hsl(var(--json-number))]">{String(value)}</span>;
  }
  if (typeof value === 'string') {
    const isLink = /^https?:\/\//.test(value);
    if (isLink) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-[hsl(var(--json-string))] underline decoration-[hsl(var(--json-string))]/35 underline-offset-2 hover:decoration-current"
        >
          &quot;{value}&quot;
        </a>
      );
    }
    return (
      <span className="break-words text-[hsl(var(--json-string))]">
        &quot;{value}&quot;
      </span>
    );
  }
  return <span className="text-muted-foreground">{String(value)}</span>;
}

function ToggleButton({
  expanded,
  onClick,
  label,
}: {
  expanded: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-label={label}
      className="-ml-4 mr-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-muted-foreground/70 transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      {expanded ? (
        <ChevronDown className="h-3 w-3" aria-hidden />
      ) : (
        <ChevronRight className="h-3 w-3" aria-hidden />
      )}
    </button>
  );
}

export function JsonViewer({ data, initialExpanded = true, depth = 0 }: JsonViewerProps) {
  if (Array.isArray(data)) {
    return <JsonCollection data={data} initialExpanded={initialExpanded} depth={depth} variant="array" />;
  }

  if (isRecord(data)) {
    return <JsonCollection data={data} initialExpanded={initialExpanded} depth={depth} variant="object" />;
  }

  return <PrimitiveValue value={data} />;
}

function JsonCollection({
  data,
  initialExpanded,
  depth,
  variant,
}: {
  data: Record<string, unknown> | unknown[];
  initialExpanded: boolean;
  depth: number;
  variant: 'object' | 'array';
}) {
  const [expanded, setExpanded] = useState(initialExpanded || depth === 0);
  const entries: [string, unknown][] = Array.isArray(data)
    ? data.map((value, index) => [String(index), value])
    : Object.entries(data);
  const openBrace = variant === 'array' ? '[' : '{';
  const closeBrace = variant === 'array' ? ']' : '}';
  const countLabel = `${entries.length} ${entries.length === 1 ? (variant === 'array' ? 'item' : 'key') : variant === 'array' ? 'items' : 'keys'}`;

  if (entries.length === 0) {
    return (
      <span className="text-muted-foreground">
        {openBrace}
        {closeBrace}
      </span>
    );
  }

  return (
    <div className={cn('json-viewer', depth > 0 && 'pl-1')}>
      <div className="flex items-start">
        <ToggleButton
          expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          label={expanded ? `Collapse ${countLabel}` : `Expand ${countLabel}`}
        />
        <span className="text-muted-foreground">{openBrace}</span>
        {!expanded ? (
          <>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mx-1 rounded px-1 text-2xs text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              {countLabel}
            </button>
            <span className="text-muted-foreground">{closeBrace}</span>
          </>
        ) : null}
      </div>

      {expanded ? (
        <>
          <div className="ml-[0.45rem] border-l border-border/70 pl-3">
            {entries.map(([key, value], index) => (
              <div key={key} className="group flex items-start rounded-sm hover:bg-surface-2/30">
                <div className="min-w-0 flex-1 break-words py-px">
                  {variant === 'object' ? (
                    <>
                      <span className="text-[hsl(var(--json-key))]">&quot;{key}&quot;</span>
                      <span className="text-muted-foreground">: </span>
                    </>
                  ) : (
                    <span className="select-none text-muted-foreground/55">{key}: </span>
                  )}
                  <JsonViewer data={value} initialExpanded={false} depth={depth + 1} />
                  {index < entries.length - 1 ? (
                    <span className="text-muted-foreground/70">,</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-start">
            <span className="w-4 shrink-0" aria-hidden />
            <span className="text-muted-foreground">{closeBrace}</span>
          </div>
        </>
      ) : null}
    </div>
  );
}
