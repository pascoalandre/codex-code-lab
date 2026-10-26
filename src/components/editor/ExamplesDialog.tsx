import { ArrowRight, Keyboard, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CATEGORIES, EXAMPLES, type Example, type ExampleCategory } from "@/lib/examples";
import { cn } from "@/lib/utils";

const LEVEL_TONE: Record<Example["level"], string> = {
  Iniciante: "text-success",
  Intermédio: "text-info",
  Avançado: "text-syn-keyword",
};

export function ExamplesDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (ex: Example) => void;
}) {
  const [category, setCategory] = useState<ExampleCategory | "Todos">("Todos");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXAMPLES.filter(
      (e) =>
        (category === "Todos" || e.category === category) &&
        (!q || e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)),
    );
  }, [category, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 max-sm:top-auto max-sm:bottom-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:data-[state=open]:slide-in-from-bottom-10">
        <div className="mx-auto mt-3 h-1 w-8 rounded-full bg-muted-foreground/40 sm:hidden" />
        <DialogHeader className="p-5 pb-3 text-left">
          <DialogTitle className="text-[22px] font-semibold tracking-tight">Exemplos prontos</DialogTitle>
          <DialogDescription>
            {EXAMPLES.length} programas comentados — de "Olá, Mundo" a sistemas lineares e matrizes inversas.
          </DialogDescription>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Procurar exemplo…"
              className="h-12 w-full rounded-full bg-surface-2 pl-11 pr-4 text-[15px] outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
            {(["Todos", ...CATEGORIES] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                data-active={category === c}
                className="h-8 shrink-0 rounded-lg border border-border px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground data-[active=true]:border-transparent data-[active=true]:bg-primary-container data-[active=true]:text-on-primary-container"
              >
                {c}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 auto-rows-min gap-2 overflow-y-auto px-3 pb-5 pt-1 scrollbar-thin sm:grid-cols-2 sm:px-5">
          {list.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onPick(ex)}
              className="group flex flex-col rounded-[20px] bg-surface-1 p-4 text-left transition hover:bg-surface-2 active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <span className="label-mono text-muted-foreground">{ex.category}</span>
                <span className={cn("label-mono ml-auto", LEVEL_TONE[ex.level])}>{ex.level}</span>
              </div>
              <p className="mt-2 font-semibold tracking-tight text-foreground">{ex.title}</p>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">{ex.description}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                {ex.stdin && (
                  <span className="inline-flex items-center gap-1">
                    <Keyboard className="size-3.5" /> com entrada de dados
                  </span>
                )}
                <span className="ml-auto inline-flex items-center gap-1 text-primary opacity-0 transition group-hover:opacity-100">
                  Abrir <ArrowRight className="size-3.5" />
                </span>
              </div>
            </button>
          ))}
          {!list.length && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">Nenhum exemplo encontrado.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
