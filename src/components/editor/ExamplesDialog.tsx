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
      <DialogContent className="flex max-h-[88dvh] w-[calc(100vw-1.5rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border p-5 pb-4 text-left">
          <p className="label-mono text-primary">Biblioteca</p>
          <DialogTitle className="text-xl tracking-tight">Exemplos prontos a executar</DialogTitle>
          <DialogDescription>
            {EXAMPLES.length} programas comentados — de "Olá, Mundo" a sistemas lineares e matrizes inversas.
          </DialogDescription>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Procurar exemplo…"
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
            />
          </div>
          <div className="-mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5 pb-1 scrollbar-thin">
            {(["Todos", ...CATEGORIES] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                data-active={category === c}
                className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
              >
                {c}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 auto-rows-min gap-3 overflow-y-auto p-5 scrollbar-thin sm:grid-cols-2">
          {list.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onPick(ex)}
              className="group flex flex-col rounded-lg border border-border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/60"
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
