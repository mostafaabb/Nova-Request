import Link from 'next/link';
import { Zap, FolderKanban, Globe, ShieldCheck, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const HIGHLIGHTS = [
  {
    icon: FolderKanban,
    title: 'Collections & requests',
    desc: 'Structure endpoints, folders, and flows the way your team works.',
  },
  {
    icon: Globe,
    title: 'Environments',
    desc: 'Promote the same requests across dev, staging, and production.',
  },
  {
    icon: ShieldCheck,
    title: 'Controlled execution',
    desc: 'Run traffic through your backend proxy with workspace isolation.',
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
          'relative order-2 lg:order-1 lg:w-[min(46%,540px)] shrink-0',
          'border-t lg:border-t-0 lg:border-r border-border/70',
          'bg-gradient-to-b lg:bg-gradient-to-br',
          'from-muted/50 via-background to-background',
          'dark:from-muted/15 dark:via-background dark:to-background'
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4] dark:opacity-[0.25]"
          aria-hidden
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[min(90vw,420px)] -translate-x-1/2 rounded-full bg-primary/[0.14] blur-3xl dark:bg-primary/[0.18] lg:left-12 lg:translate-x-0"
          aria-hidden
        />
        <div className="relative flex min-h-[220px] flex-col justify-between p-8 lg:min-h-screen lg:p-12 xl:p-14">
          <div>
            <Link
              href="/"
              className="group inline-flex items-center gap-3 font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
            >
              <span className="rounded-xl bg-primary p-2.5 text-primary-foreground shadow-md shadow-primary/20 ring-1 ring-primary/10 transition-transform group-hover:scale-[1.02]">
                <Zap className="h-5 w-5 fill-current" />
              </span>
              <span className="text-lg">Nova Request</span>
            </Link>
            <p className="mt-7 max-w-[300px] text-[15px] leading-relaxed text-muted-foreground">
              {mobileTagline}
            </p>
          </div>

          <ul className="mt-12 hidden space-y-7 lg:block">
            {HIGHLIGHTS.map(({ icon: Icon, title: t, desc }) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background/80 shadow-sm backdrop-blur-sm">
                  <Icon className="h-[18px] w-[18px] text-primary" />
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-foreground">{t}</p>
                  <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-12 hidden items-start gap-3 text-[12px] leading-snug text-muted-foreground lg:flex">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/90" aria-hidden />
            <p>
              Encrypted traffic in transit. Sessions end when you sign out or when your token expires.
            </p>
          </div>
        </div>
      </aside>

      <main className="order-1 flex flex-1 flex-col justify-center px-4 py-12 sm:px-8 lg:order-2 lg:px-14 lg:py-10">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="mb-8 text-center lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-semibold tracking-tight text-foreground"
            >
              <span className="rounded-lg bg-primary p-2 text-primary-foreground shadow-sm">
                <Zap className="h-4 w-4 fill-current" />
              </span>
              <span>Nova Request</span>
            </Link>
          </div>

          <div
            className={cn(
              'rounded-2xl border border-border/80 bg-background/95 shadow-xl shadow-foreground/[0.04]',
              'ring-1 ring-border/40 backdrop-blur-xl',
              'dark:bg-background/90 dark:shadow-black/40 dark:ring-border/50',
              'px-8 py-9 sm:px-10 sm:py-10'
            )}
          >
            <div className="mb-8 space-y-2">
              <h1 className="text-[1.625rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[1.75rem]">
                {title}
              </h1>
              <p className="text-[15px] leading-relaxed text-muted-foreground">{description}</p>
            </div>

            {children}
          </div>

          <div className="mt-8 text-center text-[14px] text-muted-foreground leading-relaxed">{footer}</div>
        </div>
      </main>
    </div>
  );
}
