'use client';

import { useRequestStore } from '@/store/requestStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

export function HeadersEditor() {
  const { headers, addHeader, removeHeader, updateHeader } = useRequestStore();

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 text-sm text-muted-foreground font-medium">
        <div className="w-8"></div>
        <div>Key</div>
        <div>Value</div>
        <div className="w-8"></div>
      </div>

      {headers.map((header, index) => (
        <div key={index} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
          <input
            type="checkbox"
            checked={header.enabled}
            onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
            className="w-4 h-4 rounded border-input"
          />
          <Input
            placeholder="Header name"
            value={header.key}
            onChange={(e) => updateHeader(index, 'key', e.target.value)}
            className="font-mono text-sm"
          />
          <Input
            placeholder="Value"
            value={header.value}
            onChange={(e) => updateHeader(index, 'value', e.target.value)}
            className="font-mono text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeHeader(index)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button variant="ghost" size="sm" onClick={addHeader} className="mt-2">
        <Plus className="h-4 w-4 mr-1" />
        Add Header
      </Button>
    </div>
  );
}