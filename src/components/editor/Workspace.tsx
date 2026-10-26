import { ClientOnly, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowDown,
  ArrowLeftIcon,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Bug,
  ChevronDown,
  Code2,
  Columns2,
  Copy,
  Download,
  Keyboard,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  MoreVertical,
  Play,
  Plus,
  Redo2,
  Rows2,
  SquareTerminal,
  Undo2,
  Upload,
} from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ModeToggle, ThemePicker } from "@/components/ThemePicker";
import { NavRail } from "@/components/app/AppShell";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Diagnostic } from "@/lib/csharp";
import type { Example } from "@/lib/examples";
import { runCSharp, type RunResult } from "@/lib/run.functions";
import { cn } from "@/lib/utils";
import type { CodeEditorHandle, EditorKey } from "./CodeEditor";
import { Console, Kbd, ProblemsList } from "./ConsolePanel";
import { EditorSkeleton } from "./EditorSkeleton";
import { ExamplesDialog } from "./ExamplesDialog";

const CodeEditor = lazy(() => import("./CodeEditor"));

interface Prefs {
  fontSize: number;
  layout: "horizontal" | "vertical";
}
const PREFS_KEY = "codex-editor-prefs-v3";
const DEFAULT_PREFS: Prefs = { fontSize: 14, layout: "horizontal" };

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

/** True while the on-screen keyboard is up (visible area much shorter than usual). */
function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let max = vv.height;
    let width = vv.width;
    const on = () => {
      if (Math.abs(vv.width - width) > 60) {
        width = vv.width;
        max = vv.height;
      }
      max = Math.max(max, vv.height);
      setOpen(max - vv.height > 140);
    };
    on();
    vv.addEventListener("resize", on);
    return () => vv.removeEventListener("resize", on);
  }, []);
  return open;
}

export interface WorkspaceProps {
  fileName: string;
  onRename?: (name: string) => void;
  code: string;
  onCodeChange: (code: string) => void;
  onSave: () => void;
  /** Small status element: "Guardado", "A guardar…" */
  saveStatus: ReactNode;
  /** Extra action buttons in the top bar (e.g. "Guardar na nuvem"). */
  actions?: ReactNode;
  /** Where the back arrow goes. */
  backTo?: "/" | "/projects";
  dirty?: boolean;
}

type View = "code" | "console" | "problems";

