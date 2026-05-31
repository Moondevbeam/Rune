/**
 * useTheme
 *
 * Resolves the active palette (Tether / Midnight / Plum / Sunset / Forest) and
 * the active color scheme (light / dark, optionally forced by the user) and
 * returns the corresponding palette variant.
 *
 * Consumers should read tokens off the returned object (`theme.text`,
 * `theme.accent`, etc.) — nothing else needs to know about the palette id.
 *
 * Learn more about color schemes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { PALETTES, type Palette, type PaletteVariant } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePreferences } from '@/store/preferences';

export type ResolvedScheme = 'light' | 'dark';

export const useResolvedScheme = (): ResolvedScheme => {
  const scheme = useColorScheme();
  const pref = usePreferences((s) => s.theme);
  if (pref === 'light') return 'light';
  if (pref === 'dark') return 'dark';
  return scheme === 'dark' ? 'dark' : 'light';
};

export const useActivePalette = (): Palette => {
  const id = usePreferences((s) => s.themePalette);
  return PALETTES[id];
};

export function useTheme(): PaletteVariant {
  const scheme = useResolvedScheme();
  const palette = useActivePalette();
  return palette[scheme];
}
