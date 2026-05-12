'use client';

import { useRequestStore } from '@/store/requestStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Settings2, ListTree } from 'lucide-react';

type Variant = 'query' | 'form';

interface ParamsEditorProps {
  variant?: Variant;
}

export function ParamsEditor({ variant = 'query' }: ParamsEditorProps) {
  const { getActiveTab, updateActiveTab } = useRequestStore();
  const activeTab = getActiveTab();

  if (!activeTab) return null;

  const field = variant === 'form' ? 'formFields' : 'queryParams';
  const rows = (variant === 'form' ? activeTab.formFields : activeTab.queryParams) || [];

  const setRows = (next: typeof rows) => {
    updateActiveTab({ [field]: next } as any);
  };

  const updateRow = (index: number, key: string, value: string | boolean) => {
    setRows(rows.map((p, i) => (i === index ? { ...p, [key]: value } : p)));
  };

  const addRow = () => {
    setRows([...rows, { key: '', value: '', enabled: true }]);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const isForm = variant === 'form';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          {isForm ? (
            <ListTree className="h-3.5 w-3.5" />
          ) : (
            <Settings2 className="h-3.5 w-3.5" />
          )}
          {isForm ? 'Form fields' : 'Query parameters'}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={addRow}
          className="h-7 text-xs hover:bg-primary/10 hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 px-2 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
          <div className="w-5"></div>
          <div className="pl-1">Key</div>
          <div className="pl-1">Value</div>
          <div className="w-9"></div>
        </div>

        {rows.map((param, index) => (
          <div
            key={index}
            className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center group transition-all"
          >
            <input
              type="checkbox"
              checked={param.enabled}
              onChange={(e) => updateRow(index, 'enabled', e.target.checked)}
              className="w-4 h-4 rounded border-input accent-primary ml-1 cursor-pointer"
            />
            <Input
              placeholder="Key"
              value={param.key}
              onChange={(e) => updateRow(index, 'key', e.target.value)}
              className="font-mono text-xs h-9 bg-muted/10 focus:bg-background"
            />
            <Input
              placeholder="Value"
              value={param.value}
              onChange={(e) => updateRow(index, 'value', e.target.value)}
              className="font-mono text-xs h-9 bg-muted/10 focus:bg-background"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeRow(index)}
              className="h-9 w-9 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-border rounded-xl bg-muted/5">
            <p className="text-xs text-muted-foreground">
              {isForm
                ? 'Add key/value pairs for multipart or URL-encoded bodies.'
                : 'No query parameters. These are appended to the URL.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