export function Workspace({ fileName, onRename, code, onCodeChange, onSave, saveStatus, actions, backTo = "/", dirty }: WorkspaceProps) {
  const run = useServerFn(runCSharp);
  const isMobile = useIsMobile();
  const keyboardOpen = useKeyboardOpen();
  const [prefs, setPrefs] = usePrefs();

  const rootRef = useRef<HTMLDivElement>(null);
  const editorHandle = useRef<CodeEditorHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [inputs, setInputs] = useState<string[]>([]);
  const [pendingEcho, setPendingEcho] = useState<string | null>(null);
  const [stopped, setStopped] = useState(false);
  const [view, setView] = useState<View>("code");
  const [sideTab, setSideTab] = useState<"console" | "problems">("console");
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [editorFocused, setEditorFocused] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [nativeFs, setNativeFs] = useState(false);
  const [cssFs, setCssFs] = useState(false);
  const [editingName, setEditingName] = useState(false);

  const fullscreen = nativeFs || cssFs;
  const diagnostics = result?.diagnostics ?? [];
  const errorsCount = diagnostics.filter((d) => d.severity === "error").length;

  const codeRef = useRef(code);
  codeRef.current = code;
  const runningRef = useRef(false);
  /** Code and random seed of the current run, reused when more input is typed. */
  const session = useRef<{ code: string; seed: number }>({ code: "", seed: 0 });

  const execute = useCallback(
    async (lines: string[]) => {
      if (runningRef.current) return;
      runningRef.current = true;
      setRunning(true);
      try {
        const r = await run({
          data: {
            code: session.current.code,
            stdin: lines.map((l) => l + "\n").join(""),
            interactive: true,
            seed: session.current.seed,
          },
        });
        setResult(r);
        if (r.status === "compile-error" && r.diagnostics.length) setSideTab("problems");
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
        runningRef.current = false;
        setRunning(false);
        setPendingEcho(null);
      }
    },
    [run],
  );

  const start = useCallback(() => {
    if (runningRef.current) return;
    if (!codeRef.current.trim()) {
      toast.error("O editor está vazio.");
      return;
    }
    session.current = { code: codeRef.current, seed: Math.floor(Math.random() * 1_000_000_000) };
    setInputs([]);
    setResult(null);
    setStopped(false);
    setSideTab("console");
    setView("console");
    (document.activeElement as HTMLElement | null)?.blur?.();
    execute([]);
  }, [execute]);

  const submitLine = (text: string) => {
    const next = [...inputs, ...text.replace(/\r\n?/g, "\n").split("\n")];
    setInputs(next);
    setPendingEcho(text);
    execute(next);
  };

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
      } else if ((mod && e.key === "Enter") || e.key === "F5") {
        e.preventDefault();
        start();
      } else if (e.key === "Escape" && cssFs) {
        setCssFs(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleFullscreen, onSave, start, cssFs]);

  const reveal = (d: Diagnostic) => {
    setView("code");
    setTimeout(() => editorHandle.current?.revealPosition(d.line, d.column), 40);
  };

  const pickExample = (ex: Example) => {
    const prevCode = code;
    onCodeChange(ex.code);
    setResult(null);
    setExamplesOpen(false);
    setView("code");
    toast.success(`Exemplo carregado: ${ex.title}`, {
      action: { label: "Desfazer", onClick: () => onCodeChange(prevCode) },
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

  const waiting = !!result?.waitingInput && !stopped;

  const editor = (
    <div className="h-full min-h-0">
      <ClientOnly fallback={<EditorSkeleton />}>
        <Suspense fallback={<EditorSkeleton />}>
          <CodeEditor
            value={code}
            onChange={onCodeChange}
            fontSize={prefs.fontSize}
            compact={isMobile}
            diagnostics={diagnostics}
            onCursorChange={(line, column) => setCursor({ line, column })}
            onFocusChange={setEditorFocused}
            handleRef={editorHandle}
          />
        </Suspense>
      </ClientOnly>
    </div>
  );

  const consoleEl = (visible: boolean) => (
    <Console
      result={result}
      running={running}
      pendingEcho={pendingEcho}
      stopped={stopped}
      onSubmit={submitLine}
      onStop={() => setStopped(true)}
      onRerun={start}
      onReveal={reveal}
      visible={visible}
    />
  );

  const titleBlock = (
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
          className="h-10 w-full max-w-80 rounded-xl border border-primary bg-surface-1 px-3 text-base font-semibold outline-none"
        />
      ) : (
        <button
          onClick={() => onRename && setEditingName(true)}
          className={cn("block min-w-0 max-w-full rounded-xl px-2 py-1 text-left", onRename && "hover:bg-foreground/5")}
          title={onRename ? "Mudar o nome" : undefined}
        >
          <span className="flex items-center gap-2">
            <span className="truncate text-[17px] font-semibold leading-tight tracking-tight">{fileName}</span>
            {dirty && <span className="size-2 shrink-0 rounded-full bg-warning" aria-label="Alterações por guardar" />}
          </span>
          <span className="block truncate text-xs leading-tight text-muted-foreground">{saveStatus}</span>
        </button>
      )}
    </div>
  );

  const moreMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="toolbar" size="icon-sm" aria-label="Mais opções">
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onSelect={() => setExamplesOpen(true)}>
          <BookOpen /> Exemplos prontos
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={toggleFullscreen}>
          {fullscreen ? <Minimize2 /> : <Maximize2 />} {fullscreen ? "Sair do ecrã inteiro" : "Ecrã inteiro"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          Tamanho da letra
          <span className="flex items-center gap-1">
            <button
              className="flex size-8 items-center justify-center rounded-full hover:bg-foreground/8"
              onClick={() => setPrefs({ fontSize: Math.max(10, prefs.fontSize - 1) })}
              aria-label="Diminuir letra"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-6 text-center font-mono text-sm text-foreground">{prefs.fontSize}</span>
            <button
              className="flex size-8 items-center justify-center rounded-full hover:bg-foreground/8"
              onClick={() => setPrefs({ fontSize: Math.min(26, prefs.fontSize + 1) })}
              aria-label="Aumentar letra"
            >
              <Plus className="size-4" />
            </button>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={download}>
          <Download /> Descarregar .cs
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
          <Upload /> Abrir ficheiro .cs
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={copy}>
          <Copy /> Copiar código
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setShortcutsOpen(true)} className="max-md:hidden">
          <Keyboard /> Atalhos do teclado
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const backButton = (
    <Button asChild variant="toolbar" size="icon-sm" className="shrink-0 text-foreground">
      <Link to={backTo} aria-label="Voltar">
        <ArrowLeft className="size-[22px]" />
      </Link>
    </Button>
  );

  const runLabel = running ? (waiting || pendingEcho !== null ? "A continuar" : "A executar") : "Executar";

  const hidden = {
    rest: (
      <>
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
        <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      </>
    ),
  };

  /* ---------------------------------- Phone ---------------------------------- */
  if (isMobile) {
    const showKeys = view === "code" && editorFocused;
    return (
      <div ref={rootRef} className={cn("flex h-dvh flex-col overflow-hidden bg-background text-foreground", cssFs && "fixed inset-0 z-50")}>
        {!(fullscreen && view === "code" && editorFocused) && (
          <header className="flex h-16 shrink-0 items-center gap-0.5 bg-surface-2 px-1">
            {backButton}
            {titleBlock}
            {actions}
            <Button variant="toolbar" size="icon-sm" onClick={() => setExamplesOpen(true)} aria-label="Exemplos">
              <BookOpen />
            </Button>
            <ThemePicker />
            {moreMenu}
          </header>
        )}

        <main className="relative min-h-0 flex-1">
          <div className={cn("absolute inset-0", view === "code" ? "block" : "hidden")}>{editor}</div>
          {view === "console" && <div className="absolute inset-0">{consoleEl(true)}</div>}
          {view === "problems" && (
            <div className="absolute inset-0 overflow-y-auto bg-background">
              <ProblemsList diagnostics={diagnostics} onReveal={reveal} />
            </div>
          )}

          {view === "code" && !keyboardOpen && (
            <button
              onClick={start}
              disabled={running}
              className="absolute bottom-4 right-4 z-30 inline-flex h-14 items-center gap-3 rounded-2xl bg-primary px-5 text-[15px] font-semibold text-primary-foreground shadow-fab transition active:scale-95 disabled:opacity-80"
            >
              {running ? <Loader2 className="size-5 animate-spin" /> : <Play className="size-5 fill-current" />}
              {runLabel}
            </button>
          )}
        </main>

        {showKeys && <ExtraKeys onKey={(k) => editorHandle.current?.key(k)} onText={(t) => editorHandle.current?.insertText(t)} onRun={start} running={running} />}

        {!keyboardOpen && (
          <nav aria-label="Vistas do editor" className="pb-safe grid shrink-0 grid-cols-3 border-t border-border/40 bg-surface-2">
            <TabItem active={view === "code"} onClick={() => setView("code")} icon={<Code2 />} label="Código" />
            <TabItem
              active={view === "console"}
              onClick={() => setView("console")}
              icon={<SquareTerminal />}
              label="Consola"
              badge={
                running ? (
                  <span className="absolute -right-0.5 -top-0.5 size-2.5 animate-pulse rounded-full bg-primary ring-2 ring-surface-2" />
                ) : waiting ? (
                  <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-warning ring-2 ring-surface-2" />
                ) : result ? (
                  <span className={cn("absolute -right-0.5 -top-0.5 size-2.5 rounded-full ring-2 ring-surface-2", result.ok ? "bg-success" : "bg-destructive")} />
                ) : null
              }
            />
            <TabItem
              active={view === "problems"}
              onClick={() => setView("problems")}
              icon={<Bug />}
              label="Problemas"
              badge={
                diagnostics.length ? (
                  <span
                    className={cn(
                      "absolute -right-2.5 -top-1.5 min-w-[18px] rounded-full px-1 text-center text-[10px] font-bold leading-[18px]",
                      errorsCount ? "bg-destructive text-destructive-foreground" : "bg-warning text-background",
                    )}
                  >
                    {diagnostics.length}
                  </span>
                ) : null
              }
            />
          </nav>
        )}
        {hidden.rest}
      </div>
    );
  }

  /* -------------------------------- Tablet / PC ------------------------------- */
  return (
    <div ref={rootRef} className={cn("flex h-dvh bg-background text-foreground", cssFs && "fixed inset-0 z-50")}>
      {!fullscreen && <NavRail active="editor" />}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-1 px-3">
          {backButton}
          {titleBlock}
          <div className="flex shrink-0 items-center gap-0.5">
            {actions}
            <Button variant="toolbar" size="sm" onClick={() => setExamplesOpen(true)}>
              <BookOpen /> Exemplos
            </Button>
            {fullscreen && (
              <>
                <ThemePicker />
                <ModeToggle />
              </>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="toolbar"
                  size="icon-sm"
                  onClick={() => setPrefs({ layout: prefs.layout === "horizontal" ? "vertical" : "horizontal" })}
                  aria-label="Alternar disposição"
                >
                  {prefs.layout === "horizontal" ? <Rows2 /> : <Columns2 />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{prefs.layout === "horizontal" ? "Consola em baixo" : "Consola ao lado"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="toolbar" size="icon-sm" onClick={toggleFullscreen} aria-label="Ecrã inteiro">
                  {fullscreen ? <Minimize2 /> : <Maximize2 />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{fullscreen ? "Sair do ecrã inteiro" : "Ecrã inteiro"} · Ctrl+Shift+F</TooltipContent>
            </Tooltip>
            {moreMenu}
            <Button variant="run" onClick={start} disabled={running} className="ml-2 h-11 rounded-2xl px-5">
              {running ? <Loader2 className="animate-spin" /> : <Play className="fill-current" />}
              {runLabel}
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 px-3 pb-3">
          <ResizablePanelGroup key={prefs.layout} orientation={prefs.layout}>
            <ResizablePanel defaultSize={prefs.layout === "horizontal" ? "60%" : "64%"} minSize="25%">
              <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] bg-editor ring-1 ring-border/60">
                <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border/50 bg-surface-1 px-4 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 font-mono text-foreground">
                    <Code2 className="size-3.5 text-syn-keyword" /> Program.cs
                  </span>
                  <span className="ml-auto font-mono text-muted-foreground">
                    Ln {cursor.line}, Col {cursor.column}
                  </span>
                  <span className="font-mono text-muted-foreground">C# 12 · .NET 8</span>
                </div>
                <div className="min-h-0 flex-1">{editor}</div>
              </section>
            </ResizablePanel>
            <ResizableHandle
              className={cn(
                "bg-transparent after:rounded-full after:bg-border after:transition-colors hover:after:bg-primary data-[separator=active]:after:bg-primary",
                prefs.layout === "horizontal" ? "w-3 after:inset-y-[45%] after:left-1 after:w-1" : "h-3 w-full after:inset-x-[45%] after:top-1 after:h-1",
              )}
            />
            <ResizablePanel defaultSize={prefs.layout === "horizontal" ? "40%" : "36%"} minSize="18%">
              <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] bg-terminal ring-1 ring-border/60">
                <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border/50 bg-surface-1 px-2">
                  <ChipTab active={sideTab === "console"} onClick={() => setSideTab("console")}>
                    <SquareTerminal className="size-3.5" /> Consola
                    {waiting && <span className="size-1.5 rounded-full bg-warning" />}
                  </ChipTab>
                  <ChipTab active={sideTab === "problems"} onClick={() => setSideTab("problems")}>
                    <Bug className="size-3.5" /> Problemas
                    {diagnostics.length > 0 && (
                      <span className={cn("rounded-full px-1.5 text-[10px] leading-4", errorsCount ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning")}>
                        {diagnostics.length}
                      </span>
                    )}
                  </ChipTab>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden">
                  {sideTab === "console" ? consoleEl(true) : (
                    <div className="h-full overflow-y-auto">
                      <ProblemsList diagnostics={diagnostics} onReveal={reveal} />
                    </div>
                  )}
                </div>
              </section>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
      {hidden.rest}
    </div>
  );
}

function TabItem({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: ReactNode; label: string; badge?: ReactNode }) {
  return (
    <button onClick={onClick} aria-current={active ? "page" : undefined} className="flex h-[72px] flex-col items-center justify-center gap-1 text-xs font-semibold">
      <span
        className={cn(
          "relative flex h-8 w-16 items-center justify-center rounded-full transition-colors [&_svg]:size-[22px]",
          active ? "bg-primary-container text-on-primary-container" : "text-muted-foreground",
        )}
      >
        {icon}
        {badge}
      </span>
      <span className={active ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </button>
  );
}

function ChipTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      data-active={active}
      className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-foreground/5 data-[active=true]:bg-primary-container data-[active=true]:text-on-primary-container"
    >
      {children}
    </button>
  );
}

const SYMBOLS = ["{", "}", "(", ")", "[", "]", ";", '"', "'", "=", "<", ">", "+", "-", "*", "/", "%", "!", "&", "|", ":", ",", ".", "$", "_", "?"];

/** Extra keys above the phone keyboard (programming symbols, arrows, undo). */
function ExtraKeys({ onKey, onText, onRun, running }: { onKey: (k: EditorKey) => void; onText: (t: string) => void; onRun: () => void; running: boolean }) {
  const keep = (e: React.PointerEvent | React.MouseEvent) => e.preventDefault();
  const base =
    "flex h-11 min-w-11 shrink-0 items-center justify-center rounded-xl px-2 font-mono text-[15px] text-foreground active:bg-foreground/15 [&_svg]:size-[18px]";
  return (
    <div className="flex shrink-0 items-center gap-1 border-t border-border/40 bg-surface-2 px-1 py-1">
      <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
        <button onPointerDown={keep} onMouseDown={keep} onClick={() => onKey("tab")} className={cn(base, "px-3 font-sans text-xs font-semibold")}>
          TAB
        </button>
        <button onPointerDown={keep} onMouseDown={keep} onClick={() => onKey("left")} className={base} aria-label="Esquerda">
          <ArrowLeftIcon />
        </button>
        <button onPointerDown={keep} onMouseDown={keep} onClick={() => onKey("right")} className={base} aria-label="Direita">
          <ArrowRight />
        </button>
        <button onPointerDown={keep} onMouseDown={keep} onClick={() => onKey("up")} className={base} aria-label="Cima">
          <ArrowUp />
        </button>
        <button onPointerDown={keep} onMouseDown={keep} onClick={() => onKey("down")} className={base} aria-label="Baixo">
          <ArrowDown />
        </button>
        {SYMBOLS.map((s) => (
          <button key={s} onPointerDown={keep} onMouseDown={keep} onClick={() => onText(s)} className={base}>
            {s}
          </button>
        ))}
        <button onPointerDown={keep} onMouseDown={keep} onClick={() => onKey("undo")} className={base} aria-label="Desfazer">
          <Undo2 />
        </button>
        <button onPointerDown={keep} onMouseDown={keep} onClick={() => onKey("redo")} className={base} aria-label="Refazer">
          <Redo2 />
        </button>
        <button
          onPointerDown={keep}
          onMouseDown={keep}
          onClick={() => (document.activeElement as HTMLElement | null)?.blur?.()}
          className={base}
          aria-label="Esconder teclado"
        >
          <ChevronDown />
        </button>
      </div>
      <button
        onPointerDown={keep}
        onMouseDown={keep}
        onClick={onRun}
        disabled={running}
        aria-label="Executar"
        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground active:scale-95"
      >
        {running ? <Loader2 className="size-5 animate-spin" /> : <Play className="size-5 fill-current" />}
      </button>
    </div>
  );
}

const SHORTCUTS: [string[], string][] = [
  [["Ctrl", "Enter"], "Compilar e executar"],
  [["F5"], "Executar"],
  [["Ctrl", "S"], "Guardar"],
  [["Ctrl", "Shift", "F"], "Ecrã inteiro"],
  [["Tab"], "Indentar / expandir snippet"],
  [["Shift", "Tab"], "Recuar indentação"],
  [["Ctrl", "/"], "Comentar linhas"],
  [["Ctrl", "Z"], "Desfazer"],
  [["Ctrl", "C"], "Parar o programa (na consola)"],
];

function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl tracking-tight">Atalhos do teclado</DialogTitle>
        </DialogHeader>
        <ul className="divide-y divide-border/60">
          {SHORTCUTS.map(([keys, label]) => (
            <li key={label} className="flex items-center justify-between py-2.5 text-sm">
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
          Snippets: escreva <code className="font-mono text-foreground">cw</code>, <code className="font-mono text-foreground">for</code>,{" "}
          <code className="font-mono text-foreground">lerint</code> ou <code className="font-mono text-foreground">matriz</code> e prima Tab.
        </p>
      </DialogContent>
    </Dialog>
  );
}
