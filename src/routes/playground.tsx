import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CloudUpload, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Workspace } from "@/components/editor/Workspace";
import { useAuth } from "@/hooks/use-auth";
import { DEFAULT_CODE, getExample } from "@/lib/examples";
import { createProject } from "@/lib/projects";

const STORAGE_KEY = "codex-playground";

export const Route = createFileRoute("/playground")({
  validateSearch: z.object({ example: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Playground C# — compile e execute online | C# Codex" },
      {
        name: "description",
        content: "Editor de C# com realce de sintaxe, entrada de dados, exemplos prontos e execução instantânea.",
      },
      { property: "og:title", content: "Playground C# — C# Codex" },
      { property: "og:description", content: "Escreva e execute C# directamente no navegador, sem instalar nada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Playground,
});

function Playground() {
  const { example } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState(DEFAULT_CODE);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const loadedExample = useRef<string | null>(null);

  // Restore local draft, or load the example from the URL.
  useEffect(() => {
    const ex = example ? getExample(example) : undefined;
    if (ex && loadedExample.current !== ex.id) {
      loadedExample.current = ex.id;
      setCode(ex.code);
    } else if (!hydrated) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const d = JSON.parse(raw) as { code?: string };
          if (d.code) setCode(d.code);
        }
      } catch {
        /* ignore */
      }
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [example]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ code }));
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [code, hydrated]);

  const saveToCloud = async () => {
    if (!user) {
      toast("Inicie sessão para guardar projectos", {
        description: "O seu código fica guardado neste navegador até lá.",
      });
      navigate({ to: "/auth", search: { redirect: "/playground" } });
      return;
    }
    setSaving(true);
    try {
      const firstComment = code.match(/^\s*\/\/\s*(.{3,60})$/m)?.[1];
      const p = await createProject({ name: firstComment ?? "Novo projecto", code });
      toast.success("Projecto guardado na nuvem");
      navigate({ to: "/projects/$projectId", params: { projectId: p.id } });
    } catch (e) {
      toast.error("Não foi possível guardar", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Workspace
      fileName="Playground"
      code={code}
      onCodeChange={setCode}
      onSave={() => toast("Rascunho guardado neste navegador", { description: "Use “Guardar” para o enviar para a nuvem." })}
      saveStatus="Rascunho local"
      actions={
        <Button variant="toolbar" size="sm" onClick={saveToCloud} disabled={saving} aria-label="Guardar na nuvem" className="max-md:size-10 max-md:px-0">
          {saving ? <Loader2 className="animate-spin" /> : <CloudUpload />}
          <span className="hidden md:inline">Guardar</span>
        </Button>
      }
    />
  );
}
