import { AlertTriangle, CircleCheck, CircleX, Clock, Cpu, Eraser, Keyboard, Lightbulb, Loader2, TerminalSquare, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STATUS_LABEL, type Diagnostic } from "@/lib/csharp";
import type { RunResult } from "@/lib/run.functions";
import { cn } from "@/lib/utils";

export type PanelTab = "output" | "input" | "problems";

interface OutputPanelProps {
  tab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  result: RunResult | null;
  running: boolean;
  stdin: string;
  onStdinChange: (v: string) => void;
  inputCalls: number;
  onReveal: (d: Diagnostic) => void;
  onClear: () => void;
  hideTabs?: boolean | undefined;
}

export function OutputPanel({
  tab,
  onTabChange,
  result,
  running,
  stdin,
  onStdinChange,
  inputCalls,
  onReveal,
  onClear,
  hideTabs,
}: OutputPanelProps) {
  const diagnostics = result?.diagnostics ?? [];
  const errors = diagnostics.filter((d) => d.severity === "error").length;
  const warnings = diagnostics.length - errors;

  return (
    <div className="flex h-full min-h-0 flex-col bg-panel">
      {!hideTabs && (
        <div className="flex h-10 shrink-0 items-center gap-1 border-b border-border px-2">
          <PanelTabButton active={tab === "output"} onClick={() => onTabChange("output")}>
            <TerminalSquare className="size-3.5" /> Saída
          </PanelTabButton>
          <PanelTabButton active={tab === "input"} onClick={() => onTabChange("input")}>
            <Keyboard className="size-3.5" /> Entrada
            {stdin.trim() && <span className="size-1.5 rounded-full bg-primary" />}
          </PanelTabButton>
          <PanelTabButton active={tab === "problems"} onClick={() => onTabChange("problems")}>
            <AlertTriangle className="size-3.5" /> Problemas
            {diagnostics.length > 0 && (
              <span
                className={cn(
                  "rounded px-1.5 font-mono text-[10px] leading-4",
                  errors ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning",
                )}
              >
                {diagnostics.length}
              </span>
            )}
          </PanelTabButton>
          <div className="ml-auto">
            {tab === "output" && result && (
              <Button variant="toolbar" size="icon-xs" onClick={onClear} aria-label="Limpar saída">
                <Eraser className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto scrollbar-thin">
        {tab === "output" && <OutputView result={result} running={running} errors={errors} warnings={warnings} onShowProblems={() => onTabChange("problems")} />}
        {tab === "input" && <InputView stdin={stdin} onChange={onStdinChange} inputCalls={inputCalls} />}
        {tab === "problems" && <ProblemsView diagnostics={diagnostics} onReveal={onReveal} />}
      </div>
    </div>
  );
}

function PanelTabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      data-active={active}
      className="relative inline-flex h-10 items-center gap-1.5 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground data-[active=true]:text-foreground data-[active=true]:after:absolute data-[active=true]:after:inset-x-2 data-[active=true]:after:bottom-0 data-[active=true]:after:h-0.5 data-[active=true]:after:rounded-full data-[active=true]:after:bg-primary"
    >
      {children}
    </button>
  );
}

function OutputView({
  result,
  running,
  errors,
  warnings,
  onShowProblems,
}: {
  result: RunResult | null;
  running: boolean;
  errors: number;
  warnings: number;
  onShowProblems: () => void;
}) {
  if (running) {
    return (
      <div className="relative h-full bg-terminal p-4 font-mono text-[13px]">
        <div className="absolute inset-x-0 top-0 h-px overflow-hidden">
          <div className="h-full w-1/3 animate-scan bg-primary" />
        </div>
        <p className="text-muted-foreground">
          <span className="text-primary">$</span> mcs Program.cs && mono Program.exe
        </p>
        <p className="mt-3 inline-flex items-center gap-2 text-foreground">
          <Loader2 className="size-3.5 animate-spin text-primary" /> A compilar e executar…
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-terminal p-6 text-center">
        <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-card">
          <TerminalSquare className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Pronto para executar</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Carregue em <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd> ou no botão Executar.
          </p>
        </div>
      </div>
    );
  }

  const tone =
    result.status === "success" ? "text-success" : result.status === "compile-error" ? "text-destructive" : "text-warning";
  const Icon = result.status === "success" ? CircleCheck : result.status === "compile-error" ? CircleX : TriangleAlert;

  return (
    <div className="min-h-full bg-terminal p-4 font-mono text-[13px] leading-relaxed">
      <p className="text-muted-foreground">
        <span className="text-primary">$</span> mcs Program.cs && mono Program.exe
      </p>

      {result.error && <p className="mt-3 whitespace-pre-wrap text-warning">{result.error}</p>}

      {result.status === "compile-error" && (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-destructive">
            Compilação falhou: {errors} erro(s){warnings ? `, ${warnings} aviso(s)` : ""}.
          </p>
          <button onClick={onShowProblems} className="mt-1 text-xs text-foreground underline underline-offset-4 hover:text-primary">
            Ver problemas e sugestões →
          </button>
          {result.diagnostics.length === 0 && result.compileOutput && (
            <pre className="mt-2 whitespace-pre-wrap text-xs text-destructive">{result.compileOutput}</pre>
          )}
        </div>
      )}

      {result.stdout && <pre className="mt-3 whitespace-pre-wrap break-words text-foreground">{result.stdout}</pre>}
      {result.stderr && <pre className="mt-3 whitespace-pre-wrap break-words text-destructive">{result.stderr}</pre>}
      {result.status === "success" && !result.stdout && !result.stderr && (
        <p className="mt-3 italic text-muted-foreground">(o programa não produziu saída)</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-dashed border-border pt-3 text-[11px] text-muted-foreground">
        <span className={cn("inline-flex items-center gap-1.5 font-semibold", tone)}>
          <Icon className="size-3.5" /> {STATUS_LABEL[result.status]}
        </span>
        {result.exitCode != null && <span>código de saída {result.exitCode}</span>}
        {result.time != null && (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" /> {result.time.toFixed(3)} s
          </span>
        )}
        {result.memory != null && (
          <span className="inline-flex items-center gap-1">
            <Cpu className="size-3" /> {(result.memory / 1024).toFixed(1)} MB
          </span>
        )}
        {warnings > 0 && result.status !== "compile-error" && (
          <button onClick={onShowProblems} className="text-warning hover:underline">
            {warnings} aviso(s)
          </button>
        )}
      </div>
    </div>
  );
}

function InputView({ stdin, onChange, inputCalls }: { stdin: string; onChange: (v: string) => void; inputCalls: number }) {
  const lines = stdin ? stdin.split("\n").length : 0;
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div>
        <p className="text-sm font-medium text-foreground">Dados de entrada (stdin)</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Cada linha é entregue a um <code className="font-mono text-syn-fn">Console.ReadLine()</code>, pela ordem.
          {inputCalls > 0 && (
            <>
              {" "}
              O seu código tem <span className="font-semibold text-foreground">{inputCalls}</span> leitura(s) — em
              ciclos pode precisar de mais linhas.
            </>
          )}
        </p>
      </div>
      <textarea
        value={stdin}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder={"Ex.:\n12\n4\n*"}
        className="min-h-40 flex-1 resize-none rounded-md border border-input bg-terminal p-3 font-mono text-[13px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-ring"
      />
      <p className="label-mono text-muted-foreground">{lines} linha(s)</p>
    </div>
  );
}

function ProblemsView({ diagnostics, onReveal }: { diagnostics: Diagnostic[]; onReveal: (d: Diagnostic) => void }) {
  if (!diagnostics.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <CircleCheck className="size-6 text-success" />
        <p className="text-sm text-foreground">Nenhum problema detectado</p>
        <p className="text-xs text-muted-foreground">Os erros e avisos do compilador aparecem aqui.</p>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {diagnostics.map((d, i) => (
        <li key={i}>
          <button
            onClick={() => onReveal(d)}
            className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
          >
            {d.severity === "error" ? (
              <CircleX className="mt-0.5 size-4 shrink-0 text-destructive" />
            ) : (
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[13px] text-foreground">{d.message}</p>
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                {d.code} · Linha {d.line}, Col {d.column}
              </p>
              {d.hint && (
                <p className="mt-1.5 flex gap-1.5 text-xs text-muted-foreground">
                  <Lightbulb className="mt-px size-3.5 shrink-0 text-syn-fn" /> {d.hint}
                </p>
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-card px-1 font-mono text-[10px] font-medium text-foreground shadow-[0_1px_0_var(--border)]">
      {children}
    </kbd>
  );
}
