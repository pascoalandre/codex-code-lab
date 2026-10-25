import { ClipboardPaste, Copy, Scissors, TextSelect } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Diagnostic } from "@/lib/csharp";
import { highlightLines } from "@/lib/highlight";
import { expandSnippet, SNIPPETS } from "@/lib/snippets";
import { cn } from "@/lib/utils";

export type EditorKey = "tab" | "left" | "right" | "up" | "down" | "undo" | "redo";

export interface CodeEditorHandle {
  revealPosition: (line: number, column: number) => void;
  focus: () => void;
  insertText: (text: string) => void;
  key: (k: EditorKey) => void;
}

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  fontSize: number;
  /** Narrow screens: slimmer gutter so code uses all the width. */
  compact?: boolean;
  diagnostics: Diagnostic[];
  onCursorChange?: (line: number, column: number) => void;
  onFocusChange?: (focused: boolean) => void;
  handleRef?: React.MutableRefObject<CodeEditorHandle | null>;
}

const UNIT = "    ";

function lineStartOf(text: string, pos: number) {
  return text.lastIndexOf("\n", pos - 1) + 1;
}
function lineEndOf(text: string, pos: number) {
  const e = text.indexOf("\n", pos);
  return e === -1 ? text.length : e;
}
function lineColOf(text: string, pos: number) {
  let line = 1;
  for (let i = 0; i < pos; i++) if (text.charCodeAt(i) === 10) line++;
  return { line, column: pos - lineStartOf(text, pos) + 1 };
}

/**
 * Plain-text code editor: a native textarea over a highlighted copy of the
 * code. Lines never wrap. Being a real text field, phones show their own
 * select / copy / paste menu on long-press; mouse users get the same menu
 * on right-click or after selecting text.
 */
