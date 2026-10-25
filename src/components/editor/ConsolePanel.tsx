import { CircleCheck, CircleX, Clock, Copy, Cpu, CornerDownLeft, Lightbulb, Loader2, RotateCcw, Square, SquareTerminal, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { parseTranscript, STATUS_LABEL, transcriptText, type Diagnostic } from "@/lib/csharp";
import type { RunResult } from "@/lib/run.functions";
import { cn } from "@/lib/utils";

export interface ConsoleProps {
  result: RunResult | null;
  running: boolean;
  /** Line just typed, shown while the program continues. */
  pendingEcho: string | null;
  stopped: boolean;
  onSubmit: (line: string) => void;
  onStop: () => void;
  onRerun: () => void;
  onReveal: (d: Diagnostic) => void;
  /** Whether the console is on screen (focus the input only then). */
  visible: boolean;
}

/**
 * Terminal. Programs that read input stop at each Console.ReadLine() and the
 * console shows a blinking input line right after the prompt, like a real
 * terminal. Pressing Enter sends the line and the program continues.
 */
export function Console({ result, running, pendingEcho, stopped, onSubmit, onStop, onRerun, onReveal, visible }: ConsoleProps) {
  const [line, setLine] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const transcript = useMemo(() => parseTranscript(result?.stdout ?? ""), [result?.stdout]);
  const waiting = !!result?.waitingInput && !stopped;
  const acceptsInput = waiting && !running;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [result, running, pendingEcho, stopped]);

  useEffect(() => {
    if (acceptsInput && visible) inputRef.current?.focus({ preventScroll: true });
  }, [acceptsInput, visible]);

  const send = () => {
    if (!acceptsInput) return;
    onSubmit(line);
    setLine("");
  };

  const errors = result?.diagnostics.filter((d) => d.severity === "error") ?? [];

  if (!result && !running) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-terminal p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-[22px] bg-primary-container text-on-primary-container">
          <SquareTerminal className="size-7" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">Consola pronta</p>
          <p className="mx-auto mt-1 max-w-64 text-sm text-muted-foreground">
            Toque em <span className="font-semibold text-foreground">Executar</span>. Quando o programa pedir dados, escreve-os aqui mesmo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-terminal">
      <div
        ref={scrollRef}
        onClick={() => acceptsInput && inputRef.current?.focus()}
        className="code-font min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4 text-[13.5px] leading-[1.65] scrollbar-thin"
      >
        <p className="select-none text-muted-foreground">
          <span className="text-primary">~/codex</span> <span className="text-syn-keyword">$</span> dotnet run
        </p>

        {running && !result && (
          <div className="mt-3">
            <p className="inline-flex items-center gap-2 text-foreground">
              <Loader2 className="size-3.5 animate-spin text-primary" /> A compilar e executar…
            </p>
            <div className="mt-3 h-1 w-full max-w-60 overflow-hidden rounded-full bg-foreground/10">
              <div className="h-full w-1/3 animate-scan rounded-full bg-primary" />
            </div>
            <p className="mt-3 font-sans text-xs text-muted-foreground">O compilador demora alguns segundos a arrancar.</p>
          </div>
        )}

        {result?.error && <p className="mt-3 whitespace-pre-wrap font-sans text-sm text-warning">{result.error}</p>}

        {result?.status === "compile-error" && (
          <div className="mt-3 space-y-2">
            <p className="text-destructive">
              ✕ A compilação falhou{errors.length ? ` · ${errors.length} erro(s)` : ""}
            </p>
            {result.diagnostics.map((d, i) => (
              <button
                key={i}
                onClick={() => onReveal(d)}
                className="block w-full rounded-2xl bg-destructive/10 p-3 text-left font-sans transition active:scale-[0.99]"
              >
                <span className="font-mono text-xs text-destructive">
                  {d.code} · linha {d.line}
                </span>
                <span className="mt-0.5 block text-sm text-foreground">{d.message}</span>
                {d.hint && <span className="mt-1 block text-xs text-muted-foreground">💡 {d.hint}</span>}
              </button>
            ))}
            {!result.diagnostics.length && result.compileOutput && (
              <pre className="whitespace-pre-wrap text-xs text-destructive">{result.compileOutput}</pre>
            )}
          </div>
        )}

        {result && result.status !== "compile-error" && (
          <pre className="m-0 mt-2 whitespace-pre-wrap break-words font-[inherit] text-foreground">
            {transcript.parts.map((p, i) =>
              p.kind === "in" ? (
                <span key={i}>
                  <span className="text-primary">{p.text}</span>
                  {"\n"}
                </span>
              ) : (
                <span key={i}>{p.text}</span>
              ),
            )}
            {waiting && running && pendingEcho !== null && (
              <>
                <span className="text-primary">{pendingEcho}</span>
                {"\n"}
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" /> a continuar…
                </span>
              </>
            )}
            {acceptsInput && (
              <span className="relative inline-block max-w-full align-bottom">
                <input
                  ref={inputRef}
                  value={line}
                  onChange={(e) => setLine(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      send();
                    } else if (e.key === "c" && e.ctrlKey) {
                      e.preventDefault();
                      onStop();
                    }
                  }}
                  enterKeyHint="send"
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label="Escreva a entrada do programa e prima Enter"
                  className="m-0 max-w-full border-0 bg-transparent p-0 font-[inherit] text-primary caret-primary outline-none"
                  style={{ width: `${Math.max(2, line.length + 1)}ch` }}
                />
              </span>
            )}
            {stopped && waiting && (
              <>
                <span className="text-destructive">^C</span>
                {"\n"}
              </>
            )}
          </pre>
        )}

        {result?.stderr && <pre className="m-0 mt-2 whitespace-pre-wrap break-words font-[inherit] text-destructive">{result.stderr}</pre>}

        {result && (!waiting || stopped) && !running && <RunSummary result={result} stopped={stopped && !!result.waitingInput} />}
      </div>

      {acceptsInput ? (
        <div className="flex shrink-0 items-center gap-2 border-t border-border/50 bg-surface-1 px-3 py-2">
          <span className="relative flex size-2.5 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
          </span>
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">À espera de dados — escreva e prima Enter</p>
          <button
            onClick={onStop}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-muted-foreground hover:bg-foreground/8"
          >
            <Square className="size-3.5" /> Parar
          </button>
          <button
            onClick={send}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground active:scale-95"
          >
            Enviar <CornerDownLeft className="size-3.5" />
          </button>
        </div>
      ) : result && !running ? (
        <div className="flex shrink-0 items-center gap-1 border-t border-border/50 bg-surface-1 px-2 py-1.5">
          <button
            onClick={async () => {
              await navigator.clipboard?.writeText(transcriptText(result.stdout) + (result.stderr ? `\n${result.stderr}` : ""));
              toast.success("Saída copiada");
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-muted-foreground hover:bg-foreground/8"
          >
            <Copy className="size-3.5" /> Copiar saída
          </button>
          <button
            onClick={onRerun}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-secondary px-4 text-xs font-semibold text-secondary-foreground active:scale-95"
          >
            <RotateCcw className="size-3.5" /> Executar de novo
          </button>
        </div>
      ) : null}
    </div>
  );
}

