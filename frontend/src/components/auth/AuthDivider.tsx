export function AuthDivider() {
  return (
    <div className="relative py-1" aria-hidden>
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border/60" />
      </div>
      <div className="relative flex justify-center text-[13px]">
        <span className="bg-background px-4 text-muted-foreground font-medium">
          Or continue with email
        </span>
      </div>
    </div>
  );
}
