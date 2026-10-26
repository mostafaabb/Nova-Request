'use client';

import { KeyRound, ShieldCheck } from 'lucide-react';
import { useRequestStore } from '@/store/requestStore';
import { AuthType } from '@/types';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';

const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: 'none', label: 'No auth' },
  { value: 'bearer', label: 'Bearer' },
  { value: 'basic', label: 'Basic' },
  { value: 'apikey', label: 'API key' },
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
      <div>
        <div
          className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-2/45 p-1"
          role="group"
          aria-label="Authorization type"
        >
          {AUTH_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setAuth({ type: type.value })}
              aria-pressed={auth.type === type.value}
              className={cn(
                'h-7 rounded-md px-2.5 text-2xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                auth.type === type.value
                  ? 'bg-surface text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {auth.type === 'none' ? (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-2/30 px-3 py-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-[13px] font-medium text-foreground">No authorization configured</p>
            <p className="mt-0.5 max-w-lg text-xs leading-relaxed text-muted-foreground">
              You can still add a manual <code className="font-mono text-foreground">Authorization</code>{' '}
              header in the Headers tab. Custom headers take precedence over generated auth headers.
            </p>
          </div>
        </div>
      ) : null}

      {auth.type === 'bearer' ? (
        <div className="max-w-xl space-y-1.5">
          <label htmlFor="auth-bearer-token" className="field-label">
            Bearer token
          </label>
          <PasswordInput
            id="auth-bearer-token"
            placeholder="{{token}}"
            value={auth.bearerToken || ''}
            onChange={(event) => setAuth({ bearerToken: event.target.value })}
            className="h-9 font-mono text-xs"
            autoComplete="off"
          />
          <p className="field-hint">
            Sent as <code className="font-mono text-foreground">Authorization: Bearer …</code>{' '}
            Environment variables are resolved when the request runs.
          </p>
        </div>
      ) : null}

      {auth.type === 'basic' ? (
        <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="auth-basic-username" className="field-label">
              Username
            </label>
            <Input
              id="auth-basic-username"
              value={auth.basicUsername || ''}
              onChange={(event) => setAuth({ basicUsername: event.target.value })}
              placeholder="username"
              className="h-9 font-mono text-xs"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="auth-basic-password" className="field-label">
              Password
            </label>
            <PasswordInput
              id="auth-basic-password"
              value={auth.basicPassword || ''}
              onChange={(event) => setAuth({ basicPassword: event.target.value })}
              placeholder="password"
              className="h-9 font-mono text-xs"
              autoComplete="off"
            />
          </div>
          <p className="field-hint sm:col-span-2">
            Credentials are base64-encoded into the <code className="font-mono">Authorization</code>{' '}
            header when the request runs.
          </p>
        </div>
      ) : null}

      {auth.type === 'apikey' ? (
        <div className="max-w-2xl space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="auth-api-key-name" className="field-label">
                Key name
              </label>
              <Input
                id="auth-api-key-name"
                placeholder="X-API-Key"
                value={auth.apiKeyKey || ''}
                onChange={(event) => setAuth({ apiKeyKey: event.target.value })}
                className="h-9 font-mono text-xs"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="auth-api-key-value" className="field-label">
                Key value
              </label>
              <PasswordInput
                id="auth-api-key-value"
                placeholder="{{api_key}}"
                value={auth.apiKeyValue || ''}
                onChange={(event) => setAuth({ apiKeyValue: event.target.value })}
                className="h-9 font-mono text-xs"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="auth-api-key-in" className="field-label">
                Add to
              </label>
              <Select
                id="auth-api-key-in"
                value={auth.apiKeyIn || 'header'}
                onChange={(event) =>
                  setAuth({ apiKeyIn: event.target.value as 'header' | 'query' })
                }
                className="h-9 text-xs"
              >
                <option value="header">Request header</option>
                <option value="query">Query parameter</option>
              </Select>
            </div>
            {auth.apiKeyIn !== 'query' ? (
              <div className="space-y-1.5">
                <label htmlFor="auth-api-key-header" className="field-label">
                  Header name
                </label>
                <Input
                  id="auth-api-key-header"
                  placeholder="X-API-Key"
                  value={auth.apiKeyHeaderName || ''}
                  onChange={(event) => setAuth({ apiKeyHeaderName: event.target.value })}
                  className="h-9 font-mono text-xs"
                  autoComplete="off"
                />
              </div>
            ) : null}
          </div>
          <p className="flex items-start gap-2 text-2xs leading-relaxed text-muted-foreground">
            <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            The key name field is used for query parameters. For headers, the header name field
            takes precedence when provided.
          </p>
        </div>
      ) : null}
    </div>
  );
}
