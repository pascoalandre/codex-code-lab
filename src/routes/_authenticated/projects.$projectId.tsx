import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Check, CloudOff, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Workspace } from "@/components/editor/Workspace";
import { projectQuery, updateProject } from "@/lib/projects";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  loader: async ({ context, params }) => {
    const project = await context.queryClient.ensureQueryData(projectQuery(params.projectId));
    if (!project) throw notFound();
    return { name: project.name };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Projecto"} — C# Codex` },
      { name: "description", content: "Edite, compile e execute o seu projecto C# no C# Codex." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectEditor,
  notFoundComponent: () => (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background p-6 text-center">
      <p className="label-mono text-destructive">CS0246</p>
      <h1 className="text-xl font-semibold">Projecto não encontrado</h1>
      <Link to="/projects" className="text-sm text-primary underline underline-offset-4">
        Voltar aos projectos
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background p-6 text-center">
      <h1 className="text-xl font-semibold">Não foi possível abrir o projecto</h1>
      <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : "Erro desconhecido"}</p>
      <Link to="/projects" className="text-sm text-primary underline underline-offset-4">
        Voltar aos projectos
      </Link>
    </div>
  ),
});

type SaveState = "saved" | "dirty" | "saving" | "error";

function ProjectEditor() {
  const { projectId } = Route.useParams();
  const { data: project } = useSuspenseQuery(projectQuery(projectId));
  const queryClient = useQueryClient();

  const [name, setName] = useState(project?.name ?? "");
  const [code, setCode] = useState(project?.code ?? "");
  const [stdin, setStdin] = useState(project?.stdin ?? "");
  const [state, setState] = useState<SaveState>("saved");

  const latest = useRef({ code, stdin });
  latest.current = { code, stdin };
  const savedRef = useRef({ code: project?.code ?? "", stdin: project?.stdin ?? "" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    const snapshot = { ...latest.current };
    if (snapshot.code === savedRef.current.code && snapshot.stdin === savedRef.current.stdin) {
      setState("saved");
      return;
    }
    setState("saving");
    try {
      const updated = await updateProject(projectId, snapshot);
      savedRef.current = snapshot;
      queryClient.setQueryData(projectQuery(projectId).queryKey, updated);
      queryClient.invalidateQueries({ queryKey: ["projects"], exact: true });
      const stillSame =
        latest.current.code === snapshot.code && latest.current.stdin === snapshot.stdin;
      setState(stillSame ? "saved" : "dirty");
    } catch (e) {
      setState("error");
      toast.error("Falha ao guardar", { description: e instanceof Error ? e.message : undefined });
    }
  }, [projectId, queryClient]);

  // Autosave 1.2s after the last keystroke.
  useEffect(() => {
    if (code === savedRef.current.code && stdin === savedRef.current.stdin) return;
    setState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 1200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [code, stdin, save]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state === "dirty" || state === "saving") e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [state]);

  const rename = async (newName: string) => {
    const prev = name;
    setName(newName);
    try {
      await updateProject(projectId, { name: newName });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch {
      setName(prev);
      toast.error("Não foi possível mudar o nome.");
    }
  };

  const status =
    state === "saving" ? (
      <span className="inline-flex items-center gap-1">
        <Loader2 className="size-3 animate-spin" /> A guardar…
      </span>
    ) : state === "dirty" ? (
      "Alterações por guardar"
    ) : state === "error" ? (
      <span className="inline-flex items-center gap-1 text-destructive">
        <CloudOff className="size-3" /> Erro ao guardar
      </span>
    ) : (
      <span className="inline-flex items-center gap-1">
        <Check className="size-3 text-success" /> Guardado na nuvem
      </span>
    );

  return (
    <Workspace
      fileName={name}
      onRename={rename}
      code={code}
      onCodeChange={setCode}
      onSave={() => {
        save();
      }}
      saveStatus={status}
      dirty={state === "dirty" || state === "error"}
      backTo="/projects"
    />
  );
}
