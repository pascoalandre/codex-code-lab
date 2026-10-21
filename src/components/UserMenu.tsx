import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { FolderGit2, LogIn, LogOut, SquareTerminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { displayNameOf, useAuth } from "@/hooks/use-auth";

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (loading) return <div className="size-8 animate-pulse rounded-full bg-accent" />;

  if (!user) {
    return (
      <Button asChild variant="subtle" size="sm">
        <Link to="/auth">
          <LogIn />
          {!compact && "Entrar"}
        </Link>
      </Button>
    );
  }

  const name = displayNameOf(user);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex size-8 items-center justify-center rounded-full bg-accent font-mono text-xs font-semibold text-accent-foreground ring-1 ring-border transition hover:ring-primary"
          aria-label="Menu da conta"
        >
          {initials || "C#"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="truncate text-sm font-medium">{name}</div>
          <div className="truncate text-xs text-muted-foreground">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/projects">
            <FolderGit2 /> Os meus projectos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/playground">
            <SquareTerminal /> Playground
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            await queryClient.cancelQueries();
            queryClient.clear();
            await signOut();
            navigate({ to: "/", replace: true });
          }}
        >
          <LogOut /> Terminar sessão
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