function RunSummary({ result, stopped }: { result: RunResult; stopped: boolean }) {
  const tone = stopped
    ? "bg-secondary text-muted-foreground"
    : result.status === "success"
      ? "bg-success/12 text-success"
      : result.status === "compile-error"
        ? "bg-destructive/12 text-destructive"
        : "bg-warning/12 text-warning";
  const Icon = stopped ? Square : result.status === "success" ? CircleCheck : result.status === "compile-error" ? CircleX : TriangleAlert;
  const hasOutput = !!(result.stdout || result.stderr);
  return (
    <div className="mt-4 space-y-2 font-sans">
      {result.status === "success" && !hasOutput && <p className="text-sm italic text-muted-foreground">(o programa não escreveu nada)</p>}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold", tone)}>
          <Icon className="size-3.5" /> {stopped ? "Terminado por si" : STATUS_LABEL[result.status]}
        </span>
        {result.time != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1.5 text-muted-foreground">
            <Clock className="size-3" /> {result.time.toFixed(3)} s
          </span>
        )}
        {result.memory != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1.5 text-muted-foreground">
            <Cpu className="size-3" /> {(result.memory / 1024).toFixed(1)} MB
          </span>
        )}
        {result.engine && <span className="text-muted-foreground">{result.engine}</span>}
      </div>
    </div>
  );
}

export function ProblemsList({ diagnostics, onReveal }: { diagnostics: Diagnostic[]; onReveal: (d: Diagnostic) => void }) {
  if (!diagnostics.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-[20px] bg-success/12 text-success">
          <CircleCheck className="size-6" />
        </div>
        <p className="text-base font-semibold text-foreground">Sem problemas</p>
        <p className="max-w-60 text-sm text-muted-foreground">Os erros do compilador aparecem aqui, explicados em português.</p>
      </div>
    );
  }
  return (
    <ul className="space-y-2 overflow-y-auto p-3">
      {diagnostics.map((d, i) => (
        <li key={i}>
          <button
            onClick={() => onReveal(d)}
            className="flex w-full gap-3 rounded-2xl bg-surface-1 p-4 text-left transition hover:bg-surface-2 active:scale-[0.99]"
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl",
                d.severity === "error" ? "bg-destructive/12 text-destructive" : "bg-warning/12 text-warning",
              )}
            >
              {d.severity === "error" ? <CircleX className="size-[18px]" /> : <TriangleAlert className="size-[18px]" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">{d.message}</span>
              <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                {d.code} · Linha {d.line}, coluna {d.column}
              </span>
              {d.hint && (
                <span className="mt-2 flex gap-1.5 text-xs text-muted-foreground">
                  <Lightbulb className="mt-px size-3.5 shrink-0 text-syn-fn" /> {d.hint}
                </span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-lg bg-secondary px-1.5 font-mono text-[11px] font-medium text-foreground">
      {children}
    </kbd>
  );
}
