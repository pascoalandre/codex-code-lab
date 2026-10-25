import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  classifyStatus,
  cleanBuildOutput,
  parseDiagnostics,
  prepareModernSource,
  prepareSource,
  toCompilerSource,
  type Diagnostic,
  type PreparedSource,
  type RunStatus,
  WAIT_MARK,
} from "./csharp";

const RunInput = z.object({
  code: z.string().min(1, "O código está vazio").max(100_000, "Código demasiado grande (máx. 100 KB)"),
  stdin: z.string().max(100_000).default(""),
  /** Pause when the program asks for a line that has not been typed yet. */
  interactive: z.boolean().default(false),
  seed: z.number().int().optional(),
});

type RunOptions = { interactive: boolean; seed?: number | undefined };

export interface RunResult {
  ok: boolean;
  status: RunStatus;
  statusText: string;
  stdout: string;
  stderr: string;
  compileOutput: string;
  diagnostics: Diagnostic[];
  time: number | null;
  memory: number | null;
  exitCode: number | null;
  wrapped: boolean;
  /** The program stopped to wait for another input line (typed in the console). */
  waitingInput?: boolean;
  /** Compiler that produced the result. */
  engine?: string;
  error?: string;
}

function toBase64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

function fromBase64(s: string | null | undefined): string {
  if (!s) return "";
  const bin = atob(s.replace(/\s/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

const FIELDS = "base64_encoded=true&wait=true&fields=stdout,stderr,compile_output,message,status,time,memory,exit_code";

interface Engine {
  name: string;
  url: string;
  languageId: number;
  prepare: (code: string, options: RunOptions) => PreparedSource;
  toSource: (prepared: PreparedSource) => string;
  compilerOptions?: string;
  cleanCompileOutput: (out: string) => string;
}

/** Primary: .NET 8 (C# 12) — switch expressions, records, patterns, etc. */
const DOTNET: Engine = {
  name: ".NET 8 · C# 12",
  url: `https://extra-ce.judge0.com/submissions?${FIELDS}`,
  languageId: 30,
  prepare: (code, o) => prepareModernSource(code, { interactive: o.interactive, ...(o.seed != null ? { seed: o.seed } : {}) }),
  toSource: (p) => p.source,
  cleanCompileOutput: cleanBuildOutput,
};

/** Fallback: Mono (C# 7) when the .NET engine is unavailable. */
const MONO: Engine = {
  name: "Mono · C# 7",
  url: `https://ce.judge0.com/submissions?${FIELDS}`,
  languageId: 51,
  prepare: (code) => prepareSource(code),
  toSource: (p) => toCompilerSource(p.source),
  compilerOptions: "-r:System.Numerics.dll",
  cleanCompileOutput: (o) => o,
};

type Attempt =
  | { kind: "result"; result: RunResult }
  | { kind: "unavailable"; busy: boolean; detail: string };

interface EngineJson {
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  status?: { id: number; description: string };
  time?: string | null;
  memory?: number | null;
  exit_code?: number | null;
}

async function runOn(engine: Engine, code: string, stdin: string, options: RunOptions): Promise<Attempt> {
  const prepared = engine.prepare(code, options);
  let res: Response;
  try {
    res = await fetch(engine.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language_id: engine.languageId,
        source_code: toBase64(engine.toSource(prepared)),
        stdin: toBase64(stdin),
        ...(engine.compilerOptions ? { compiler_options: engine.compilerOptions } : {}),
        cpu_time_limit: 8,
        wall_time_limit: 15,
        memory_limit: 512000,
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch (e) {
    console.error(`${engine.name} unreachable`, e);
    return { kind: "unavailable", busy: false, detail: "unreachable" };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`${engine.name} status`, res.status, body);
    return { kind: "unavailable", busy: res.status === 429 || res.status === 503, detail: String(res.status) };
  }

  const json = (await res.json()) as EngineJson;
  const statusId = json.status?.id ?? 13;
  const status = classifyStatus(statusId);
  if (status === "internal-error") {
    return { kind: "unavailable", busy: false, detail: json.status?.description ?? "internal" };
  }
  const rawCompile = fromBase64(json.compile_output);
  const stdout = fromBase64(json.stdout);

  return {
    kind: "result",
    result: {
      ok: status === "success",
      status,
      statusText: json.status?.description ?? "Desconhecido",
      stdout,
      stderr: fromBase64(json.stderr),
      compileOutput: engine.cleanCompileOutput(rawCompile),
      diagnostics: parseDiagnostics(rawCompile, prepared),
      time: json.time != null ? Number(json.time) : null,
      memory: json.memory ?? null,
      exitCode: json.exit_code ?? null,
      wrapped: prepared.wrapped,
      waitingInput: status === "success" && stdout.includes(WAIT_MARK),
      engine: engine.name,
    },
  };
}

export const runCSharp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => RunInput.parse(data))
  .handler(async ({ data }): Promise<RunResult> => {
    const options: RunOptions = { interactive: data.interactive, seed: data.seed };
    const primary = await runOn(DOTNET, data.code, data.stdin, options);
    if (primary.kind === "result") return primary.result;

    const fallback = await runOn(MONO, data.code, data.stdin, options);
    if (fallback.kind === "result") return fallback.result;

    const busy = primary.busy || fallback.busy;
    return {
      ok: false,
      status: "internal-error",
      statusText: busy ? "Compilador ocupado" : "Sem ligação ao compilador",
      stdout: "",
      stderr: "",
      compileOutput: "",
      diagnostics: [],
      time: null,
      memory: null,
      exitCode: null,
      wrapped: false,
      error: busy
        ? "O compilador está com muitos pedidos neste momento. Aguarde alguns segundos e execute de novo."
        : "Não foi possível contactar o servidor de compilação. Tente novamente dentro de instantes.",
    };
  });
