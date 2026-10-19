import { create } from "zustand";
import { isThemeId, systemTheme, THEME_STORAGE_KEY, type ThemeId } from "@/themes/themes";

function storedTheme(): ThemeId | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(value) ? value : null;
  } catch {
    return null;
  }
}

function apply(theme: ThemeId) {
  document.documentElement.dataset.theme = theme;
}

interface ThemeState {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

export const useTheme = create<ThemeState>((set) => ({
  theme: storedTheme() ?? systemTheme(),
  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage can be blocked. The theme still applies for this visit.
    }
    apply(theme);
    set({ theme });
  },
}));

// Until the visitor picks a theme, follow the OS preference live.
window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
  if (storedTheme()) return;
  const theme = systemTheme();
  apply(theme);
  useTheme.setState({ theme });
});
