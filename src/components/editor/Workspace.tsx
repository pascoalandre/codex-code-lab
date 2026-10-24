import { ClientOnly } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  BookOpen,
  Columns2,
  Copy,
  Download,
  FileCode2,
  Keyboard,
  Loader2,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Play,
  Rows2,
  Settings2,
  Upload,
} from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ModeToggle, ThemePicker } from "@/components/ThemePicker";
import { UserMenu } from "@/components/UserMenu";
import { LogoMark } from "@/components/brand/Logo";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/hooks/use-theme";
import { countInputCalls, needsInput, STATUS_LABEL, type Diagnostic } from "@/lib/csharp";
import type { Example } from "@/lib/examples";
import { runCSharp, type RunResult } from "@/lib/run.functions";
import { cn } from "@/lib/utils";
import type { CodeEditorHandle } from "./CodeEditor";
import { EditorSkeleton } from "./EditorSkeleton";
import { ExamplesDialog } from "./ExamplesDialog";
import { InputDialog } from "./InputDialog";
import { Kbd, OutputPanel, type PanelTab } from "./OutputPanel";
import { Link } from "@tanstack/react-router";

const CodeEditor = lazy(() => import("./CodeEditor"));

interface Prefs {
  fontSize: number;
  minimap: boolean;
  layout: "horizontal" | "vertical";
}
const PREFS_KEY = "codex-editor-prefs-v2";
const DEFAULT_PREFS: Prefs = { fontSize: 14, minimap: true, layout: "horizontal" };