export default function CodeEditor({
  value,
  onChange,
  fontSize,
  compact = false,
  diagnostics,
  onCursorChange,
  onFocusChange,
  handleRef,
}: CodeEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const pointerType = useRef<string>("mouse");
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [curLine, setCurLine] = useState(1);
  const [focused, setFocused] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number; hasSelection: boolean } | null>(null);

  const lh = Math.round(fontSize * 1.62);
  const padY = compact ? 10 : 14;
  const padX = compact ? 10 : 14;

  const lines = useMemo(() => highlightLines(value), [value]);
  const severityByLine = useMemo(() => {
    const m = new Map<number, "error" | "warning">();
    for (const d of diagnostics) if (m.get(d.line) !== "error") m.set(d.line, d.severity);
    return m;
  }, [diagnostics]);
  const html = useMemo(
    () =>
      lines
        .map((l, i) => {
          const sev = severityByLine.get(i + 1);
          return sev ? `<div class="hl-${sev}">${l}</div>` : `<div>${l}</div>`;
        })
        .join(""),
    [lines, severityByLine],
  );
  const digits = Math.max(2, String(lines.length).length);
  const gutterWidth = `calc(${digits}ch + ${compact ? 14 : 24}px)`;

  const reportCursor = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    const { line, column } = lineColOf(ta.value, ta.selectionEnd);
    setCurLine(line);
    onCursorChange?.(line, column);
  }, [onCursorChange]);

  /** Keeps the caret out from under the sticky line numbers and inside the view. */
  const ensureCaretVisible = useCallback(() => {
    const ta = taRef.current;
    const sc = scrollRef.current;
    if (!ta || !sc) return;
    const pos = ta.selectionEnd;
    const v = ta.value;
    const before = v.slice(lineStartOf(v, pos), pos).replace(/\t/g, UNIT);
    const charW = (measureRef.current?.getBoundingClientRect().width ?? fontSize * 6) / 10;
    const gw = gutterRef.current?.offsetWidth ?? 40;
    const x = gw + padX + before.length * charW;
    if (x - sc.scrollLeft < gw + 4) sc.scrollLeft = Math.max(0, x - gw - 32);
    else if (x - sc.scrollLeft > sc.clientWidth - 12) sc.scrollLeft = x - sc.clientWidth + 48;
    const { line } = lineColOf(v, pos);
    const y = padY + (line - 1) * lh;
    if (y < sc.scrollTop) sc.scrollTop = Math.max(0, y - lh);
    else if (y + lh > sc.scrollTop + sc.clientHeight) sc.scrollTop = y + 2 * lh - sc.clientHeight;
  }, [fontSize, lh, padX, padY]);

  const afterChange = useCallback(() => {
    requestAnimationFrame(() => {
      ensureCaretVisible();
      reportCursor();
    });
  }, [ensureCaretVisible, reportCursor]);

  const insert = useCallback(
    (text: string) => {
      const ta = taRef.current;
      if (!ta) return;
      ta.focus();
      if (!document.execCommand("insertText", false, text)) {
        const s = ta.selectionStart;
        const next = ta.value.slice(0, s) + text + ta.value.slice(ta.selectionEnd);
        onChange(next);
        requestAnimationFrame(() => ta.setSelectionRange(s + text.length, s + text.length));
      }
      afterChange();
    },
    [onChange, afterChange],
  );

  const replaceLines = useCallback(
    (transform: (line: string) => string) => {
      const ta = taRef.current;
      if (!ta) return;
      const v = ta.value;
      const ls = lineStartOf(v, ta.selectionStart);
      const le = lineEndOf(v, Math.max(ta.selectionStart, ta.selectionEnd - (ta.selectionEnd > ta.selectionStart && v[ta.selectionEnd - 1] === "\n" ? 1 : 0)));
      const block = v.slice(ls, le).split("\n").map(transform).join("\n");
      ta.setSelectionRange(ls, le);
      insert(block);
      ta.setSelectionRange(ls, ls + block.length);
    },
    [insert],
  );

  const tab = useCallback(
    (shift = false) => {
      const ta = taRef.current;
      if (!ta) return;
      const v = ta.value;
      const s = ta.selectionStart;
      const e = ta.selectionEnd;
      const multi = v.slice(s, e).includes("\n");
      if (shift || multi) {
        replaceLines((l) => (shift ? l.replace(/^( {1,4}|\t)/, "") : UNIT + l));
        return;
      }
      // Snippet: word right before the cursor.
      const ls = lineStartOf(v, s);
      const word = v.slice(ls, s).match(/([A-Za-z]+)$/)?.[1];
      if (s === e && word && SNIPPETS[word]) {
        const indent = v.slice(ls, s).match(/^\s*/)?.[0] ?? "";
        const { text, cursor } = expandSnippet(SNIPPETS[word], indent);
        const start = s - word.length;
        ta.setSelectionRange(start, s);
        insert(text);
        ta.setSelectionRange(start + cursor, start + cursor);
        afterChange();
        return;
      }
      const col = s - ls;
      insert(" ".repeat(4 - (col % 4)));
    },
    [insert, replaceLines, afterChange],
  );

  const newline = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    const v = ta.value;
    const s = ta.selectionStart;
    const ls = lineStartOf(v, s);
    const indent = v.slice(ls, s).match(/^[ \t]*/)?.[0] ?? "";
    const before = v.slice(ls, s).trimEnd();
    const after = v.slice(ta.selectionEnd, lineEndOf(v, ta.selectionEnd)).trimStart();
    if (before.endsWith("{") && after.startsWith("}")) {
      insert("\n" + indent + UNIT + "\n" + indent);
      const pos = s + 1 + indent.length + UNIT.length;
      ta.setSelectionRange(pos, pos);
      afterChange();
      return;
    }
    insert("\n" + indent + (before.endsWith("{") ? UNIT : ""));
  }, [insert, afterChange]);

  const moveCaret = useCallback(
    (k: "left" | "right" | "up" | "down") => {
      const ta = taRef.current;
      if (!ta) return;
      ta.focus();
      const v = ta.value;
      let p = ta.selectionEnd;
      if (k === "left") p = Math.max(0, p - 1);
      else if (k === "right") p = Math.min(v.length, p + 1);
      else {
        const ls = lineStartOf(v, p);
        const col = p - ls;
        if (k === "up") {
          if (ls === 0) p = 0;
          else {
            const pls = lineStartOf(v, ls - 1);
            p = Math.min(pls + col, ls - 1);
          }
        } else {
          const le = lineEndOf(v, p);
          if (le >= v.length) p = v.length;
          else p = Math.min(le + 1 + col, lineEndOf(v, le + 1));
        }
      }
      ta.setSelectionRange(p, p);
      afterChange();
    },
    [afterChange],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    const mod = e.ctrlKey || e.metaKey;
    setMenu(null);
    if (e.key === "Tab" && !mod && !e.altKey) {
      e.preventDefault();
      tab(e.shiftKey);
    } else if (e.key === "Enter" && !mod && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      newline();
    } else if (e.key === "}" && !mod) {
      const ta = e.currentTarget;
      const s = ta.selectionStart;
      const ls = lineStartOf(ta.value, s);
      const lead = ta.value.slice(ls, s);
      if (s === ta.selectionEnd && /^ {4,}$/.test(lead)) {
        e.preventDefault();
        ta.setSelectionRange(s - 4, s);
        insert("}");
      }
    } else if (mod && e.key === "/") {
      e.preventDefault();
      const ta = e.currentTarget;
      const v = ta.value;
      const block = v.slice(lineStartOf(v, ta.selectionStart), lineEndOf(v, ta.selectionEnd));
      const allCommented = block.split("\n").every((l) => !l.trim() || /^\s*\/\//.test(l));
      replaceLines((l) => (allCommented ? l.replace(/^(\s*)\/\/ ?/, "$1") : l.trim() ? l.replace(/^(\s*)/, "$1// ") : l));
    }
  };

  useEffect(() => {
    if (!handleRef) return;
    handleRef.current = {
      revealPosition: (line, column) => {
        const ta = taRef.current;
        const sc = scrollRef.current;
        if (!ta || !sc) return;
        const v = ta.value;
        let pos = 0;
        for (let l = 1; l < line && pos !== -1; l++) pos = v.indexOf("\n", pos) + 1 || v.length;
        pos = Math.min(pos + column - 1, lineEndOf(v, pos));
        ta.focus({ preventScroll: true });
        ta.setSelectionRange(pos, pos);
        sc.scrollTop = Math.max(0, padY + (line - 1) * lh - sc.clientHeight / 2);
        afterChange();
      },
      focus: () => taRef.current?.focus(),
      insertText: (text) => insert(text),
      key: (k) => {
        if (k === "tab") tab();
        else if (k === "undo" || k === "redo") {
          taRef.current?.focus();
          document.execCommand(k);
          afterChange();
        } else moveCaret(k);
      },
    };
  }, [handleRef, insert, tab, moveCaret, afterChange, lh, padY]);

  // Close the selection menu when the page scrolls or the editor loses focus.
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const sc = scrollRef.current;
    sc?.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
    return () => {
      sc?.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
    };
  }, [menu]);

  useLayoutEffect(() => {
    reportCursor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openMenu = (x: number, y: number) => {
    const ta = taRef.current;
    if (!ta) return;
    setMenu({ x, y, hasSelection: ta.selectionEnd > ta.selectionStart });
  };

  const menuAction = async (action: "cut" | "copy" | "paste" | "selectAll") => {
    const ta = taRef.current;
    if (!ta) return;
    ta.focus();
    const selected = ta.value.slice(ta.selectionStart, ta.selectionEnd);
    setMenu(null);
    if (action === "selectAll") {
      ta.select();
      setTimeout(() => {
        const r = ta.getBoundingClientRect();
        openMenu(r.left + r.width / 2, Math.max(r.top + 8, 64));
      }, 10);
      return;
    }
    if (action === "copy" || action === "cut") {
      let ok = false;
      try {
        ok = document.execCommand(action);
      } catch {
        ok = false;
      }
      if (!ok) {
        await navigator.clipboard?.writeText(selected).catch(() => {});
        if (action === "cut") insert("");
      } else if (action === "cut") afterChange();
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      if (text) insert(text.replace(/\r\n?/g, "\n"));
    } catch {
      toast("Para colar, prima Ctrl+V", { description: "O navegador não deixou ler a área de transferência." });
    }
  };

  const curTop = padY + (curLine - 1) * lh;

  return (
    <div className="relative h-full min-h-0 bg-editor">
      <div
        ref={scrollRef}
        className="code-scroll h-full overflow-auto overscroll-contain"
        style={{ fontSize, lineHeight: `${lh}px`, ["--lh" as string]: `${lh}px` }}
      >
        <div className="relative grid min-h-full w-max min-w-full grid-cols-[auto_1fr]">
          {/* Current line */}
          {focused && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bg-foreground/[0.045]"
              style={{ top: curTop, height: lh }}
            />
          )}
          {/* Line numbers (stay put while scrolling sideways) */}
          <div
            ref={gutterRef}
            aria-hidden
            className="code-font pointer-events-none sticky left-0 z-20 select-none border-r border-border/50 bg-editor text-right text-muted-foreground/45"
            style={{ width: gutterWidth, paddingTop: padY, paddingBottom: padY, paddingRight: compact ? 6 : 10 }}
          >
            {lines.map((_, i) => {
              const sev = severityByLine.get(i + 1);
              return (
                <div
                  key={i}
                  style={{ height: lh }}
                  className={cn(
                    "relative",
                    i + 1 === curLine && focused && "text-foreground/80",
                    sev === "error" && "font-semibold text-destructive",
                    sev === "warning" && "text-warning",
                  )}
                >
                  {sev && <span className="absolute left-1 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-current" />}
                  {i + 1}
                </div>
              );
            })}
          </div>
          {/* Highlighted copy of the code */}
          <pre
            aria-hidden
            className="code-font code-hl pointer-events-none m-0 text-foreground"
            style={{ paddingTop: padY, paddingBottom: `max(${padY}px, 45vh)`, paddingLeft: padX, paddingRight: 56 }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
          {/* The real text field covers the whole editor, so a long-press anywhere opens the phone's menu */}
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              afterChange();
            }}
            onKeyDown={onKeyDown}
            onKeyUp={(e) => {
              if (e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End" || e.key.startsWith("Page")) afterChange();
            }}
            onSelect={reportCursor}
            onFocus={() => {
              setFocused(true);
              onFocusChange?.(true);
            }}
            onBlur={() => {
              setFocused(false);
              setMenu(null);
              onFocusChange?.(false);
            }}
            onPointerDown={(e) => {
              pointerType.current = e.pointerType;
              setMenu(null);
              if (e.pointerType === "mouse" && e.button === 0) {
                const { clientX, clientY } = e;
                pressTimer.current = setTimeout(() => openMenu(clientX, clientY), 600);
              }
            }}
            onPointerMove={() => {
              if (pressTimer.current) clearTimeout(pressTimer.current);
            }}
            onPointerUp={(e) => {
              if (pressTimer.current) clearTimeout(pressTimer.current);
              const ta = e.currentTarget;
              if (e.pointerType === "mouse" && e.button === 0 && ta.selectionEnd > ta.selectionStart) {
                const { clientX, clientY } = e;
                setTimeout(() => openMenu(clientX, clientY - 8), 0);
              }
            }}
            onContextMenu={(e) => {
              // Touch screens: let the phone show its own text menu.
              if (pointerType.current === "touch" || pointerType.current === "pen") return;
              e.preventDefault();
              openMenu(e.clientX, e.clientY);
            }}
            wrap="off"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            data-gramm="false"
            aria-label="Editor de código C#"
            className="code-font code-input absolute inset-0 z-10 m-0 block size-full resize-none overflow-hidden border-0 bg-transparent text-transparent caret-foreground outline-none"
            style={{
              paddingTop: padY,
              paddingBottom: 0,
              paddingRight: 0,
              paddingLeft: `calc(${gutterWidth} + ${padX}px)`,
            }}
          />
          <span ref={measureRef} aria-hidden className="code-font invisible absolute left-0 top-0 whitespace-pre">
            0000000000
          </span>
        </div>
      </div>

      {menu && <SelectionMenu {...menu} onAction={menuAction} />}
    </div>
  );
}

function SelectionMenu({
  x,
  y,
  hasSelection,
  onAction,
}: {
  x: number;
  y: number;
  hasSelection: boolean;
  onAction: (a: "cut" | "copy" | "paste" | "selectAll") => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const left = Math.min(Math.max(8, x - w / 2), window.innerWidth - w - 8);
    const top = y - h - 12 < 8 ? y + 20 : y - h - 12;
    setPos({ left, top });
  }, [x, y]);

  const items = [
    ...(hasSelection
      ? ([
          ["cut", "Cortar", Scissors],
          ["copy", "Copiar", Copy],
        ] as const)
      : []),
    ["paste", "Colar", ClipboardPaste],
    ["selectAll", "Selecionar tudo", TextSelect],
  ] as const;

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Acções de texto"
      className="fixed z-[60] flex animate-in fade-in zoom-in-95 items-stretch overflow-hidden rounded-2xl bg-popover p-1 text-popover-foreground shadow-sheet ring-1 ring-border/60 duration-150"
      style={{ left: pos.left, top: pos.top }}
    >
      {items.map(([id, label]) => (
        <button
          key={id}
          role="menuitem"
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onAction(id)}
          className="whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-colors hover:bg-foreground/8 active:bg-foreground/12"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
