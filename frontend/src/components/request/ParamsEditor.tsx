'use client';

import { useRequestStore } from '@/store/requestStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

export function ParamsEditor() {
  const { queryParams, addQueryParam, removeQueryParam, updateQueryParam } = useRequestStore();

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 text-sm text-muted-foreground font-medium">
        <div className="w-8"></div>
        <div>Key</div>
        <div>Value</div>
        <div className="w-8"></div>
      </div>

      {queryParams.map((param, index) => (
        <div key={index} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
          <input
            type="checkbox"
            checked={param.enabled}
            onChange={(e) => updateQueryParam(index, 'enabled', e.target.checked)}
            className="w-4 h-4 rounded border-input"
          />
          <Input
            placeholder="Parameter name"
            value={param.key}
            onChange={(e) => updateQueryParam(index, 'key', e.target.value)}
            className="font-mono text-sm"
          />
          <Input
            placeholder="Value"
            value={param.value}
            onChange={(e) => updateQueryParam(index, 'value', e.target.value)}
            className="font-mono text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeQueryParam(index)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button variant="ghost" size="sm" onClick={addQueryParam} className="mt-2">
        <Plus className="h-4 w-4 mr-1" />
        Add Parameter
      </Button>
    </div>
  );
}