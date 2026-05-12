import { AuthConfig, KeyValuePair } from '@/types';

export function defaultAuthConfig(): AuthConfig {
  return {
    type: 'none',
    bearerToken: '',
    basicUsername: '',
    basicPassword: '',
    apiKeyKey: '',
    apiKeyValue: '',
    apiKeyIn: 'header',
    apiKeyHeaderName: 'X-API-Key',
  };
}

export function mergeAuthIntoRequest(
  auth: AuthConfig | undefined,
  replace: (s: string) => string
): { headers: KeyValuePair[]; queryPairs: KeyValuePair[] } {
  const headers: KeyValuePair[] = [];
  const queryPairs: KeyValuePair[] = [];
  if (!auth || auth.type === 'none') return { headers, queryPairs };

  switch (auth.type) {
    case 'bearer': {
      const t = replace(auth.bearerToken || '').trim();
      if (t) headers.push({ key: 'Authorization', value: `Bearer ${t}`, enabled: true });
      break;
    }
    case 'basic': {
      const u = replace(auth.basicUsername || '');
      const p = replace(auth.basicPassword || '');
      const token = typeof window !== 'undefined' ? window.btoa(`${u}:${p}`) : '';
      headers.push({ key: 'Authorization', value: `Basic ${token}`, enabled: true });
      break;
    }
    case 'apikey': {
      const val = replace(auth.apiKeyValue || '');
      const param = replace(auth.apiKeyKey || '').trim();
      if (!param) break;
      if (auth.apiKeyIn === 'query') {
        queryPairs.push({ key: param, value: val, enabled: true });
      } else {
        const name = (replace(auth.apiKeyHeaderName || 'X-API-Key').trim() || 'X-API-Key');
        headers.push({ key: name, value: val, enabled: true });
      }
      break;
    }
  }
  return { headers, queryPairs };
}
