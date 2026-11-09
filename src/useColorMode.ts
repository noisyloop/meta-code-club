import {useCallback, useState} from 'react';
import type {ColorMode} from './components/ThemeModeToggle';

const KEY = 'code-club-hub:color-mode';

function read(): ColorMode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* storage unavailable */
  }
  return 'system';
}

export function useColorMode() {
  const [mode, setModeState] = useState<ColorMode>(read);
  const setMode = useCallback((next: ColorMode) => {
    setModeState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }, []);
  return [mode, setMode] as const;
}
