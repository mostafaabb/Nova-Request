import Link from 'next/link';
import {
  Zap,
  FolderKanban,
  Globe,
  ShieldCheck,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DEL'] as const;

const HIGHLIGHTS = [
  {
    icon: FolderKanban,
    title: 'Collections & flows',
    desc: 'Group endpoints, docs, and runs the way real teams ship APIs.',
  },
  {
    icon: Globe,
    title: 'Environment-aware',
    desc: 'Same requests across dev, staging, and prod — swap variables in one click.',
  },
  {
    icon: ShieldCheck,
    title: 'Workspace-grade isolation',
    desc: 'Proxy execution and membership boundaries built for shared accounts.',
  },
];

interface AuthPageLayoutProps {
  eyebrow?: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  mobileTagline?: string;
}

export function AuthPageLayout({
  eyebrow = 'Nova Request',
  title,
  description,
  children,
  footer,
  mobileTagline = 'API testing that feels like a serious dev tool — not a toy.',
}: AuthPageLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background lg:flex-row">
      {/* Ambient (form side) */}
      <div
        className="pointer-events-none absolute inset-0 lg:left-[42%]"
        aria-hidden
      >
        <div className="absolute -right-24 top-[-10%] h-[min(520px,55vw)] w-[min(520px,55vw)] rounded-full bg-primary/[0.09] blur-[100px] dark:bg-primary/[0.14]" />
        <div className="absolute bottom-[-20%] left-[10%] h-[380px] w-[380px] rounded-full bg-[hsl(var(--muted))] opacity-40 blur-[90px] dark:opacity-25" />
      </div>

      {/* Brand column */}
      <aside
        className={cn(
          'relative order-2 flex shrink-0 flex-col justify-between',
          'border-t border-white/[0.08] bg-[#070d18] px-6 py-10 text-slate-100 lg:order-1 lg:w-[min(44%,500px)]',
          'lg:border-r lg:border-t-0 lg:border-white/[0.06] lg:px-10 lg:py-14 xl:px-12'
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage:
              'linear-gradient(135deg, rgba(34,211,238,0.09) 0%, transparent 42%), radial-gradient(circle at 18% 88%, rgba(56,189,248,0.12), transparent 35%)',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          aria-hidden
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.35) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-[1] space-y-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-3 text-white transition-opacity hover:opacity-95"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 text-[#042018] shadow-lg shadow-cyan-500/25 ring-1 ring-white/15 transition-transform duration-300 group-hover:scale-[1.03]">
              <Zap className="h-5 w-5 fill-current" aria-hidden />
            </span>
            <span className="text-lg font-semibold tracking-tight">Nova Request</span>
          </Link>

          <div className="space-y-4 lg:space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100/90 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-cyan-300" aria-hidden />
              Workspace-ready
            </div>
            <p className="max-w-[320px] text-[15px] leading-relaxed text-slate-400 lg:text-[16px]">
              {mobileTagline}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:hidden">
            {METHODS.map((m) => (
              <span
                key={m}
                className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-cyan-200/90"
              >
                {m}
              </span>
            ))}
          </div>

          <ul className="hidden space-y-8 lg:block">
            {HIGHLIGHTS.map(({ icon: Icon, title: t, desc }) => (
              <li key={t} className="group/item flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] shadow-inner backdrop-blur-sm transition-colors group-hover/item:border-cyan-400/25 group-hover/item:bg-white/[0.09]">
                  <Icon className="h-[19px] w-[19px] text-cyan-300" aria-hidden />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white">
                    {t}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-all duration-200 group-hover/item:translate-x-0.5 group-hover/item:opacity-70" />
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-[1] mt-10 hidden items-start gap-3 border-t border-white/[0.07] pt-8 text-[12px] leading-relaxed text-slate-500 lg:flex">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
          <p>
            Traffic is encrypted in transit. Tokens expire; sign out anytime to end your session on this
            device.
          </p>
        </div>
      </aside>

      {/* Form column */}
      <main className="relative order-1 flex flex-1 flex-col justify-center px-4 py-12 sm:px-10 lg:order-2 lg:px-16 lg:py-12 xl:px-24">
        <div className="relative mx-auto w-full max-w-[460px]">
          <div className="mb-10 flex justify-center lg:justify-start lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-semibold tracking-tight text-foreground"
            >
              <span className="rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 p-2 text-white shadow-md shadow-primary/20">
                <Zap className="h-4 w-4 fill-current" aria-hidden />
              </span>
              Nova Request
            </Link>
          </div>

          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-[1px] rounded-[1.35rem] bg-gradient-to-br from-primary/35 via-border/40 to-primary/[0.18] opacity-90 dark:from-primary/25 dark:via-border/30 dark:to-primary/15"
              aria-hidden
            />
            <div className="relative rounded-[1.3rem] border border-border/50 bg-background/90 shadow-[0_28px_90px_-34px_rgba(15,23,42,0.35)] backdrop-blur-2xl dark:border-border/40 dark:bg-background/85 dark:shadow-[0_28px_90px_-34px_rgba(0,0,0,0.65)]">
              <div className="rounded-[1.25rem] bg-gradient-to-b from-background via-background to-muted/[0.35] px-8 py-9 dark:to-muted/[0.12] sm:px-10 sm:py-11">
                <div className="mb-9 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/90">
                    {eyebrow}
                  </p>
                  <h1 className="text-balance text-[1.85rem] font-bold leading-[1.15] tracking-tight text-foreground sm:text-[2rem]">
                    {title}
                  </h1>
                  <p className="text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-[15.5px]">
                    {description}
                  </p>
                </div>

                {children}
              </div>
            </div>
          </div>

          <div className="mt-9 text-center text-[14px] leading-relaxed text-muted-foreground lg:text-left">
            {footer}
          </div>
        </div>
      </main>
    </div>
  );
}
