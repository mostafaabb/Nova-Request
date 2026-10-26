import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-2/30 px-6 text-center',
        compact ? 'py-8' : 'py-14',
        className
      )}
    >
      <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground">
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <p className="text-[13px] font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
