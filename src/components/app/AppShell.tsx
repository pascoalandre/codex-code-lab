import { Link } from "@tanstack/react-router";
import { FolderOpen, House, SquareCode } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { ModeToggle, ThemePicker } from "@/components/ThemePicker";
import { UserMenu } from "@/components/UserMenu";
import { cn } from "@/lib/utils";

export type AppSection = "home" | "editor" | "projects";

const NAV = [
  { id: "home", to: "/", label: "Início", icon: House },
  { id: "editor", to: "/playground", label: "Editor", icon: SquareCode },
  { id: "projects", to: "/projects", label: "Projectos", icon: FolderOpen },
] as const;

/** Phone: bottom navigation bar with a pill behind the active icon. */
export function BottomNav({ active, className }: { active: AppSection; className?: string }) {
  return (
    <nav
      aria-label="Navegação principal"
      className={cn("pb-safe grid shrink-0 grid-cols-3 border-t border-border/40 bg-surface-2 md:hidden", className)}
    >
      {NAV.map((item) => (
        <NavItem key={item.id} {...item} active={active === item.id} />
      ))}
    </nav>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
  vertical = true,
}: {
  to: "/" | "/playground" | "/projects";
  label: string;
  icon: typeof House;
  active: boolean;
  vertical?: boolean;
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn("group flex flex-col items-center justify-center gap-1 text-xs font-semibold", vertical ? "h-20" : "h-[72px] w-full")}
    >
      <span
        className={cn(
          "flex h-8 w-16 items-center justify-center rounded-full transition-colors",
          active ? "bg-primary-container text-on-primary-container" : "text-muted-foreground group-hover:bg-foreground/8",
        )}
      >
        <Icon className={cn("size-[22px]", active && "stroke-[2.4]")} />
      </span>
      <span className={active ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </Link>
  );
}

/** Tablet / desktop: navigation rail on the left. */
export function NavRail({ active, className }: { active: AppSection; className?: string }) {
  return (
    <aside
      className={cn(
        "hidden w-20 shrink-0 flex-col items-center gap-2 border-r border-border/40 bg-surface-1 py-4 md:flex",
        className,
      )}
    >
      <Link to="/" aria-label="C# Codex — início" className="mb-4">
        <LogoMark className="size-11 rounded-2xl text-sm" />
      </Link>
      {NAV.map((item) => (
        <NavItem key={item.id} {...item} active={active === item.id} vertical={false} />
      ))}
      <div className="mt-auto flex flex-col items-center gap-1">
        <ThemePicker />
        <ModeToggle />
        <div className="mt-2">
          <UserMenu compact />
        </div>
      </div>
    </aside>
  );
}

/** Top app bar that picks up a tonal fill once the page scrolls. */
export function TopAppBar({
  leading,
  title,
  actions,
  className,
}: {
  leading?: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 4);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-1 px-2 transition-colors duration-200 md:px-6",
        scrolled ? "bg-surface-2" : "bg-background",
        className,
      )}
    >
      {leading}
      <div className="min-w-0 flex-1 px-2 text-[22px] font-semibold leading-tight tracking-tight">{title}</div>
      {actions && <div className="flex shrink-0 items-center gap-0.5">{actions}</div>}
    </header>
  );
}

export function Fab({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "fixed bottom-[calc(5rem+1rem+env(safe-area-inset-bottom))] right-4 z-30 md:bottom-8 md:right-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const fabClass =
  "inline-flex h-14 items-center gap-3 rounded-2xl bg-primary px-5 text-[15px] font-semibold text-primary-foreground shadow-fab transition active:scale-[0.97] hover:brightness-110 [&_svg]:size-5";

/** Page frame used by the home and projects screens. */
export function AppShell({
  active,
  title,
  leading,
  actions,
  fab,
  children,
}: {
  active: AppSection;
  title: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  fab?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background md:pl-20">
      <NavRail active={active} className="fixed inset-y-0 left-0 z-40" />
      <TopAppBar leading={leading} title={title} actions={actions} />
      <main className="pb-28 md:pb-12">{children}</main>
      {fab && <Fab>{fab}</Fab>}
      <BottomNav active={active} className="fixed inset-x-0 bottom-0 z-40" />
    </div>
  );
}
