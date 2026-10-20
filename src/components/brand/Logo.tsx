import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-primary font-mono text-[13px] font-bold tracking-tighter text-primary-foreground",
        className,
      )}
      aria-hidden
    >
      C#
      <span className="absolute -right-0.5 -bottom-0.5 size-2 rounded-[2px] border-2 border-background bg-foreground" />
    </span>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link to="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="C# Codex — início">
      <LogoMark />
      {!compact && (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          C# <span className="text-muted-foreground transition-colors group-hover:text-foreground">Codex</span>
        </span>
      )}
    </Link>
  );
}
