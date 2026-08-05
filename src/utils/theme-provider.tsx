import { useColorScheme } from 'nativewind';
import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { THEME } from './theme';

type ThemeContextValue = {
  colorScheme: 'light' | 'dark';
  colors: typeof THEME.light;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const { colorScheme } = useColorScheme();
  const resolvedScheme: 'light' | 'dark' = colorScheme === 'dark' ? 'dark' : 'light';

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme: resolvedScheme,
      colors: resolvedScheme === 'dark' ? THEME.dark : THEME.light,
    }),
    [resolvedScheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}