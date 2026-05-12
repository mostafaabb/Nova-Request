'use client';

import { cn } from '@/lib/utils';

export function scorePassword(password: string): { level: number; label: string } {
  if (!password) return { level: 0, label: '' };
  if (password.length < 6) return { level: 1, label: 'Too short' };

  let pts = 1;
  if (password.length >= 8) pts++;
  if (password.length >= 12) pts++;
  if (/[0-9]/.test(password)) pts++;
  if (/[^a-zA-Z0-9\s]/.test(password)) pts++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) pts++;

  const level = Math.min(pts, 4);
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  return { level, label: labels[level - 1] };
}

const BAR_COLORS = [
  'bg-destructive/85',
  'bg-amber-500/90',
  'bg-sky-500/90',
  'bg-emerald-500/90',
];

export function PasswordStrength({ password }: { password: string }) {
  const { level, label } = scorePassword(password);
  if (!password) return null;

  const activeColor = BAR_COLORS[Math.max(0, level - 1)];

  return (
    <div className="space-y-2 pt-1">
      <div className="flex h-1.5 gap-1 rounded-full bg-muted overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'flex-1 rounded-full transition-colors duration-200',
              i <= level ? activeColor : 'bg-muted-foreground/15'
            )}
          />
        ))}
      </div>
      <p className="text-[12px] font-medium text-muted-foreground">
        Password strength:{' '}
        <span className="font-semibold text-foreground">{label}</span>
      </p>
    </div>
  );
}
