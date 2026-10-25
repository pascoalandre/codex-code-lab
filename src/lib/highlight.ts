/**
 * Small C# highlighter for the plain-text editor. Produces one HTML string per
 * line (escaped), with token classes styled in styles.css (.tk-*).
 */

const KEYWORDS = new Set(
  (
    "abstract as base break case catch checked class const continue default delegate do else enum event explicit extern " +
    "false finally fixed for foreach goto if implicit in interface internal is lock namespace new null operator out " +
    "override params private protected public readonly ref return sealed sizeof stackalloc static struct switch this " +
    "throw true try typeof unchecked unsafe using virtual volatile while var async await record init with when and or " +
    "not get set value yield global partial where nameof required file"
  ).split(" "),
);

const TYPE_KEYWORDS = new Set(
  "bool byte char decimal double float int long object sbyte short string uint ulong ushort void dynamic nint nuint".split(" "),
);

type Tok = "c" | "s" | "n" | "k" | "t" | "f" | "p" | "d" | "";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const NUM_RE = /^(?:0[xX][\da-fA-F_]+|0[bB][01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)[fFdDmMuUlL]*/;
const IDENT_RE = /^@?[A-Za-z_\u00C0-\u024F][\w\u00C0-\u024F]*/;

export function highlightLines(code: string): string[] {
  const lines: string[] = [""];
  const emit = (tok: Tok, text: string) => {
    const parts = text.split("\n");
    parts.forEach((part, idx) => {
      if (idx > 0) lines.push("");
      if (!part) return;
      lines[lines.length - 1] += tok ? `<span class="tk-${tok}">${esc(part)}</span>` : esc(part);
    });
  };

  const n = code.length;
  let i = 0;
  let lineStart = true;
  while (i < n) {
    const c = code[i]!;
    const nx = code[i + 1];

    if (c === "\n") {
      emit("", "\n");
      i++;
      lineStart = true;
      continue;
    }
    if (c === " " || c === "\t" || c === "\r") {
      let j = i + 1;
      while (j < n && (code[j] === " " || code[j] === "\t" || code[j] === "\r")) j++;
      emit("", code.slice(i, j));
      i = j;
      continue;
    }
    if (lineStart && c === "#") {
      const e = code.indexOf("\n", i);
      const end = e === -1 ? n : e;
      emit("d", code.slice(i, end));
      i = end;
      continue;
    }
    lineStart = false;

    if (c === "/" && nx === "/") {
      const e = code.indexOf("\n", i);
      const end = e === -1 ? n : e;
      emit("c", code.slice(i, end));
      i = end;
      continue;
    }
    if (c === "/" && nx === "*") {
      const e = code.indexOf("*/", i + 2);
      const end = e === -1 ? n : e + 2;
      emit("c", code.slice(i, end));
      i = end;
      continue;
    }
    // Verbatim strings: @"..." $@"..." @$"..."
    const verbatim = (c === "@" && nx === '"') || ((c === "$" || c === "@") && (nx === "@" || nx === "$") && code[i + 2] === '"');
    if (verbatim) {
      let j = code.indexOf('"', i) + 1;
      while (j < n) {
        if (code[j] === '"') {
          if (code[j + 1] === '"') {
            j += 2;
            continue;
          }
          j++;
          break;
        }
        j++;
      }
      emit("s", code.slice(i, j));
      i = j;
      continue;
    }
    if (c === '"' || (c === "$" && nx === '"')) {
      let j = c === "$" ? i + 2 : i + 1;
      while (j < n && code[j] !== '"' && code[j] !== "\n") j += code[j] === "\\" ? 2 : 1;
      j = Math.min(n, code[j] === '"' ? j + 1 : j);
      emit("s", code.slice(i, j));
      i = j;
      continue;
    }
    if (c === "'") {
      let j = i + 1;
      while (j < n && code[j] !== "'" && code[j] !== "\n" && j - i < 12) j += code[j] === "\\" ? 2 : 1;
      j = Math.min(n, code[j] === "'" ? j + 1 : j);
      emit("s", code.slice(i, j));
      i = j;
      continue;
    }
    if (c >= "0" && c <= "9") {
      const m = code.slice(i, i + 80).match(NUM_RE);
      if (m) {
        emit("n", m[0]);
        i += m[0].length;
        continue;
      }
    }
    const id = code.slice(i, i + 120).match(IDENT_RE);
    if (id) {
      const w = id[0];
      const bare = w.startsWith("@") ? w.slice(1) : w;
      let tok: Tok = "";
      if (!w.startsWith("@") && KEYWORDS.has(bare)) tok = "k";
      else if (TYPE_KEYWORDS.has(bare)) tok = "t";
      else {
        let j = i + w.length;
        while (code[j] === " ") j++;
        if (code[j] === "(") tok = "f";
        else if (/^[A-Z]/.test(bare)) tok = "t";
      }
      emit(tok, w);
      i += w.length;
      continue;
    }
    emit("p", c);
    i++;
  }
  return lines;
}
