import Link from 'next/link';
import { Zap, FolderKanban, Globe, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const HIGHLIGHTS = [
  {
    icon: FolderKanban,
    title: 'Collections & requests',
    desc: 'Organize endpoints like a pro workspace.',
  },
  {
    icon: Globe,
    title: 'Environments',
    desc: 'Switch variables per stage in one click.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure proxy',
    desc: 'Run requests through a controlled backend.',
  },
];

interface AuthPageLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  /** Shown above the card on small screens */
  mobileTagline?: string;
}

export function AuthPageLayout({
  title,
  description,
  children,
  footer,
  mobileTagline = 'API testing for teams that ship',
}: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      <aside
        className={cn(
          'relative order-2 lg:order-1 lg:w-[min(44%,520px)] shrink-0',
          'border-t lg:border-t-0 lg:border-r border-border/80',
          'bg-gradient-to-br from-primary/[0.12] via-background to-background',
          'dark:from-primary/[0.18] dark:via-background dark:to-background'
        )}
      >
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative flex flex-col justify-between min-h-[200px] lg:min-h-screen p-8 lg:p-12 xl:p-14">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-extrabold text-lg tracking-tight text-foreground hover:text-primary transition-colors group"
            >
              <span className="p-2 rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/25 group-hover:rotate-6 transition-transform">
                <Zap className="h-5 w-5 fill-current" />
              </span>
              Nova Request
            </Link>
            <p className="mt-6 text-sm font-medium text-muted-foreground max-w-[280px] leading-relaxed">
              {mobileTagline}
            </p>
          </div>

          <ul className="hidden lg:block space-y-6 mt-12">
            {HIGHLIGHTS.map(({ icon: Icon, title: t, desc }) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background/60 shadow-sm">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">{t}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="hidden lg:block text-[11px] text-muted-foreground/80 mt-12 uppercase tracking-widest font-semibold">
            Built for REST workflows
          </p>
        </div>
      </aside>

      <main className="order-1 lg:order-2 flex-1 flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-[440px]">
          <div className="lg:hidden mb-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-extrabold text-base tracking-tight text-foreground"
            >
              <span className="p-1.5 rounded-md bg-primary text-primary-foreground">
                <Zap className="h-4 w-4 fill-current" />
              </span>
              Nova Request
            </Link>
          </div>

          <div
            className={cn(
              'rounded-2xl border border-border/80 bg-background/90 backdrop-blur-xl',
              'shadow-[0_24px_80px_-24px_hsl(var(--foreground)/0.12)]',
              'dark:shadow-[0_24px_80px_-24px_hsl(0_0%_0%/0.45)]',
              'p-8 sm:p-10'
            )}
          >
            <div className="space-y-1 mb-8">
              <h1 className="text-2xl sm:text-[1.65rem] font-black tracking-tight text-foreground">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>

            {children}
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>
        </div>
      </main>
    </div>
  );
}
