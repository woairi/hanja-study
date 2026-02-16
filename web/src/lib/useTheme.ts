'use client';

import { useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'hanja-study:theme';

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'system';
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (mode === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', mode);
  }
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    const stored = getStoredTheme();
    setMode(stored);
    applyTheme(stored);
  }, []);

  const setTheme = useCallback((m: ThemeMode) => {
    setMode(m);
    localStorage.setItem(STORAGE_KEY, m);
    applyTheme(m);
  }, []);

  return { mode, setTheme };
}
