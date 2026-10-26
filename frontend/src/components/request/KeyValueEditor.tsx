'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { KeyValuePair } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface KeyValueEditorProps {
  rows: KeyValuePair[];
  onChange: (rows: KeyValuePair[]) => void;
  idPrefix: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  keySuggestions?: string[];
  valueSuggestions?: string[];
  className?: string;
}

export function KeyValueEditor({
  rows,
  onChange,
  idPrefix,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  addLabel = 'Add row',
  emptyTitle = 'No entries yet',
  emptyDescription = 'Add a key and value to include it with this request.',
  keySuggestions,
  valueSuggestions,
  className,
}: KeyValueEditorProps) {
  const updateRow = (index: number, updates: Partial<KeyValuePair>) => {
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...updates } : row)));
  };

  const addRow = () => {
    onChange([...rows, { key: '', value: '', enabled: true }]);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, rowIndex) => rowIndex !== index));
  };

  const enabledCount = rows.filter((row) => row.enabled && row.key.trim()).length;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-2xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {rows.length === 0
            ? 'No rows'
            : `${enabledCount} of ${rows.length} ${rows.length === 1 ? 'row' : 'rows'} enabled`}
        </p>
        <Button variant="ghost" size="xs" onClick={addRow} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {addLabel}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="hidden grid-cols-[2rem_minmax(0,1fr)_minmax(0,1.2fr)_2.25rem] items-center gap-2 border-b border-border bg-surface-2/50 px-2.5 py-1.5 text-2xs font-medium uppercase tracking-[0.1em] text-muted-foreground sm:grid">
          <span className="sr-only">Enabled</span>
          <span>Key</span>
          <span>Value</span>
          <span className="sr-only">Actions</span>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[13px] font-medium text-foreground">{emptyTitle}</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
              {emptyDescription}
            </p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={addRow}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {addLabel}
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {rows.map((row, index) => (
              <div
                key={`${idPrefix}-${index}`}
                className="group grid grid-cols-[1.75rem_minmax(0,1fr)_minmax(0,1.2fr)_2rem] items-center gap-1.5 px-2 py-1.5 transition-colors hover:bg-surface-2/45 sm:gap-2 sm:px-2.5"
              >
                <label className="flex h-8 w-7 cursor-pointer items-center justify-center rounded">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(event) => updateRow(index, { enabled: event.target.checked })}
                    className="h-3.5 w-3.5 cursor-pointer rounded border-input accent-primary"
                    aria-label={`${row.key || `Row ${index + 1}`} enabled`}
                  />
                </label>

                <Input
                  value={row.key}
                  onChange={(event) => updateRow(index, { key: event.target.value })}
                  placeholder={keyPlaceholder}
                  className="h-8 border-transparent bg-transparent px-2 font-mono text-xs hover:border-border focus:bg-surface-2/60"
                  list={keySuggestions ? `${idPrefix}-keys` : undefined}
                  aria-label={`${idPrefix} key ${index + 1}`}
                  spellCheck={false}
                />

                <Input
                  value={row.value}
                  onChange={(event) => updateRow(index, { value: event.target.value })}
                  placeholder={valuePlaceholder}
                  className="h-8 border-transparent bg-transparent px-2 font-mono text-xs hover:border-border focus:bg-surface-2/60"
                  list={valueSuggestions ? `${idPrefix}-values` : undefined}
                  aria-label={`${idPrefix} value ${index + 1}`}
                  spellCheck={false}
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground hover:!text-destructive focus-visible:text-destructive sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                  onClick={() => removeRow(index)}
                  aria-label={`Remove ${row.key || `row ${index + 1}`}`}
                  title="Remove row"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {keySuggestions ? (
        <datalist id={`${idPrefix}-keys`}>
          {keySuggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      ) : null}
      {valueSuggestions ? (
        <datalist id={`${idPrefix}-values`}>
          {valueSuggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      ) : null}
    </div>
  );
}
