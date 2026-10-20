/**
 * Pure helpers for preparing C# source for the Mono compiler and
 * interpreting its output. No browser or server APIs here.
 */

export const IMPLICIT_USINGS = [
  "System",
  "System.Collections.Generic",
  "System.IO",
  "System.Linq",
  "System.Text",
  "System.Threading.Tasks",
];

const MAIN_RE = /\bstatic\s+(?:async\s+)?(?:void|int|Task(?:\s*<\s*int\s*>)?)\s+Main\s*\(/;
const NAMESPACE_RE = /^\s*namespace\s+[\w.]+/m;
const TYPE_DECL_RE =
  /^\s*(?:\[[^\]]*\]\s*)?(?:(?:public|internal|private|protected|static|abstract|sealed|partial|readonly)\s+)*(?:class|struct|interface|enum)\s+\w/;
const USING_DIRECTIVE_RE = /^using\s+(?:static\s+)?([\w.]+)\s*;/;
const STATIC_LOCAL_FN_RE = /^(\s*)static\s+(?=[\w<>[\],.?]+\s+\w+\s*\()/;

export const WRAPPER_HEADER =
  "public static class __CodexProgram { public static void Main(string[] args) { ";
const WRAPPER_CLOSE = "} } ";

export interface PreparedSource {
  source: string;
  /** True when top-level statements were wrapped into a generated Main. */
  wrapped: boolean;
  /** 1-based line -> number of characters inserted at the start of that line. */
  columnShift: Record<number, number>;
  /** Number of lines in the original code. */
  lineCount: number;
}

/** Remove string/char literals and comments so brace counting is reliable enough. */
function stripLiteralsAndComments(line: string): string {
  return line
    .replace(/@"(?:[^"]|"")*"/g, '""')
    .replace(/\$?"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)'/g, "''")
    .replace(/\/\/.*$/, "");
}

function braceDelta(line: string): number {
  const clean = stripLiteralsAndComments(line);
  let d = 0;
  for (const ch of clean) {
    if (ch === "{") d++;
    else if (ch === "}") d--;
  }
  return d;
}

/**
 * Accepts either a classic program (with Main) or modern top-level statements.
 * Top-level statements are wrapped into a generated Main while preserving line
 * numbers, so compiler diagnostics still point to the user's lines.
 */
export function prepareSource(code: string): PreparedSource {
  const normalized = code.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  const lineCount = lines.length;

  if (MAIN_RE.test(normalized) || NAMESPACE_RE.test(normalized)) {
    return { source: normalized, wrapped: false, columnShift: {}, lineCount };
  }

  const existing = new Set<string>();
  let first = 0;
  let inBlockComment = false;
  while (first < lines.length) {
    const t = lines[first].trim();
    if (inBlockComment) {
      if (t.includes("*/")) inBlockComment = false;
      first++;
      continue;
    }
    if (t === "" || t.startsWith("//")) {
      first++;
      continue;
    }
    if (t.startsWith("/*")) {
      if (!t.includes("*/")) inBlockComment = true;
      first++;
      continue;
    }
    const m = t.match(USING_DIRECTIVE_RE);
    if (m) {
      existing.add(m[1]);
      first++;
      continue;
    }
    break;
  }

  // Find the first top-level type declaration after the statements start.
  let typeLine = -1;
  let depth = 0;
  for (let j = first; j < lines.length; j++) {
    if (depth === 0 && TYPE_DECL_RE.test(lines[j])) {
      typeLine = j;
      break;
    }
    depth += braceDelta(lines[j]);
  }

  const out = [...lines];
  const shift: Record<number, number> = {};
  const addShift = (idx: number, n: number) => {
    shift[idx + 1] = (shift[idx + 1] ?? 0) + n;
  };

  const end = typeLine === -1 ? lines.length : typeLine;

  // `static` local functions are C# 8+; Mono supports plain local functions.
  let d = 0;
  for (let j = first; j < end; j++) {
    if (d === 0) {
      const before = out[j];
      out[j] = out[j].replace(STATIC_LOCAL_FN_RE, "$1");
      if (out[j].length !== before.length) addShift(j, out[j].length - before.length);
    }
    d += braceDelta(lines[j]);
  }

  if (first >= lines.length) {
    out.push(WRAPPER_HEADER + WRAPPER_CLOSE);
  } else if (end === first) {
    out[first] = WRAPPER_HEADER + WRAPPER_CLOSE + out[first];
    addShift(first, WRAPPER_HEADER.length + WRAPPER_CLOSE.length);
  } else {
    out[first] = WRAPPER_HEADER + out[first];
    addShift(first, WRAPPER_HEADER.length);
    if (typeLine === -1) {
      out.push(WRAPPER_CLOSE.trim());
    } else {
      out[typeLine] = WRAPPER_CLOSE + out[typeLine];
      addShift(typeLine, WRAPPER_CLOSE.length);
    }
  }

  const missing = IMPLICIT_USINGS.filter((u) => !existing.has(u))
    .map((u) => `using ${u};`)
    .join(" ");
  if (missing) {
    out[0] = `${missing} ${out[0]}`;
    addShift(0, missing.length + 1);
  }

  return { source: out.join("\n"), wrapped: true, columnShift: shift, lineCount };
}

export type Severity = "error" | "warning";

export interface Diagnostic {
  line: number;
  column: number;
  severity: Severity;
  code: string;
  message: string;
  hint?: string;
}

const HINTS: Record<string, string> = {
  CS1002: "Falta um ponto e vírgula (;) no fim da instrução.",
  CS1513: "Falta fechar um bloco com chaveta (}).",
  CS1514: "Falta abrir um bloco com chaveta ({).",
  CS1026: "Falta fechar um parêntese ()).",
  CS1525: "Símbolo inesperado — verifique a sintaxe próxima desta linha.",
  CS0103: "Este nome não existe aqui. Verifique se a variável foi declarada e se o nome está correcto.",
  CS0246: "Tipo ou namespace não encontrado. Falta um 'using' ou o nome está errado?",
  CS0029: "Conversão implícita impossível entre estes tipos. Use Convert, Parse ou um cast.",
  CS0266: "Conversão explícita necessária (cast), por exemplo (int)valor.",
  CS0019: "Este operador não pode ser usado com estes tipos.",
  CS0161: "Nem todos os caminhos do método devolvem um valor (return).",
  CS0165: "Variável usada antes de receber um valor.",
  CS1061: "Este tipo não possui o membro indicado. Verifique maiúsculas/minúsculas.",
  CS0117: "O tipo não contém esta definição.",
  CS0128: "Já existe uma variável com este nome neste escopo.",
  CS0136: "Conflito de nomes com uma variável de um escopo exterior.",
  CS1503: "O argumento passado não tem o tipo esperado.",
  CS1501: "Nenhuma sobrecarga do método aceita esse número de argumentos.",
  CS0120: "Membro de instância usado num contexto estático. Crie um objecto ou marque como static.",
  CS0501: "O método precisa de um corpo { } ou de ser abstract/extern.",
  CS0219: "Variável atribuída mas nunca utilizada.",
  CS0168: "Variável declarada mas nunca utilizada.",
  CS0105: "Directiva 'using' repetida.",
  CS0122: "Membro inacessível devido ao nível de protecção (private?).",
  CS0234: "O namespace não contém este tipo ou namespace.",
  CS8025: "Funcionalidade não suportada nesta versão do compilador.",
};

const DIAG_RE = /Main\.cs\((\d+),(\d+)\+?\):\s*(error|warning)\s+(CS\d+):\s*(.+)/g;

export function parseDiagnostics(
  output: string | null | undefined,
  prepared?: Pick<PreparedSource, "columnShift" | "lineCount">,
): Diagnostic[] {
  if (!output) return [];
  const result: Diagnostic[] = [];
  for (const m of output.matchAll(DIAG_RE)) {
    let line = Number(m[1]);
    let column = Number(m[2]);
    if (prepared) {
      if (line > prepared.lineCount) line = prepared.lineCount;
      column = Math.max(1, column - (prepared.columnShift[line] ?? 0));
    }
    const code = m[4];
    result.push({
      line,
      column,
      severity: m[3] as Severity,
      code,
      message: m[5].trim(),
      hint: HINTS[code],
    });
  }
  return result;
}

function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

/** Whether the program reads from standard input. */
export function needsInput(code: string): boolean {
  return /Console\s*\.\s*(?:ReadLine|Read|ReadKey|In\s*\.)\s*\(?/.test(stripComments(code));
}

/** Rough count of read calls — used to hint how many input lines to provide. */
export function countInputCalls(code: string): number {
  return (stripComments(code).match(/Console\s*\.\s*(?:ReadLine|Read|ReadKey)\s*\(/g) ?? []).length;
}

export type RunStatus =
  | "success"
  | "compile-error"
  | "runtime-error"
  | "timeout"
  | "internal-error";

/** Maps execution engine status ids to app statuses. */
export function classifyStatus(id: number): RunStatus {
  if (id === 3) return "success";
  if (id === 6) return "compile-error";
  if (id === 5) return "timeout";
  if (id >= 7 && id <= 12) return "runtime-error";
  return "internal-error";
}

export const STATUS_LABEL: Record<RunStatus, string> = {
  success: "Executado com sucesso",
  "compile-error": "Erro de compilação",
  "runtime-error": "Erro em tempo de execução",
  timeout: "Tempo limite excedido",
  "internal-error": "Falha no servidor de execução",
};
