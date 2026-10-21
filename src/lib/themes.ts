export type ThemeFamily = "codex" | "vscode" | "dracula";
export type ThemeMode = "dark" | "light";

export type ThemeId =
  | "codex-dark"
  | "codex-light"
  | "vscode-dark"
  | "vscode-light"
  | "dracula"
  | "alucard";

export interface ThemeDef {
  id: ThemeId;
  family: ThemeFamily;
  mode: ThemeMode;
  label: string;
  /** Monaco theme name registered in the editor */
  monaco: string;
  /** Swatch colors for pickers (hex, used only for preview chips) */
  swatch: [string, string, string, string];
}

export const THEMES: ThemeDef[] = [
  { id: "codex-dark", family: "codex", mode: "dark", label: "Codex Noite", monaco: "codex-dark", swatch: ["#0f1115", "#c6f432", "#c792ea", "#7fdbca"] },
  { id: "codex-light", family: "codex", mode: "light", label: "Codex Dia", monaco: "codex-light", swatch: ["#f7f6f2", "#4d7c0f", "#7c3aed", "#0e7490"] },
  { id: "vscode-dark", family: "vscode", mode: "dark", label: "VS Code Dark+", monaco: "vscode-dark", swatch: ["#1e1e1e", "#007acc", "#569cd6", "#4ec9b0"] },
  { id: "vscode-light", family: "vscode", mode: "light", label: "VS Code Light+", monaco: "vscode-light", swatch: ["#ffffff", "#007acc", "#0000ff", "#267f99"] },
  { id: "dracula", family: "dracula", mode: "dark", label: "Drácula", monaco: "dracula", swatch: ["#282a36", "#bd93f9", "#ff79c6", "#50fa7b"] },
  { id: "alucard", family: "dracula", mode: "light", label: "Drácula Claro", monaco: "alucard", swatch: ["#fffbeb", "#644ac9", "#a3144d", "#14710a"] },
];

export const FAMILIES: { id: ThemeFamily; label: string; description: string }[] = [
  { id: "codex", label: "Codex", description: "A identidade original do C# Codex" },
  { id: "vscode", label: "VS Code", description: "Familiar para quem vem do Visual Studio Code" },
  { id: "dracula", label: "Drácula", description: "O clássico tema de alto contraste" },
];

export const DEFAULT_THEME: ThemeId = "codex-dark";
export const THEME_STORAGE_KEY = "codex-theme";

export function getTheme(id: string | null | undefined): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!;
}

export function themeFor(family: ThemeFamily, mode: ThemeMode): ThemeDef {
  return THEMES.find((t) => t.family === family && t.mode === mode) ?? THEMES[0]!;
}

/** Inline script run before paint so the stored theme applies without a flash. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}')||'${DEFAULT_THEME}';var l=['codex-light','vscode-light','alucard'].indexOf(t)>-1;var d=document.documentElement;d.setAttribute('data-theme',t);d.classList.add(l?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','${DEFAULT_THEME}');document.documentElement.classList.add('dark');}})();`;

/** Editor palettes (Monaco needs hex). Mirrors the CSS tokens in styles.css. */
export const EDITOR_PALETTES: Record<
  ThemeId,
  {
    base: "vs" | "vs-dark";
    bg: string;
    fg: string;
    lineHighlight: string;
    selection: string;
    gutter: string;
    cursor: string;
    keyword: string;
    control: string;
    typeKw: string;
    type: string;
    fn: string;
    string: string;
    number: string;
    comment: string;
    punct: string;
  }
> = {
  "codex-dark": { base: "vs-dark", bg: "#0f1115", fg: "#eceae4", lineHighlight: "#171a20", selection: "#c6f43233", gutter: "#4b5260", cursor: "#c6f432", keyword: "#c792ea", control: "#c792ea", typeKw: "#82aaff", type: "#7fdbca", fn: "#ffcb6b", string: "#c6f432", number: "#f78c6c", comment: "#5c6573", punct: "#a6accd" },
  "codex-light": { base: "vs", bg: "#fbfaf7", fg: "#16181d", lineHighlight: "#f2f1ec", selection: "#4d7c0f26", gutter: "#a3a7ae", cursor: "#4d7c0f", keyword: "#7c3aed", control: "#7c3aed", typeKw: "#2563eb", type: "#0e7490", fn: "#a16207", string: "#3f7d0a", number: "#c2410c", comment: "#8a8f98", punct: "#4b5563" },
  "vscode-dark": { base: "vs-dark", bg: "#1e1e1e", fg: "#d4d4d4", lineHighlight: "#2a2d2e", selection: "#264f78", gutter: "#858585", cursor: "#aeafad", keyword: "#569cd6", control: "#c586c0", typeKw: "#569cd6", type: "#4ec9b0", fn: "#dcdcaa", string: "#ce9178", number: "#b5cea8", comment: "#6a9955", punct: "#d4d4d4" },
  "vscode-light": { base: "vs", bg: "#ffffff", fg: "#000000", lineHighlight: "#f5f5f5", selection: "#add6ff", gutter: "#237893", cursor: "#000000", keyword: "#0000ff", control: "#af00db", typeKw: "#0000ff", type: "#267f99", fn: "#795e26", string: "#a31515", number: "#098658", comment: "#008000", punct: "#000000" },
  dracula: { base: "vs-dark", bg: "#282a36", fg: "#f8f8f2", lineHighlight: "#44475a66", selection: "#44475a", gutter: "#6272a4", cursor: "#f8f8f2", keyword: "#ff79c6", control: "#ff79c6", typeKw: "#8be9fd", type: "#8be9fd", fn: "#50fa7b", string: "#f1fa8c", number: "#bd93f9", comment: "#6272a4", punct: "#f8f8f2" },
  alucard: { base: "vs", bg: "#fffbeb", fg: "#1f1f1f", lineHighlight: "#f4efd8", selection: "#cfcfde", gutter: "#9a9478", cursor: "#1f1f1f", keyword: "#a3144d", control: "#a3144d", typeKw: "#036a96", type: "#036a96", fn: "#14710a", string: "#846e15", number: "#644ac9", comment: "#6c664b", punct: "#1f1f1f" },
};
