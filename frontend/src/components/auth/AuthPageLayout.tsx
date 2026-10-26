import Link from 'next/link';
import { ArrowRight, FolderKanban, Globe2, History, Sparkles } from 'lucide-react';
import { NovaLogo } from '@/components/brand/NovaLogo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Badge } from '@/components/ui/Badge';

interface AuthPageLayoutProps {
  eyebrow?: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  mobileTagline?: string;
}

function WorkspacePreview() {
  return (
    <div className="w-full max-w-[470px]">
      <div className="mb-4 flex items-center gap-2 text-2xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
        Inside the workspace
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-panel">
        <div className="flex h-10 items-center justify-between border-b border-border px-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-destructive/70" aria-hidden />
            <span className="h-2 w-2 rounded-full bg-warning/70" aria-hidden />
            <span className="h-2 w-2 rounded-full bg-success/70" aria-hidden />
          </div>
          <span className="text-2xs font-medium text-muted-foreground">Request builder</span>
          <Badge variant="primary" className="h-5">
            Staging
          </Badge>
        </div>

        <div className="p-3.5">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2/70 p-1.5">
            <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 font-mono text-3xs font-semibold text-emerald-400">
              GET
            </span>
            <code className="min-w-0 flex-1 truncate px-1 font-mono text-[11px] text-foreground/85">
              https://api.nova.dev/v1/users
            </code>
            <span className="rounded-md bg-primary px-2.5 py-1 text-3xs font-semibold text-primary-foreground">
              Send
            </span>
          </div>

          <div className="mt-3 flex items-center gap-4 border-b border-border px-1 text-2xs">
            <span className="border-b border-primary pb-1.5 font-medium text-foreground">Params</span>
            <span className="pb-1.5 text-muted-foreground">Headers</span>
            <span className="pb-1.5 text-muted-foreground">Body</span>
            <span className="pb-1.5 text-muted-foreground">Auth</span>
          </div>

          <div className="mt-3 overflow-hidden rounded-lg border border-border bg-[hsl(var(--code-bg))]">
            <div className="flex items-center gap-3 border-b border-border px-3 py-2">
              <span className="rounded border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-3xs font-semibold text-emerald-400">
                200 OK
              </span>
              <span className="font-mono text-3xs text-muted-foreground">124 ms</span>
              <span className="ml-auto font-mono text-3xs text-muted-foreground">JSON</span>
            </div>
            <pre className="overflow-hidden px-3 py-2.5 font-mono text-[10.5px] leading-[1.65] text-muted-foreground">
              <span className="text-muted-foreground">{'{'}</span>
              {'\n  '}
              <span className="text-[hsl(var(--json-key))]">&quot;data&quot;</span>
              <span className="text-muted-foreground">: [</span>
              {'\n    '}
              <span className="text-muted-foreground">{'{'}</span>
              {'\n      '}
              <span className="text-[hsl(var(--json-key))]">&quot;id&quot;</span>
              <span className="text-muted-foreground">: </span>
              <span className="text-[hsl(var(--json-string))]">&quot;usr_8f2&quot;</span>
              <span className="text-muted-foreground">,</span>
              {'\n      '}
              <span className="text-[hsl(var(--json-key))]">&quot;name&quot;</span>
              <span className="text-muted-foreground">: </span>
              <span className="text-[hsl(var(--json-string))]">&quot;Alex Morgan&quot;</span>
              {'\n    '}
              <span className="text-muted-foreground">{'}'}</span>
              {'\n  '}
              <span className="text-muted-foreground">]</span>
              {'\n'}
              <span className="text-muted-foreground">{'}'}</span>
            </pre>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { icon: FolderKanban, label: 'Collections' },
          { icon: Globe2, label: 'Environments' },
          { icon: History, label: 'History' },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface/60 px-2.5 py-2"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate text-2xs font-medium text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 flex items-start gap-2 text-2xs leading-relaxed text-muted-foreground">
        <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" aria-hidden />
        A focused surface for requests, environments, and response inspection. Your data stays tied
        to your account and workspace.
      </p>
    </div>
  );
}

export function AuthPageLayout({
  eyebrow = 'Nova Request',
  title,
  description,
  children,
  footer,
}: AuthPageLayoutProps) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="app-grid-background absolute inset-0 opacity-40" />
        <div className="absolute -left-24 top-[-18rem] h-[34rem] w-[34rem] rounded-full bg-primary/[0.055] blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-dvh w-full max-w-[1180px] lg:grid-cols-[minmax(0,470px)_minmax(0,1fr)]">
        <main className="flex min-h-dvh flex-col px-4 py-5 sm:px-8 lg:px-6 lg:py-6">
          <div className="flex items-center justify-between">
            <NovaLogo href="/dashboard" />
            <ThemeToggle />
          </div>

          <div className="flex flex-1 items-center py-8 sm:py-10">
            <div className="mx-auto w-full max-w-[392px]">
              <div className="mb-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-2xs font-medium uppercase tracking-[0.16em] text-primary">
                    {eyebrow}
                  </span>
                  <span className="h-px flex-1 bg-border" aria-hidden />
                </div>
                <h1 className="text-balance text-[26px] font-semibold leading-[1.2] tracking-[-0.03em] text-foreground sm:text-[28px]">
                  {title}
                </h1>
                <p className="mt-2 text-pretty text-[13px] leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface/85 p-4 shadow-panel sm:p-5">
                {children}
              </div>

              <div className="mt-5 text-center text-[13px] text-muted-foreground">{footer}</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-2xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Nova Request</span>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              API workspace
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        </main>

        <aside className="hidden min-h-dvh items-center justify-center border-l border-border bg-surface-2/15 p-8 lg:flex xl:p-12">
          <WorkspacePreview />
        </aside>
      </div>
    </div>
  );
}
