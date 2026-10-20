/** What this build of the site is. Shown in Settings and Help > About. */
export const buildInfo = {
  version: `v${__APP_VERSION__}`,
  commit: __COMMIT__,
  date: __BUILD_DATE__,
  stack: ["Vite", "React 18", "TypeScript", "Tailwind CSS", "Zustand", "cmdk", "Shiki"],
} as const;
