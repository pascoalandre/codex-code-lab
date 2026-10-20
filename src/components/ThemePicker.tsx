import { Check, Moon, Palette, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/use-theme";
import { FAMILIES, THEMES } from "@/lib/themes";

export function Swatch({ colors }: { colors: readonly string[] }) {
  return (
    <span className="inline-flex h-4 w-7 overflow-hidden rounded-[3px] ring-1 ring-border">
      {colors.map((c, i) => (
        // Preview chips show each theme's own palette, so inline colors are intended.
        <span key={i} className="h-full flex-1" style={{ backgroundColor: c }} />
      ))}
    </span>
  );
}

export function ModeToggle({ size = "icon-sm" }: { size?: "icon-sm" | "icon-xs" }) {
  const { theme, toggleMode } = useTheme();
  const dark = theme.mode === "dark";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="toolbar" size={size} onClick={toggleMode} aria-label={dark ? "Modo claro" : "Modo escuro"}>
          {dark ? <Sun /> : <Moon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{dark ? "Mudar para modo claro" : "Mudar para modo escuro"}</TooltipContent>
    </Tooltip>
  );
}

export function ThemePicker({ size = "icon-sm" }: { size?: "icon-sm" | "icon-xs" }) {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="toolbar" size={size} aria-label="Escolher tema">
              <Palette />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Tema</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-60">
        {FAMILIES.map((f, idx) => (
          <div key={f.id}>
            {idx > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="label-mono text-muted-foreground">{f.label}</DropdownMenuLabel>
            {THEMES.filter((t) => t.family === f.id).map((t) => (
              <DropdownMenuItem key={t.id} onSelect={() => setTheme(t.id)} className="gap-3">
                <Swatch colors={t.swatch} />
                <span className="flex-1">{t.label}</span>
                {t.mode === "dark" ? (
                  <Moon className="size-3.5 text-muted-foreground" />
                ) : (
                  <Sun className="size-3.5 text-muted-foreground" />
                )}
                {theme.id === t.id && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
