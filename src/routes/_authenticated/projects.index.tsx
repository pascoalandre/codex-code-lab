import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import {
  BookOpen,
  Copy,
  FileCode2,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  SquareTerminal,
  Star,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import { ModeToggle, ThemePicker } from "@/components/ThemePicker";
import { UserMenu } from "@/components/UserMenu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { displayNameOf, useAuth } from "@/hooks/use-auth";
import { EXAMPLES } from "@/lib/examples";
import {
  BLANK_TEMPLATE,
  createProject,
  deleteProject,
  projectsQuery,
  updateProject,
  type Project,
} from "@/lib/projects";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/projects/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery()),
  head: () => ({
    meta: [
      { title: "Os meus projectos — C# Codex" },
      { name: "description", content: "Todos os seus projectos C# guardados na nuvem." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectsPage,
  pendingComponent: () => (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <Loader2 className="size-5 animate-spin text-primary" />
    </div>
  ),
});

type Filter = "all" | "favorites";

function ProjectsPage() {
  const { data: projects } = useSuspenseQuery(projectsQuery());
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [newOpen, setNewOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Project | null>(null);
  const [toRename, setToRename] = useState<Project | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["projects"] });

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects
      .filter((p) => (filter === "favorites" ? p.is_favorite : true))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
      .sort((a, b) => Number(b.is_favorite) - Number(a.is_favorite));
  }, [projects, query, filter]);

  const toggleFav = async (p: Project) => {
    queryClient.setQueryData(projectsQuery().queryKey, (old) =>
      old?.map((x) => (x.id === p.id ? { ...x, is_favorite: !p.is_favorite } : x)),
    );
    try {
      await updateProject(p.id, { is_favorite: !p.is_favorite });
    } finally {
      refresh();
    }
  };

  const duplicate = async (p: Project) => {
    try {
      await createProject({ name: `${p.name} (cópia)`, code: p.code, stdin: p.stdin, description: p.description ?? undefined });
      toast.success("Projecto duplicado");
      refresh();
    } catch {
      toast.error("Não foi possível duplicar.");
    }
  };

  const totalLines = projects.reduce((n, p) => n + p.code.split("\n").length, 0);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Logo />
          <nav className="ml-4 hidden items-center gap-1 text-sm md:flex">
            <span className="rounded px-2.5 py-1.5 font-medium text-foreground">Projectos</span>
            <Link to="/playground" className="rounded px-2.5 py-1.5 text-muted-foreground hover:text-foreground">
              Playground
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <ThemePicker />
            <ModeToggle />
            <div className="ml-1">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label-mono text-primary">// olá, {displayNameOf(user).split(" ")[0]}</p>
            <h1 className="mt-2 text-3xl font-semibold text-balance-tight sm:text-4xl">Os seus projectos</h1>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {projects.length} projecto(s) · {totalLines.toLocaleString("pt-PT")} linhas de C#
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="subtle">
              <Link to="/playground">
                <SquareTerminal /> Playground
              </Link>
            </Button>
            <Button variant="hero" onClick={() => setNewOpen(true)}>
              <Plus /> Novo projecto
            </Button>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Procurar por nome ou código…"
              className="h-10 pl-9"
            />
          </div>
          <div className="inline-flex rounded-md border border-border p-0.5">
            {(
              [
                ["all", "Todos"],
                ["favorites", "Favoritos"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                data-active={filter === id}
                className="rounded px-3 py-1.5 text-sm text-muted-foreground transition data-[active=true]:bg-accent data-[active=true]:text-foreground"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {projects.length === 0 ? (
          <EmptyState onNew={() => setNewOpen(true)} />
        ) : list.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">Nenhum projecto corresponde à pesquisa.</p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p, i) => (
              <li key={p.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <ProjectCard
                  project={p}
                  onFav={() => toggleFav(p)}
                  onRename={() => setToRename(p)}
                  onDuplicate={() => duplicate(p)}
                  onDelete={() => setToDelete(p)}
                />
              </li>
            ))}
          </ul>
        )}
      </main>

      <NewProjectDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(id) => navigate({ to: "/projects/$projectId", params: { projectId: id } })}
      />

      <RenameDialog
        project={toRename}
        onClose={() => setToRename(null)}
        onDone={() => {
          setToRename(null);
          refresh();
        }}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar “{toDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>Esta acção é permanente. O código deste projecto será apagado da nuvem.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!toDelete) return;
                try {
                  await deleteProject(toDelete.id);
                  toast.success("Projecto eliminado");
                  refresh();
                } catch {
                  toast.error("Não foi possível eliminar.");
                }
                setToDelete(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProjectCard({
  project: p,
  onFav,
  onRename,
  onDuplicate,
  onDelete,
}: {
  project: Project;
  onFav: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const preview = p.code
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("using"))
    .slice(0, 6)
    .join("\n");
  const lines = p.code.split("\n").length;

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/50">
      <Link to="/projects/$projectId" params={{ projectId: p.id }} className="absolute inset-0 z-0" aria-label={`Abrir ${p.name}`} />
      <div className="pointer-events-none relative h-32 overflow-hidden border-b border-border bg-editor px-4 py-3">
        <pre className="font-mono text-[11px] leading-[1.6] text-syn-punct/80">{preview}</pre>
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-editor to-transparent" />
      </div>
      <div className="relative flex flex-1 items-start gap-3 p-4">
        <FileCode2 className="mt-0.5 size-4 shrink-0 text-syn-keyword" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold tracking-tight">{p.name}</p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {lines} linhas · {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true, locale: pt })}
          </p>
        </div>
        <div className="relative z-10 flex items-center">
          <button
            onClick={onFav}
            aria-label={p.is_favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            className="rounded p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <Star className={cn("size-4", p.is_favorite && "fill-warning text-warning")} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="Opções" className="rounded p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground">
                <MoreVertical className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onRename}>
                <Pencil /> Mudar o nome
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onDuplicate}>
                <Copy /> Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="mt-8 flex flex-col items-center rounded-xl border border-dashed border-border bg-panel px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-card font-mono text-sm font-bold text-primary">
        {"{ }"}
      </div>
      <h2 className="mt-5 text-lg font-semibold tracking-tight">Ainda não tem projectos</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Crie um projecto em branco ou comece a partir de um dos {EXAMPLES.length} exemplos prontos.
      </p>
      <Button variant="hero" className="mt-6" onClick={onNew}>
        <Plus /> Criar o primeiro projecto
      </Button>
    </div>
  );
}

function NewProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<string>("blank");
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const ex = EXAMPLES.find((x) => x.id === template);
      const p = await createProject({
        name: name.trim() || ex?.title || "Novo projecto",
        code: ex?.code ?? BLANK_TEMPLATE,
        stdin: ex?.stdin ?? "",
      });
      onOpenChange(false);
      setName("");
      setTemplate("blank");
      onCreated(p.id);
    } catch (err) {
      toast.error("Não foi possível criar o projecto", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88dvh] w-[calc(100vw-1.5rem)] max-w-lg flex-col">
        <DialogHeader className="text-left">
          <DialogTitle className="tracking-tight">Novo projecto</DialogTitle>
          <DialogDescription>Dê-lhe um nome e escolha como começar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={create} className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="pname">Nome</Label>
            <Input id="pname" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Trabalho de Matrizes" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col space-y-1.5">
            <Label>Começar com</Label>
            <div className="grid min-h-0 flex-1 gap-1.5 overflow-y-auto pr-1 scrollbar-thin">
              <TemplateOption id="blank" title="Programa em branco" subtitle="Estrutura básica com Main" selected={template} onSelect={setTemplate} icon={<Plus className="size-4" />} />
              {EXAMPLES.map((ex) => (
                <TemplateOption
                  key={ex.id}
                  id={ex.id}
                  title={ex.title}
                  subtitle={ex.category}
                  selected={template}
                  onSelect={setTemplate}
                  icon={<BookOpen className="size-4" />}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" variant="hero" disabled={busy} className="w-full sm:w-auto">
              {busy && <Loader2 className="animate-spin" />} Criar e abrir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TemplateOption({
  id,
  title,
  subtitle,
  selected,
  onSelect,
  icon,
}: {
  id: string;
  title: string;
  subtitle: string;
  selected: string;
  onSelect: (id: string) => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      data-active={selected === id}
      className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-left transition hover:bg-accent/60 data-[active=true]:border-primary data-[active=true]:bg-primary/10"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </button>
  );
}

function RenameDialog({ project, onClose, onDone }: { project: Project | null; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={!!project} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="tracking-tight">Mudar o nome</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!project) return;
            const name = String(new FormData(e.currentTarget).get("name") ?? "").trim();
            if (!name) return;
            setBusy(true);
            try {
              await updateProject(project.id, { name });
              onDone();
            } catch {
              toast.error("Não foi possível mudar o nome.");
            } finally {
              setBusy(false);
            }
          }}
          className="space-y-4"
        >
          <Input name="name" defaultValue={project?.name} autoFocus />
          <DialogFooter>
            <Button type="submit" variant="hero" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
