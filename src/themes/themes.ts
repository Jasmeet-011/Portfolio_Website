/** Keep the ids in sync with the theme script in index.html, which runs before paint. */
export const themes = [
  { id: "floodlight", label: "Floodlight", scheme: "dark" },
  { id: "daylight", label: "Daylight", scheme: "light" },
  { id: "high-contrast", label: "High Contrast", scheme: "dark" },
  { id: "solarized-dark", label: "Solarized Dark", scheme: "dark" },
] as const;

export type ThemeId = (typeof themes)[number]["id"];

export const THEME_STORAGE_KEY = "theme";

export const isThemeId = (value: unknown): value is ThemeId =>
  themes.some((theme) => theme.id === value);

export const themeLabel = (id: ThemeId): string =>
  themes.find((theme) => theme.id === id)?.label ?? id;

/** The OS preference: dark goes to Floodlight, light to Daylight. */
export const systemTheme = (): ThemeId =>
  window.matchMedia("(prefers-color-scheme: light)").matches ? "daylight" : "floodlight";
