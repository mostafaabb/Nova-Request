export function AuthDivider() {
  return (
    <div className="relative py-2" aria-hidden>
      <div className="absolute inset-0 flex items-center">
        <span className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
      <div className="relative flex justify-center">
        <span className="rounded-full border border-border/50 bg-background px-5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground shadow-sm">
          Or email
        </span>
      </div>
    </div>
  );
}
