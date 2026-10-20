import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const ZOOM_MIN = 0.8;
export const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;

const clampZoom = (z: number) => Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)) * 10) / 10;

/** Marks the page so CSS can drop motion even when the OS doesn't ask for it. */
function applyMotion(reduce: boolean) {
  if (reduce) document.documentElement.dataset.motion = "reduce";
  else delete document.documentElement.dataset.motion;
}

interface PreferencesState {
  /** Workspace zoom, separate from browser zoom (which stays the browser's). */
  zoom: number;
  /** Reduce motion even when the OS doesn't ask for it. */
  reduceMotion: boolean;
  zoomBy: (steps: number) => void;
  resetZoom: () => void;
  setReduceMotion: (reduce: boolean) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      zoom: 1,
      reduceMotion: false,
      zoomBy: (steps) => set((s) => ({ zoom: clampZoom(s.zoom + steps * ZOOM_STEP) })),
      resetZoom: () => set({ zoom: 1 }),
      setReduceMotion: (reduce) => {
        applyMotion(reduce);
        set({ reduceMotion: reduce });
      },
    }),
    {
      name: "preferences",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) applyMotion(state.reduceMotion);
      },
    },
  ),
);
