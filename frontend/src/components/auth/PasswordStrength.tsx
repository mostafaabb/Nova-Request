'use client';

import { cn } from '@/lib/utils';

export function scorePassword(password: string): { level: number; label: string } {
  if (!password) return { level: 0, label: '' };
  if (password.length < 6) return { level: 1, label: 'Too short' };

  let points = 1;
  if (password.length >= 8) points++;
  if (password.length >= 12) points++;
  if (/[0-9]/.test(password)) points++;
  if (/[^a-zA-Z0-9\s]/.test(password)) points++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points++;

  const level = Math.min(points, 4);
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  return { level, label: labels[level - 1] };
}

const BAR_COLORS = [
  'bg-destructive',
  'bg-warning',
  'bg-sky-500',
  'bg-success',
];

export function PasswordStrength({ password }: { password: string }) {
  const { level, label } = scorePassword(password);
  if (!password) return null;

  const activeColor = BAR_COLORS[Math.max(0, level - 1)];

  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex h-1 gap-1" role="presentation">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-200',
              index <= level ? activeColor : 'bg-surface-3'
            )}
          />
        ))}
      </div>
      <p className="text-2xs text-muted-foreground">
        Password strength: <span className="font-medium text-foreground">{label}</span>
      </p>
    </div>
  );
}