function usePrefs() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);
  const update = useCallback((patch: Partial<Prefs>) => {
    setPrefs((p) => {
      const next = { ...p, ...patch };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);
  return [prefs, update] as const;
}

export interface WorkspaceProps {
  fileName: string;
  onRename?: (name: string) => void;
  code: string;
  onCodeChange: (code: string) => void;
  stdin: string;
  onStdinChange: (stdin: string) => void;
  onSave: () => void;
  /** Small status element: "Guardado", "A guardar…" */
  saveStatus: ReactNode;
  /** Extra action buttons placed before Run (e.g. "Guardar na nuvem"). */
  actions?: ReactNode;
  /** Breadcrumb element placed after the logo (e.g. link back to projects). */
  breadcrumb?: ReactNode;
  dirty?: boolean;
}

export function Workspace({
  fileName,
  onRename,
  code,
  onCodeChange,
  stdin,
  onStdinChange,
  onSave,
  saveStatus,
  actions,
  breadcrumb,
  dirty,
}: WorkspaceProps) {
  const run = useServerFn(runCSharp);
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const [prefs, setPrefs] = usePrefs();

  const rootRef = useRef<HTMLDivElement>(null);
  const editorHandle = useRef<CodeEditorHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [panelTab, setPanelTab] = useState<PanelTab>("output");
  const [mobileView, setMobileView] = useState<"code" | "input" | "output">("code");
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [inputOpen, setInputOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [nativeFs, setNativeFs] = useState(false);
  const [cssFs, setCssFs] = useState(false);
  const [editingName, setEditingName] = useState(false);

  const fullscreen = nativeFs || cssFs;
  const inputCalls = useMemo(() => countInputCalls(code), [code]);
  const diagnostics = result?.diagnostics ?? [];

  const codeRef = useRef(code);
  const stdinRef = useRef(stdin);
  codeRef.current = code;
  stdinRef.current = stdin;

  const execute = useCallback(
    async (stdinOverride?: string) => {
      if (running) return;
      const currentCode = codeRef.current;
      const input = stdinOverride ?? stdinRef.current;
      if (!currentCode.trim()) {
        toast.error("O editor está vazio.");
        return;
      }
      if (stdinOverride === undefined && needsInput(currentCode) && !input.trim()) {
        setInputOpen(true);
        return;
      }
      setRunning(true);
      setPanelTab("output");
      setMobileView("output");
      try {
        const r = await run({ data: { code: currentCode, stdin: input } });
        setResult(r);
        if (r.status === "compile-error" && r.diagnostics.length) setPanelTab("problems");
      } catch (e) {
        setResult({
          ok: false,
          status: "internal-error",
          statusText: "Erro",
          stdout: "",
          stderr: "",
          compileOutput: "",
          diagnostics: [],
          time: null,
          memory: null,
          exitCode: null,
          wrapped: false,
          error: e instanceof Error ? e.message : "Falha inesperada ao executar.",
        });
      } finally {
        setRunning(false);
      }
    },
    [run, running],
  );

  const toggleFullscreen = useCallback(async () => {
    if (fullscreen) {
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      setCssFs(false);
      return;
    }
    const el = rootRef.current;
    if (el?.requestFullscreen && document.fullscreenEnabled) {
      try {
        await el.requestFullscreen();
        return;
      } catch {
        /* fall back to in-page fullscreen */
      }
    }
    setCssFs(true);
  }, [fullscreen]);

  useEffect(() => {
    const onChange = () => setNativeFs(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
      } else if (mod && e.key === "Enter") {
        e.preventDefault();
        execute();
      } else if (e.key === "Escape" && cssFs) {
        setCssFs(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleFullscreen, onSave, execute, cssFs]);

  const reveal = (d: Diagnostic) => {
    setMobileView("code");
    setTimeout(() => editorHandle.current?.revealPosition(d.line, d.column), 30);
  };

  const pickExample = (ex: Example) => {
    const prevCode = code;
    const prevStdin = stdin;
    onCodeChange(ex.code);
    onStdinChange(ex.stdin ?? "");
    setResult(null);
    setExamplesOpen(false);
    setMobileView("code");
    toast.success(`Exemplo carregado: ${ex.title}`, {
      description: ex.stdin ? "Os dados de entrada já foram preenchidos." : undefined,
      action: {
        label: "Desfazer",
        onClick: () => {
          onCodeChange(prevCode);
          onStdinChange(prevStdin);
        },
      },
    });
  };

  const download = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.replace(/[^\w\-À-ÿ ]+/g, "").trim() || "Program"}.cs`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const upload = async (file: File) => {
    if (file.size > 200_000) {
      toast.error("Ficheiro demasiado grande (máx. 200 KB).");
      return;
    }
    onCodeChange(await file.text());
    toast.success(`${file.name} aberto no editor`);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    toast.success("Código copiado");
  };

  const editor = (
    <div className="flex h-full min-h-0 flex-col bg-editor">
      <div className="flex h-10 shrink-0 items-center border-b border-border bg-panel">
        <div className="flex h-full items-center gap-2 border-r border-border bg-editor px-3 text-xs text-foreground">
          <FileCode2 className="size-3.5 text-syn-keyword" />
          <span className="font-mono">Program.cs</span>
          {dirty && <span className="size-1.5 rounded-full bg-foreground/70" aria-label="Alterações por guardar" />}
        </div>
        <div className="ml-auto flex items-center gap-0.5 px-2">
          <EditorSettings prefs={prefs} setPrefs={setPrefs} />
          {!isMobile && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="toolbar"
                  size="icon-xs"
                  onClick={() => setPrefs({ layout: prefs.layout === "horizontal" ? "vertical" : "horizontal" })}
                  aria-label="Alternar disposição"
                >
                  {prefs.layout === "horizontal" ? <Rows2 className="size-3.5" /> : <Columns2 className="size-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{prefs.layout === "horizontal" ? "Consola em baixo" : "Consola ao lado"}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <ClientOnly fallback={<EditorSkeleton />}>
          <Suspense fallback={<EditorSkeleton />}>
            <CodeEditor
              value={code}
              onChange={onCodeChange}
              themeId={theme.id}
              fontSize={isMobile ? Math.min(prefs.fontSize, 13) : prefs.fontSize}
              minimap={!isMobile && prefs.minimap}
              compact={isMobile}
              diagnostics={diagnostics}
              onRun={() => execute()}
              onSave={onSave}
              onCursorChange={(line, column) => setCursor({ line, column })}
              handleRef={editorHandle}
            />
          </Suspense>
        </ClientOnly>
      </div>
    </div>
  );

  const panel = (hideTabs?: boolean, tab?: PanelTab) => (
    <OutputPanel
      tab={tab ?? panelTab}
      onTabChange={setPanelTab}
      result={result}
      running={running}
      stdin={stdin}
      onStdinChange={onStdinChange}
      inputCalls={inputCalls}
      onReveal={reveal}
      onClear={() => setResult(null)}
      hideTabs={hideTabs}
    />
  );

  const errorsCount = diagnostics.filter((d) => d.severity === "error").length;

  return (
    <div
      ref={rootRef}
      className={cn(
        "flex h-dvh flex-col bg-background text-foreground",
        cssFs && "fixed inset-0 z-50",
      )}
    >
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-panel px-2 sm:gap-3 sm:px-3">
        <Link to="/" aria-label="Início" className="shrink-0">
          <LogoMark className="size-7 text-[11px]" />
        </Link>
        {breadcrumb && <div className="hidden shrink-0 items-center text-sm text-muted-foreground md:flex">{breadcrumb}</div>}
        <div className="min-w-0 flex-1">
          {editingName && onRename ? (
            <input
              autoFocus
              defaultValue={fileName}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== fileName) onRename(v);
                setEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setEditingName(false);
              }}
              className="h-8 w-full max-w-72 rounded border border-ring bg-background px-2 text-sm font-medium outline-none"
            />
          ) : (
            <button
              onClick={() => onRename && setEditingName(true)}
              className={cn(
                "flex min-w-0 max-w-full items-center gap-2 rounded px-1.5 py-1 text-left",
                onRename && "hover:bg-accent",
              )}
              title={onRename ? "Mudar o nome" : undefined}
            >
              <span className="truncate text-sm font-semibold tracking-tight">{fileName}</span>
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{saveStatus}</span>
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Button variant="toolbar" size="sm" onClick={() => setExamplesOpen(true)} className="hidden sm:inline-flex">
            <BookOpen /> Exemplos
          </Button>
          {actions}
          <div className="hidden items-center sm:flex">
            <ThemePicker />
            <ModeToggle />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="toolbar" size="icon-sm" onClick={toggleFullscreen} aria-label="Ecrã inteiro">
                {fullscreen ? <Minimize2 /> : <Maximize2 />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{fullscreen ? "Sair do ecrã inteiro" : "Ecrã inteiro"} · Ctrl+Shift+F</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="toolbar" size="icon-sm" aria-label="Mais opções">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onSelect={() => setExamplesOpen(true)} className="sm:hidden">
                <BookOpen /> Exemplos
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={download}>
                <Download /> Descarregar .cs
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
                <Upload /> Abrir ficheiro .cs
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={copy}>
                <Copy /> Copiar código
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setShortcutsOpen(true)}>
                <Keyboard /> Atalhos do teclado
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="run" size="sm" onClick={() => execute()} disabled={running} className="ml-1 px-3">
            {running ? <Loader2 className="animate-spin" /> : <Play className="fill-current" />}
            <span className="hidden sm:inline">{running ? "A executar" : "Executar"}</span>
          </Button>
          <div className="ml-1 hidden sm:block">
            <UserMenu compact />
          </div>
        </div>
      </header>

      {/* Body */}
      {isMobile ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="grid h-10 shrink-0 grid-cols-3 border-b border-border bg-panel p-1">
            {(
              [
                ["code", "Código"],
                ["input", "Entrada"],
                ["output", "Saída"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setMobileView(id)}
                data-active={mobileView === id}
                className="relative rounded text-xs font-medium text-muted-foreground transition data-[active=true]:bg-accent data-[active=true]:text-foreground"
              >
                {label}
                {id === "output" && result && (
                  <span
                    className={cn(
                      "absolute right-3 top-1/2 size-1.5 -translate-y-1/2 rounded-full",
                      result.ok ? "bg-success" : "bg-destructive",
                    )}
                  />
                )}
                {id === "input" && stdin.trim() && (
                  <span className="absolute right-3 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
          <div className={cn("min-h-0 flex-1", mobileView === "code" ? "block" : "hidden")}>{editor}</div>
          {mobileView === "input" && <div className="min-h-0 flex-1">{panel(true, "input")}</div>}
          {mobileView === "output" && (
            <div className="min-h-0 flex-1">
              {panel(false, panelTab === "input" ? "output" : panelTab)}
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <ResizablePanelGroup key={prefs.layout} orientation={prefs.layout}>
            <ResizablePanel defaultSize={prefs.layout === "horizontal" ? "62%" : "65%"} minSize="25%">
              {editor}
            </ResizablePanel>
            <ResizableHandle
              className={cn(
                "bg-border transition-colors hover:bg-primary data-[separator=active]:bg-primary",
                prefs.layout === "horizontal" ? "w-px" : "h-px w-full",
              )}
            />
            <ResizablePanel defaultSize={prefs.layout === "horizontal" ? "38%" : "35%"} minSize="18%">
              {panel()}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}

      {/* Status bar */}
      <footer className="flex h-6 shrink-0 items-center gap-3 bg-statusbar px-3 font-mono text-[11px] text-statusbar-foreground">
        <span className="font-semibold">{result?.engine ?? "C# 12 · .NET 8"}</span>
        <span className="hidden sm:inline">
          Ln {cursor.line}, Col {cursor.column}
        </span>
        <span className="hidden md:inline">UTF-8 · Espaços: 4</span>
        {errorsCount > 0 && <span>✕ {errorsCount}</span>}
        <span className="ml-auto truncate">
          {running
            ? "A executar…"
            : result
              ? `${STATUS_LABEL[result.status]}${result.time != null ? ` · ${result.time.toFixed(3)}s` : ""}`
              : "Pronto"}
        </span>
        <span className="hidden md:inline">{theme.label}</span>
      </footer>

      <input
        ref={fileInputRef}
        type="file"
        accept=".cs,.txt"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />

      <ExamplesDialog open={examplesOpen} onOpenChange={setExamplesOpen} onPick={pickExample} />
      <InputDialog
        open={inputOpen}
        onOpenChange={setInputOpen}
        inputCalls={inputCalls}
        initial={stdin}
        onSubmit={(value) => {
          setInputOpen(false);
          onStdinChange(value);
          execute(value);
        }}
      />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}

function EditorSettings({ prefs, setPrefs }: { prefs: Prefs; setPrefs: (p: Partial<Prefs>) => void }) {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="toolbar" size="icon-xs" aria-label="Definições do editor">
              <Settings2 className="size-3.5" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Definições do editor</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-64">
        <p className="label-mono text-muted-foreground">Editor</p>
        <div className="mt-3 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Tamanho da letra</span>
            <div className="flex items-center gap-1">
              <Button variant="subtle" size="icon-xs" onClick={() => setPrefs({ fontSize: Math.max(10, prefs.fontSize - 1) })}>
                −
              </Button>
              <span className="w-8 text-center font-mono text-sm">{prefs.fontSize}</span>
              <Button variant="subtle" size="icon-xs" onClick={() => setPrefs({ fontSize: Math.min(28, prefs.fontSize + 1) })}>
                +
              </Button>
            </div>
          </div>
          <label className="flex items-center justify-between">
            <span className="text-sm">Minimapa</span>
            <Switch checked={prefs.minimap} onCheckedChange={(v) => setPrefs({ minimap: v })} />
          </label>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const SHORTCUTS: [string[], string][] = [
  [["Ctrl", "Enter"], "Compilar e executar"],
  [["F5"], "Executar (no editor)"],
  [["Ctrl", "S"], "Guardar"],
  [["Ctrl", "Shift", "F"], "Ecrã inteiro"],
  [["Ctrl", "Espaço"], "Sugestões e snippets"],
  [["Ctrl", "/"], "Comentar linha"],
  [["Alt", "↑/↓"], "Mover linha"],
  [["Shift", "Alt", "↓"], "Duplicar linha"],
  [["Ctrl", "D"], "Seleccionar próxima ocorrência"],
  [["Ctrl", "F"], "Procurar"],
  [["Ctrl", "H"], "Substituir"],
  [["F1"], "Paleta de comandos"],
];

function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="tracking-tight">Atalhos do teclado</DialogTitle>
        </DialogHeader>
        <ul className="divide-y divide-border">
          {SHORTCUTS.map(([keys, label]) => (
            <li key={label} className="flex items-center justify-between py-2 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="flex gap-1">
                {keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Dica: escreva <code className="font-mono text-foreground">cw</code>, <code className="font-mono text-foreground">for</code>,{" "}
          <code className="font-mono text-foreground">lerint</code> ou <code className="font-mono text-foreground">matriz</code> e carregue em Tab.
        </p>
      </DialogContent>
    </Dialog>
  );
}
