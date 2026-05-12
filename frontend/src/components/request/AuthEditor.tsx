'use client';

import { useRequestStore } from '@/store/requestStore';
import { AuthType } from '@/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Shield } from 'lucide-react';

const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: 'none', label: 'No Auth' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'apikey', label: 'API Key' },
];

export function AuthEditor() {
  const { getActiveTab, updateActiveTab } = useRequestStore();
  const activeTab = getActiveTab();

  if (!activeTab) return null;

  const auth = activeTab.auth;

  const setAuth = (partial: Partial<typeof auth>) => {
    updateActiveTab({ auth: { ...auth, ...partial } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <Shield className="h-3.5 w-3.5" />
        Authorization
      </div>

      <div className="flex flex-wrap gap-2 p-1 bg-muted/30 rounded-lg w-fit max-w-full">
        {AUTH_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setAuth({ type: t.value })}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-md transition-all',
              auth.type === t.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {auth.type === 'bearer' && (
        <div className="space-y-2 max-w-xl">
          <label className="text-[10px] font-bold uppercase text-muted-foreground">Token</label>
          <Input
            placeholder="Bearer token ({{variables}} supported)"
            value={auth.bearerToken || ''}
            onChange={(e) => setAuth({ bearerToken: e.target.value })}
            className="font-mono text-xs h-10 bg-muted/10 focus:bg-background"
          />
        </div>
      )}

      {auth.type === 'basic' && (
        <div className="grid gap-3 sm:grid-cols-2 max-w-2xl">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Username</label>
            <Input
              value={auth.basicUsername || ''}
              onChange={(e) => setAuth({ basicUsername: e.target.value })}
              className="font-mono text-xs h-10 bg-muted/10 focus:bg-background"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Password</label>
            <Input
              type="password"
              value={auth.basicPassword || ''}
              onChange={(e) => setAuth({ basicPassword: e.target.value })}
              className="font-mono text-xs h-10 bg-muted/10 focus:bg-background"
            />
          </div>
        </div>
      )}

      {auth.type === 'apikey' && (
        <div className="space-y-4 max-w-2xl">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Key</label>
            <Input
              placeholder="e.g. X-API-Key or api_key"
              value={auth.apiKeyKey || ''}
              onChange={(e) => setAuth({ apiKeyKey: e.target.value })}
              className="font-mono text-xs h-10 bg-muted/10 focus:bg-background"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Value</label>
            <Input
              placeholder="Secret value"
              value={auth.apiKeyValue || ''}
              onChange={(e) => setAuth({ apiKeyValue: e.target.value })}
              className="font-mono text-xs h-10 bg-muted/10 focus:bg-background"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Add to</label>
              <Select
                value={auth.apiKeyIn || 'header'}
                onChange={(e) =>
                  setAuth({ apiKeyIn: e.target.value as 'header' | 'query' })
                }
                className="h-10 text-xs font-semibold bg-muted/10"
              >
                <option value="header">Header</option>
                <option value="query">Query params</option>
              </Select>
            </div>
            {auth.apiKeyIn !== 'query' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Header name
                </label>
                <Input
                  placeholder="X-API-Key"
                  value={auth.apiKeyHeaderName || ''}
                  onChange={(e) => setAuth({ apiKeyHeaderName: e.target.value })}
                  className="font-mono text-xs h-10 bg-muted/10 focus:bg-background"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {auth.type === 'none' && (
        <p className="text-xs text-muted-foreground max-w-md">
          This request does not use authorization. You can still set manual headers (for example{' '}
          <span className="font-mono">Authorization</span>) in the Headers tab; those override auth
          here when the same header name is used.
        </p>
      )}
    </div>
  );
}
