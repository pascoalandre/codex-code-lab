import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_THEME,
  getTheme,
  THEME_STORAGE_KEY,
  themeFor,
  type ThemeDef,
  type ThemeFamily,
  type ThemeId,
} from "@/lib/themes";

interface ThemeContextValue {
  theme: ThemeDef;
  setTheme: (id: ThemeId) => void;
  setFamily: (family: ThemeFamily) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(t: ThemeDef) {
  const el = document.documentElement;
  el.setAttribute("data-theme", t.id);
  el.classList.toggle("dark", t.mode === "dark");
  el.classList.toggle("light", t.mode === "light");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeDef>(() => getTheme(DEFAULT_THEME));

  // Read the stored theme after hydration (the inline head script already painted it).
  useEffect(() => {
    try {
      setThemeState(getTheme(localStorage.getItem(THEME_STORAGE_KEY)));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    const t = getTheme(id);
    setThemeState(t);
    applyTheme(t);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t.id);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      setFamily: (family) => setTheme(themeFor(family, theme.mode).id),
      toggleMode: () => setTheme(themeFor(theme.family, theme.mode === "dark" ? "light" : "dark").id),
    }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
