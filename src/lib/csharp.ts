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
const FN_DECL_RE =
  /^\s*(?:static\s+)?(?:async\s+)?(?!(?:return|new|await|throw|else|var|using|yield|goto|case|const|if|while|for|foreach|switch|lock)\b)[A-Za-z_][\w.]*(?:\s*<[^>()]*>)?(?:\[\s*,*\s*\])*\??\s+[A-Za-z_]\w*\s*\(/;

export interface PreparedSource {
  source: string;
  /** True when top-level statements were wrapped into a generated Main. */
  wrapped: boolean;
  /** Generated line (1-based) -> original line (1-based). Empty when not wrapped. */
  lineMap: number[];
  /** Generated line (1-based) -> number of characters inserted at its start. */
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

function isFunctionDecl(line: string): boolean {
  if (!FN_DECL_RE.test(line)) return false;
  const clean = stripLiteralsAndComments(line).trim();
  // A declaration has no assignment before its parameter list.
  const paren = clean.indexOf("(");
  if (clean.slice(0, paren).includes("=")) return false;
  return clean.includes("=>") || clean.endsWith("{") || clean.endsWith(")");
}

/**
 * Accepts either a classic program (with Main) or modern top-level statements.
 * Top-level statements go into a generated Main, top-level functions become
 * static methods and types stay at file level. A line map keeps compiler
 * diagnostics pointing at the user's original lines.
 */
export function prepareSource(code: string): PreparedSource {
  const normalized = code.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  const lineCount = lines.length;

  if (MAIN_RE.test(normalized) || NAMESPACE_RE.test(normalized)) {
    return { source: normalized, wrapped: false, lineMap: [], columnShift: {}, lineCount };
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

  const statements: number[] = [];
  const functions: number[][] = [];
  const types: number[] = [];

  let depth = 0;
  let j = first;
  while (j < lines.length) {
    if (depth === 0 && TYPE_DECL_RE.test(lines[j])) {
      for (let k = j; k < lines.length; k++) types.push(k);
      break;
    }
    if (depth === 0 && isFunctionDecl(lines[j])) {
      const span: number[] = [];
      let d = 0;
      let opened = false;
      const arrow = stripLiteralsAndComments(lines[j]).includes("=>");
      let k = j;
      for (; k < lines.length; k++) {
        span.push(k);
        const delta = braceDelta(lines[k]);
        if (stripLiteralsAndComments(lines[k]).includes("{")) opened = true;
        d += delta;
        const clean = stripLiteralsAndComments(lines[k]).trim();
        if (arrow && !opened && clean.endsWith(";")) break;
        if (opened && d <= 0) break;
      }
      functions.push(span);
      j = k + 1;
      continue;
    }
    statements.push(j);
    depth += braceDelta(lines[j]);
    j++;
  }

  const out: string[] = [];
  const lineMap: number[] = [];
  const columnShift: Record<number, number> = {};
  const emit = (text: string, orig: number, shift = 0) => {
    out.push(text);
    lineMap.push(orig + 1);
    if (shift) columnShift[out.length] = shift;
  };

  for (let k = 0; k < first; k++) emit(lines[k], k);
  for (const u of IMPLICIT_USINGS) if (!existing.has(u)) emit(`using ${u};`, 0);
  const anchor = statements[0] ?? first;
  emit("public static partial class __CodexProgram {", anchor);
  emit("public static void Main(string[] args) {", anchor);
  for (const k of statements) emit(lines[k], k);
  emit("}", Math.max(0, (statements.at(-1) ?? anchor)));
  for (const span of functions) {
    span.forEach((k, idx) => {
      if (idx === 0 && !/^\s*static\b/.test(lines[k])) {
        emit("static " + lines[k], k, 7);
      } else emit(lines[k], k);
    });
  }
  emit("}", Math.min(lines.length - 1, Math.max(0, (types[0] ?? lines.length) - 1)));
  for (const k of types) emit(lines[k], k);

  return { source: out.join("\n"), wrapped: true, lineMap, columnShift, lineCount };
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
  prepared?: Pick<PreparedSource, "columnShift" | "lineCount" | "lineMap">,
): Diagnostic[] {
  if (!output) return [];
  const result: Diagnostic[] = [];
  for (const m of output.matchAll(DIAG_RE)) {
    let line = Number(m[1]);
    let column = Number(m[2]);
    if (prepared) {
      column = Math.max(1, column - (prepared.columnShift[line] ?? 0));
      if (prepared.lineMap.length) line = prepared.lineMap[Math.min(line, prepared.lineMap.length) - 1];
      line = Math.min(Math.max(1, line), prepared.lineCount);
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

const NUMBER_AT = /^(?:0[xXbB][0-9a-fA-F_]+|[0-9][0-9_]*(?:\.[0-9][0-9_]*)?(?:[eE][+-]?[0-9_]+)?)/;

/**
 * Mono's compiler mis-reads digit separators (1_000 → wrong value), so they are
 * removed from numeric literals. Strings and comments are left untouched.
 */
export function stripDigitSeparators(src: string): string {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const nx = src[i + 1];
    if (c === "/" && nx === "/") {
      const e = src.indexOf("\n", i);
      const end = e === -1 ? n : e;
      out += src.slice(i, end);
      i = end;
      continue;
    }
    if (c === "/" && nx === "*") {
      const e = src.indexOf("*/", i + 2);
      const end = e === -1 ? n : e + 2;
      out += src.slice(i, end);
      i = end;
      continue;
    }
    const verbatim =
      (c === "@" && nx === '"') ||
      ((c === "$" || c === "@") && (nx === "@" || nx === "$") && src[i + 2] === '"');
    if (verbatim) {
      let j = src.indexOf('"', i) + 1;
      while (j < n) {
        if (src[j] === '"') {
          if (src[j + 1] === '"') {
            j += 2;
            continue;
          }
          j++;
          break;
        }
        j++;
      }
      out += src.slice(i, j);
      i = j;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && src[j] !== c && src[j] !== "\n") j += src[j] === "\\" ? 2 : 1;
      out += src.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (c >= "0" && c <= "9" && !/[\w]/.test(src[i - 1] ?? "")) {
      const m = src.slice(i, i + 64).match(NUMBER_AT);
      if (m) {
        out += m[0].replace(/_/g, "");
        i += m[0].length;
        continue;
      }
    }
    out += c;
    i++;
  }
  return out;
}

/** Final transformation applied right before sending source to the compiler. */
export function toCompilerSource(prepared: string): string {
  // A UTF-8 BOM makes Mono read emoji and other non-BMP characters correctly.
  return "\uFEFF" + stripDigitSeparators(prepared);
}
