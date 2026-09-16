import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MODES, DEFAULT_MODE } from "../config/navigation.js";

/*
 * ShellContext — which shell the app is wearing, and whether the palette is up.
 *
 * `mode` is the shell the speaker says they are in (see config/navigation.js).
 * It survives a reload so a speaker who set "stage" before the talk still gets
 * "stage" after the inevitable refresh. Every localStorage touch is guarded:
 * Safari private mode throws on both read and write.
 *
 * It no longer filters the app bar. The bar is identical on every route by
 * design, so mode is now a stated preference the palette and landing page set,
 * not a switch that reshapes the chrome underneath you.
 */

const ShellContext = createContext();

const STORAGE_KEY = "shell_mode";

const readStoredMode = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    // An unknown or stale id must not fall through and blank the nav.
    return saved && MODES[saved] ? saved : DEFAULT_MODE;
  } catch (e) {
    return DEFAULT_MODE;
  }
};

export function ShellProvider({ children }) {
  const [mode, setModeState] = useState(readStoredMode);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {
      // ignore
    }
  }, [mode]);

  const setMode = useCallback((next) => {
    if (MODES[next]) {
      setModeState(next);
    }
  }, []);

  const openPalette = useCallback(() => setIsPaletteOpen(true), []);
  const closePalette = useCallback(() => setIsPaletteOpen(false), []);
  const togglePalette = useCallback(() => setIsPaletteOpen((prev) => !prev), []);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      modes: MODES,
      isPaletteOpen,
      openPalette,
      closePalette,
      togglePalette,
    }),
    [mode, setMode, isPaletteOpen, openPalette, closePalette, togglePalette]
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const context = useContext(ShellContext);
  if (context === undefined) {
    throw new Error("useShell must be used within a ShellProvider");
  }
  return context;
}
