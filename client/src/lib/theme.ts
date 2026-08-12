import { useEffect, useState } from "react";

export const themes = [
  { id: "serene", label: "Serene", swatch: ["#fafbfc", "#3b82f6"] },
  { id: "mongodb", label: "MongoDB", swatch: ["#ffffff", "#00a35c"] },
  { id: "postman-dark", label: "Postman Dark", swatch: ["#262624", "#ff6c37"] },
  { id: "postman-light", label: "Postman Light", swatch: ["#fdfaf8", "#ff6c37"] },
  { id: "vscode", label: "VS Code", swatch: ["#1e2430", "#569cd6"] },
] as const;

export type ThemeId = (typeof themes)[number]["id"];

const STORAGE_KEY = "explorer-theme";

const legacy: Record<string, ThemeId> = { postman: "postman-dark" };

export function useTheme() {
  const [theme, setTheme] = useState<ThemeId>("serene");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = (raw && legacy[raw]) || (raw as ThemeId | null);
    if (saved && themes.some((t) => t.id === saved)) setTheme(saved);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    themes.forEach((t) => root.classList.remove(`theme-${t.id}`));
    root.classList.add(`theme-${theme}`);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return { theme, setTheme };
}
