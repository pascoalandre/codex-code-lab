import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { useEffect, useRef } from "react";
import type { Diagnostic } from "@/lib/csharp";
import type { ThemeId } from "@/lib/themes";
import { EditorSkeleton } from "./EditorSkeleton";
import { LANGUAGE_ID, setupMonaco } from "./monaco-setup";

export interface CodeEditorHandle {
  revealPosition: (line: number, column: number) => void;
  focus: () => void;
  insertText: (text: string) => void;
}

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  themeId: ThemeId;
  fontSize: number;
  minimap: boolean;
  /** Narrow screens: slimmer gutter so code uses all the width. */
  compact?: boolean;
  diagnostics: Diagnostic[];
  onRun: () => void;
  onSave: () => void;
  onCursorChange?: (line: number, column: number) => void;
  handleRef?: React.MutableRefObject<CodeEditorHandle | null>;
}

export default function CodeEditor({
  value,
  onChange,
  themeId,
  fontSize,
  minimap,
  compact = false,
  diagnostics,
  onRun,
  onSave,
  onCursorChange,
  handleRef,
}: CodeEditorProps) {
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const runRef = useRef(onRun);
  const saveRef = useRef(onSave);
  runRef.current = onRun;
  saveRef.current = onSave;

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    monaco.editor.setTheme(themeId);

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current());
    editor.addCommand(monaco.KeyCode.F5, () => runRef.current());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => saveRef.current());

    editor.onDidChangeCursorPosition((e) => onCursorChange?.(e.position.lineNumber, e.position.column));

    if (handleRef) {
      handleRef.current = {
        revealPosition: (line, column) => {
          editor.revealLineInCenter(line);
          editor.setPosition({ lineNumber: line, column });
          editor.focus();
        },
        focus: () => editor.focus(),
        insertText: (text) => {
          const sel = editor.getSelection();
          if (!sel) return;
          editor.executeEdits("codex", [{ range: sel, text, forceMoveMarkers: true }]);
          editor.focus();
        },
      };
    }
  };

  useEffect(() => {
    monacoRef.current?.editor.setTheme(themeId);
  }, [themeId]);

  // The editor owns its text while typing (uncontrolled). Only push a new
  // value in when it came from outside (example loaded, project opened),
  // never echo back our own keystrokes — that drops characters and moves the
  // cursor when typing fast.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (value === lastEmittedRef.current) return;
    const model = editor.getModel();
    if (!model || model.getValue() === value) return;
    lastEmittedRef.current = value;
    editor.executeEdits("external", [{ range: model.getFullModelRange(), text: value }]);
    editor.setPosition({ lineNumber: 1, column: 1 });
  }, [value]);

  useEffect(() => {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();
    if (!monaco || !model) return;
    monaco.editor.setModelMarkers(
      model,
      "csharp-codex",
      diagnostics.map((d) => {
        const lineLen = model.getLineMaxColumn(Math.min(d.line, model.getLineCount()));
        return {
          startLineNumber: d.line,
          startColumn: d.column,
          endLineNumber: d.line,
          endColumn: Math.max(d.column + 1, lineLen),
          message: `${d.code}: ${d.message}${d.hint ? `\n💡 ${d.hint}` : ""}`,
          severity: d.severity === "error" ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
        };
      }),
    );
  }, [diagnostics]);

  return (
    <Editor
      height="100%"
      language={LANGUAGE_ID}
      value={value}
      theme={themeId}
      beforeMount={setupMonaco}
      onMount={handleMount}
      onChange={(v) => onChange(v ?? "")}
      loading={<EditorSkeleton />}
      options={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontLigatures: false,
        fontSize,
        lineHeight: Math.round(fontSize * 1.65),
        minimap: { enabled: minimap, renderCharacters: false, scale: 1 },
        // Never wrap or break lines: long lines scroll sideways.
        wordWrap: "off",
        wordWrapOverride1: "off",
        wordWrapOverride2: "off",
        // Enter always makes a plain new line; suggestions are accepted with Tab or a tap.
        acceptSuggestionOnEnter: "off",
        acceptSuggestionOnCommitCharacter: false,
        autoIndent: "advanced",
        formatOnType: false,
        lineNumbersMinChars: compact ? 2 : 3,
        lineDecorationsWidth: compact ? 6 : 10,
        glyphMargin: false,
        folding: !compact,
        overviewRulerLanes: compact ? 0 : 2,
        hideCursorInOverviewRuler: true,
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        renderLineHighlight: "all",
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: "active", indentation: true },
        padding: { top: compact ? 8 : 14, bottom: compact ? 8 : 14 },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true,
        stickyScroll: { enabled: !compact },
        suggest: { showWords: true, preview: true },
        quickSuggestions: { other: true, comments: false, strings: false },
        formatOnPaste: false,
        fixedOverflowWidgets: true,
        scrollbar: {
          verticalScrollbarSize: compact ? 6 : 10,
          horizontalScrollbarSize: compact ? 6 : 10,
          alwaysConsumeMouseWheel: false,
        },
      }}
    />
  );
}
