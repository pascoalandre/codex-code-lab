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
  wordWrap: boolean;
  minimap: boolean;
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
  wordWrap,
  minimap,
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
        fontLigatures: true,
        fontSize,
        lineHeight: Math.round(fontSize * 1.65),
        minimap: { enabled: minimap, renderCharacters: false, scale: 1 },
        wordWrap: wordWrap ? "on" : "off",
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        renderLineHighlight: "all",
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: "active", indentation: true },
        padding: { top: 14, bottom: 14 },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true,
        stickyScroll: { enabled: true },
        suggest: { showWords: true, preview: true },
        quickSuggestions: { other: true, comments: false, strings: false },
        formatOnPaste: false,
        fixedOverflowWidgets: true,
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
      }}
    />
  );
}
