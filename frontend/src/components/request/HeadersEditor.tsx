'use client';

import { useRequestStore } from '@/store/requestStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, ShieldCheck, Zap } from 'lucide-react';

const COMMON_HEADER_KEYS = [
  'Authorization', 'Content-Type', 'Accept', 'User-Agent', 'Cache-Control', 
  'Origin', 'Referer', 'Cookie', 'Host', 'X-API-Key', 'Accept-Language',
  'Access-Control-Allow-Origin', 'Connection', 'Pragma'
];

const COMMON_HEADER_VALUES = [
  'application/json', 'application/x-www-form-urlencoded', 'application/xml',
  'multipart/form-data', 'text/plain', 'Bearer {{token}}', 'Basic {{auth_code}}',
  'no-cache', 'keep-alive', 'utf-8', 'gzip, deflate, br'
];

export function HeadersEditor() {
  const { getActiveTab, updateActiveTab } = useRequestStore();
  const activeTab = getActiveTab();

  if (!activeTab) return null;

  const headers = activeTab.headers || [];

  const updateHeader = (index: number, field: string, value: string | boolean) => {
    const newHeaders = headers.map((h, i) => 
      i === index ? { ...h, [field]: value } : h
    );
    updateActiveTab({ headers: newHeaders });
  };

  const addHeader = () => {
    updateActiveTab({ 
      headers: [...headers, { key: '', value: '', enabled: true }] 
    });
  };

  const removeHeader = (index: number) => {
    updateActiveTab({ 
      headers: headers.filter((_, i) => i !== index) 
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5" />
          Request Headers
          <span className="text-[10px] font-normal lowercase opacity-60">(Auto-complete enabled)</span>
        </h3>
        <Button variant="ghost" size="sm" onClick={addHeader} className="h-7 text-xs hover:bg-primary/10 hover:text-primary">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Header
        </Button>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 px-2 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
          <div className="w-5"></div>
          <div className="pl-1">Key</div>
          <div className="pl-1">Value</div>
          <div className="w-9"></div>
        </div>

        {headers.map((header, index) => (
          <div key={index} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center group transition-all relative">
            <input
              type="checkbox"
              checked={header.enabled}
              onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
              className="w-4 h-4 rounded border-input accent-primary ml-1 cursor-pointer"
            />
            
            {/* Key Input with Suggestions */}
            <div className="relative group/input">
              <Input
                placeholder="e.g. Content-Type"
                value={header.key}
                onChange={(e) => updateHeader(index, 'key', e.target.value)}
                list={`header-keys-${index}`}
                className="font-mono text-xs h-9 bg-muted/5 focus:bg-background pr-8"
              />
              <Zap className="h-3 w-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-primary opacity-20 group-focus-within/input:opacity-100 transition-opacity" />
              <datalist id={`header-keys-${index}`}>
                {COMMON_HEADER_KEYS.map(key => <option key={key} value={key} />)}
              </datalist>
            </div>

            {/* Value Input with Suggestions */}
            <div className="relative group/input">
              <Input
                placeholder="Value"
                value={header.value}
                onChange={(e) => updateHeader(index, 'value', e.target.value)}
                list={`header-values-${index}`}
                className="font-mono text-xs h-9 bg-muted/5 focus:bg-background pr-8"
              />
              <Zap className="h-3 w-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-primary opacity-20 group-focus-within/input:opacity-100 transition-opacity" />
              <datalist id={`header-values-${index}`}>
                {COMMON_HEADER_VALUES.map(val => <option key={val} value={val} />)}
              </datalist>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeHeader(index)}
              className="h-9 w-9 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {headers.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-border rounded-xl bg-muted/5">
             <p className="text-xs text-muted-foreground">No custom headers. Try adding Authorization to start.</p>
          </div>
        )}
      </div>
    </div>
  );
}