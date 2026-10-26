import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatResponseTime(ms: number): string {
  if (!Number.isFinite(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatRelativeTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(diff)) return '';

  const seconds = Math.round(diff / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  });
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'status-2xx';
  if (status >= 300 && status < 400) return 'status-3xx';
  if (status >= 400 && status < 500) return 'status-4xx';
  return 'status-5xx';
}

export function getStatusVariant(
  status: number
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'warning';
  if (status >= 400 && status < 500) return 'warning';
  if (status >= 500) return 'danger';
  return 'neutral';
}

export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: 'method-get',
    POST: 'method-post',
    PUT: 'method-put',
    PATCH: 'method-patch',
    DELETE: 'method-delete',
    HEAD: 'method-head',
    OPTIONS: 'method-options',
  };
  return colors[method.toUpperCase()] || 'text-muted-foreground';
}

export function getMethodBadgeColor(method: string): string {
  const colors: Record<string, string> = {
    GET: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    POST: 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    PUT: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    PATCH: 'border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    DELETE: 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300',
    HEAD: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
    OPTIONS: 'border-slate-500/25 bg-slate-500/10 text-slate-700 dark:text-slate-300',
  };
  return colors[method.toUpperCase()] || 'border-border bg-surface-2 text-muted-foreground';
}

export function formatJson(data: any): string {
  try {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

export function getRequestLabel(url?: string | null): string {
  const value = url?.trim();
  if (!value) return 'Untitled request';

  const sanitized = value.replace(/\{\{[^}]+\}\}/g, 'variable');
  try {
    const parsed = new URL(sanitized);
    const path = parsed.pathname === '/' ? '' : parsed.pathname;
    return `${parsed.hostname}${path}`;
  } catch {
    return value.length > 48 ? `${value.slice(0, 45)}…` : value;
  }
}

export function parseJson(str: string): any {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export function isJsonString(str: string): boolean {
  if (!str.trim()) return false;
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function downloadJson(data: any, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null) return fallback;
  const response = (error as { response?: { data?: unknown } }).response;
  const data = response?.data as
    | { error?: unknown; message?: unknown; details?: Array<{ msg?: unknown }> }
    | undefined;

  if (typeof data?.error === 'string' && data.error !== 'Validation failed') return data.error;
  if (Array.isArray(data?.details) && typeof data.details[0]?.msg === 'string') {
    return data.details[0].msg;
  }
  if (typeof data?.error === 'string') return data.error;
  if (typeof data?.message === 'string') return data.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function getInitials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }
  return (email?.[0] || 'N').toUpperCase();
}
