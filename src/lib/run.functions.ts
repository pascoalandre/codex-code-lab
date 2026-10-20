import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { classifyStatus, parseDiagnostics, prepareSource, type Diagnostic, type RunStatus } from "./csharp";

const RunInput = z.object({
  code: z.string().min(1, "O código está vazio").max(100_000, "Código demasiado grande (máx. 100 KB)"),
  stdin: z.string().max(100_000).default(""),
});

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

const ENGINE_URL =
  "https://ce.judge0.com/submissions?base64_encoded=true&wait=true&fields=stdout,stderr,compile_output,message,status,time,memory,exit_code";

export const runCSharp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => RunInput.parse(data))
  .handler(async ({ data }): Promise<RunResult> => {
    const prepared = prepareSource(data.code);
    const empty = {
      stdout: "",
      stderr: "",
      compileOutput: "",
      diagnostics: [],
      time: null,
      memory: null,
      exitCode: null,
      wrapped: prepared.wrapped,
    };

    let res: Response;
    try {
      res = await fetch(ENGINE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language_id: 51,
          source_code: toBase64(prepared.source),
          stdin: toBase64(data.stdin),
          compiler_options: "-r:System.Numerics.dll",
          cpu_time_limit: 6,
          wall_time_limit: 12,
        }),
      });
    } catch (e) {
      console.error("run engine unreachable", e);
      return {
        ...empty,
        ok: false,
        status: "internal-error",
        statusText: "Sem ligação ao compilador",
        error: "Não foi possível contactar o servidor de compilação. Tente novamente dentro de instantes.",
      };
    }

    if (!res.ok) {
      const busy = res.status === 429 || res.status === 503;
      console.error("run engine status", res.status, await res.text().catch(() => ""));
      return {
        ...empty,
        ok: false,
        status: "internal-error",
        statusText: busy ? "Compilador ocupado" : "Falha no compilador",
        error: busy
          ? "O compilador está com muitos pedidos neste momento. Aguarde alguns segundos e execute de novo."
          : `O servidor de compilação respondeu com erro (${res.status}).`,
      };
    }

    const json = (await res.json()) as {
      stdout?: string | null;
      stderr?: string | null;
      compile_output?: string | null;
      message?: string | null;
      status?: { id: number; description: string };
      time?: string | null;
      memory?: number | null;
      exit_code?: number | null;
    };

    const statusId = json.status?.id ?? 13;
    const status = classifyStatus(statusId);
    const compileOutput = fromBase64(json.compile_output);
    const message = fromBase64(json.message);

    return {
      ok: status === "success",
      status,
      statusText: json.status?.description ?? "Desconhecido",
      stdout: fromBase64(json.stdout),
      stderr: fromBase64(json.stderr) || (status === "internal-error" ? message : ""),
      compileOutput,
      diagnostics: parseDiagnostics(compileOutput, prepared),
      time: json.time != null ? Number(json.time) : null,
      memory: json.memory ?? null,
      exitCode: json.exit_code ?? null,
      wrapped: prepared.wrapped,
    };
  });
