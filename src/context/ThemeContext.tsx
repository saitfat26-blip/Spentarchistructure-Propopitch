import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { parseShareThemeParam } from '../utils/shareUrlCodec';

export type ThemeMode = 'light' | 'dark';
export type PaletteMode = 'stone' | 'nocturnal';

const PALETTE_STORAGE_KEY = 'spenta_theme_palette_v2';
const LEGACY_THEME_STORAGE_KEY = 'spenta_theme_v2';

interface ThemeContextValue {
  /** 'light' corresponds to Stone; 'dark' corresponds to Nocturnal */
  theme: ThemeMode;
  /** Semantic Spenta Dhaka palette identifier persisted to localStorage */
  paletteMode: PaletteMode;
  isDark: boolean;
  setTheme: (next: ThemeMode) => void;
  setPaletteMode: (next: PaletteMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function paletteToTheme(palette: PaletteMode): ThemeMode {
  return palette === 'stone' ? 'light' : 'dark';
}

function themeToPalette(theme: ThemeMode): PaletteMode {
  return theme === 'light' ? 'stone' : 'nocturnal';
}

function loadInitialPalette(): PaletteMode {
  const sharedTheme = parseShareThemeParam();
  if (sharedTheme) return sharedTheme;
  try {
    const storedPalette = window.localStorage.getItem(PALETTE_STORAGE_KEY);
    if (storedPalette === 'stone' || storedPalette === 'nocturnal') {
      return storedPalette;
    }
    const legacyTheme = window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    if (legacyTheme === 'light') return 'stone';
    if (legacyTheme === 'dark') return 'nocturnal';
  } catch {
    // ignore storage access errors
  }
  return 'stone';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [paletteMode, setPaletteModeState] = useState<PaletteMode>(() => loadInitialPalette());

  const theme = paletteToTheme(paletteMode);
  const isDark = paletteMode === 'nocturnal';

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.dataset.theme = paletteMode;
    root.style.colorScheme = theme;

    try {
      window.localStorage.setItem(PALETTE_STORAGE_KEY, paletteMode);
      window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage quota errors
    }
  }, [paletteMode, theme, isDark]);

  // Keep multiple open tabs synced when localStorage theme changes
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === PALETTE_STORAGE_KEY) {
        if (event.newValue === 'stone' || event.newValue === 'nocturnal') {
          setPaletteModeState(event.newValue);
        }
      } else if (event.key === LEGACY_THEME_STORAGE_KEY) {
        if (event.newValue === 'light') setPaletteModeState('stone');
        if (event.newValue === 'dark') setPaletteModeState('nocturnal');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setPaletteMode = useCallback((next: PaletteMode) => {
    setPaletteModeState(next);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setPaletteModeState(themeToPalette(next));
  }, []);

  const toggleTheme = useCallback(() => {
    setPaletteModeState((prev) => (prev === 'nocturnal' ? 'stone' : 'nocturnal'));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      paletteMode,
      isDark,
      setTheme,
      setPaletteMode,
      toggleTheme,
    }),
    [theme, paletteMode, isDark, setTheme, setPaletteMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return ctx;
}
