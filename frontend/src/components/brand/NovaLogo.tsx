import Link from 'next/link';
import { cn } from '@/lib/utils';

export function NovaMark({ className, size = 30 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-[9px] border border-primary/25 bg-primary/[0.09] text-primary',
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        width={Math.round(size * 0.62)}
        height={Math.round(size * 0.62)}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M6 18V6l12 12V6"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="18.4" cy="5.6" r="2.1" fill="currentColor" />
      </svg>
    </span>
  );
}

export function NovaLogo({
  href = '/dashboard',
  className,
  compact = false,
}: {
  href?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex min-w-0 items-center gap-2.5 rounded-md text-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
      aria-label="Nova Request home"
    >
      <NovaMark size={30} className="transition-colors group-hover:border-primary/40" />
      {!compact ? (
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className="text-[15px] font-semibold tracking-[-0.02em]">Nova</span>
          <span className="text-[13px] font-medium tracking-[-0.01em] text-muted-foreground">
            Request
          </span>
        </span>
      ) : null}
    </Link>
  );
}
