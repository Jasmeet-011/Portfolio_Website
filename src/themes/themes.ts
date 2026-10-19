/** Keep the ids in sync with the theme script in index.html, which runs before paint. */
export const themes = [
  { id: "workspace-blue", label: "Workspace Blue", scheme: "dark" },
  { id: "daylight", label: "Daylight", scheme: "light" },
  { id: "floodlight", label: "Floodlight", scheme: "dark" },
  { id: "high-contrast", label: "High Contrast", scheme: "dark" },
  { id: "solarized-dark", label: "Solarized Dark", scheme: "dark" },
] as const;

export type ThemeId = (typeof themes)[number]["id"];

export const THEME_STORAGE_KEY = "theme";

export const isThemeId = (value: unknown): value is ThemeId =>
  themes.some((theme) => theme.id === value);

export const themeLabel = (id: ThemeId): string =>
  themes.find((theme) => theme.id === id)?.label ?? id;

/**
 * The OS preference: light goes to Daylight, dark to Workspace Blue. Browsers report
 * "no preference" as light (the no-preference value was dropped from the spec), so it
 * cannot be told apart from an explicit light setting.
 */
export const systemTheme = (): ThemeId =>
  window.matchMedia("(prefers-color-scheme: light)").matches ? "daylight" : "workspace-blue";
