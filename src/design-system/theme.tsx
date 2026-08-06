import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { useColorScheme } from '@/components/useColorScheme';

import { darkColors, lightColors, radius, spacing, typography, type ThemeColors } from './tokens';

type Theme = {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  scheme: 'light' | 'dark';
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();

  const value = useMemo<Theme>(
    () => ({
      colors: scheme === 'dark' ? darkColors : lightColors,
      spacing,
      radius,
      typography,
      scheme,
    }),
    [scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
