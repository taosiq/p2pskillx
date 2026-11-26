import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { categoryColors, DEFAULT_THEME, fixedGradients, THEMES, themeByKey } from './palette';
import { fonts, radius, spacing, type } from './tokens';

const ThemeContext = createContext(null);
const STORAGE_KEY = '@p2pskillx/theme';

const makeShadow = (colors) => (level = 1) => {
  if (level === 0) return {};
  const ios = {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 + level * 3 },
    shadowOpacity: colors.isDark ? 0.45 : 0.07 + level * 0.03,
    shadowRadius: 6 + level * 6,
  };
  return Platform.select({ ios, android: { elevation: level * 3 }, default: ios });
};

// A coloured glow under brand elements (buttons, level ring).
const makeGlow = (colors) => (color = colors.primary, strength = 1) =>
  Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: (colors.isDark ? 0.55 : 0.3) * strength,
      shadowRadius: 16,
    },
    android: { elevation: 6 },
    default: {},
  });

/**
 * themeKey: which colour theme (cyber, nebula, ...)
 * appearance: 'system' | 'light' | 'dark'
 * Both are remembered on the device.
 */
export function ThemeProvider({ children }) {
  const scheme = useColorScheme();
  const [themeKey, setThemeKeyState] = useState(DEFAULT_THEME);
  const [appearance, setAppearanceState] = useState('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (saved.themeKey && THEMES.some((t) => t.key === saved.themeKey)) setThemeKeyState(saved.themeKey);
        if (['system', 'light', 'dark'].includes(saved.appearance)) setAppearanceState(saved.appearance);
      })
      .catch(() => {});
  }, []);

  const persist = (next) => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});

  const setThemeKey = useCallback(
    (key) => {
      setThemeKeyState(key);
      persist({ themeKey: key, appearance });
    },
    [appearance]
  );
  const setAppearance = useCallback(
    (mode) => {
      setAppearanceState(mode);
      persist({ themeKey, appearance: mode });
    },
    [themeKey]
  );

  const value = useMemo(() => {
    const theme = themeByKey(themeKey);
    const isDark = appearance === 'system' ? scheme === 'dark' : appearance === 'dark';
    const colors = isDark ? theme.dark : theme.light;
    return {
      colors,
      gradients: { ...fixedGradients, primary: theme.gradient, hero: theme.hero },
      categoryColors,
      spacing,
      radius,
      type,
      fonts,
      isDark,
      shadow: makeShadow(colors),
      glow: makeGlow(colors),
      theme,
      themes: THEMES,
      themeKey,
      setThemeKey,
      appearance,
      setAppearance,
    };
  }, [scheme, themeKey, appearance, setThemeKey, setAppearance]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside <ThemeProvider>');
  return theme;
}

// Build a StyleSheet that depends on the theme, memoised per theme.
export function useStyles(factory) {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme]);
}
