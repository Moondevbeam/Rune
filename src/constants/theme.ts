/**
 * Theme system
 *
 * Rune ships with a set of palettes (Tether, Midnight, Plum, Sunset, Forest)
 * each defined in both light and dark variants. The active palette is stored
 * in the preferences store (`usePreferences.themePalette`) and resolved at
 * read-time by `useTheme()`. All consumers stay decoupled from which palette
 * is active — they just read tokens like `theme.text`, `theme.accent`, etc.
 *
 * Tokens are extra-thick on purpose: in addition to the original Radix-ish
 * surface tokens, every palette exposes a soft + strong accent variant and a
 * 2-stop gradient tuple used by the dashboard / lock / onboarding heroes.
 */
import '@/global.css';

import { Platform } from 'react-native';

export type PaletteVariant = {
  text: string;
  textSecondary: string;
  background: string;
  backgroundElement: string;
  backgroundSelected: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  accentMuted: string;
  danger: string;
  success: string;
  warning: string;
  shadow: string;
  gradientStart: string;
  gradientEnd: string;
};

export type ThemeColor = keyof PaletteVariant;

export type Palette = {
  id: ThemePaletteId;
  name: string;
  swatch: string;
  light: PaletteVariant;
  dark: PaletteVariant;
};

export type ThemePaletteId = 'tether' | 'midnight' | 'plum' | 'sunset' | 'forest';

const tether: Palette = {
  id: 'tether',
  name: 'Tether',
  swatch: '#00A87E',
  light: {
    text: '#0B1410',
    textSecondary: '#5C6B65',
    background: '#F7FAF8',
    backgroundElement: '#ECF1EE',
    backgroundSelected: '#DFE7E2',
    surface: '#FFFFFF',
    surfaceElevated: '#F2F6F4',
    border: '#DEE5E1',
    borderStrong: '#C7D2CC',
    accent: '#00A87E',
    accentText: '#FFFFFF',
    accentSoft: 'rgba(0, 168, 126, 0.12)',
    accentMuted: 'rgba(0, 168, 126, 0.22)',
    danger: '#E5484D',
    success: '#0E9F6E',
    warning: '#F5A524',
    shadow: 'rgba(11, 20, 16, 0.08)',
    gradientStart: '#00C089',
    gradientEnd: '#008E68',
  },
  dark: {
    text: '#F1F5F3',
    textSecondary: '#9AAAA3',
    background: '#06100C',
    backgroundElement: '#101C17',
    backgroundSelected: '#162822',
    surface: '#0E1814',
    surfaceElevated: '#162822',
    border: '#1B2A24',
    borderStrong: '#243832',
    accent: '#00C089',
    accentText: '#04130D',
    accentSoft: 'rgba(0, 192, 137, 0.14)',
    accentMuted: 'rgba(0, 192, 137, 0.28)',
    danger: '#FF6369',
    success: '#3DD68C',
    warning: '#F5A524',
    shadow: 'rgba(0, 0, 0, 0.45)',
    gradientStart: '#00C089',
    gradientEnd: '#005C44',
  },
};

const midnight: Palette = {
  id: 'midnight',
  name: 'Midnight',
  swatch: '#208AEF',
  light: {
    text: '#0B0F14',
    textSecondary: '#5C636E',
    background: '#FAFAFB',
    backgroundElement: '#F1F2F4',
    backgroundSelected: '#E3E5E9',
    surface: '#FFFFFF',
    surfaceElevated: '#F4F5F8',
    border: '#E3E5E9',
    borderStrong: '#CBCFD6',
    accent: '#208AEF',
    accentText: '#FFFFFF',
    accentSoft: 'rgba(32, 138, 239, 0.12)',
    accentMuted: 'rgba(32, 138, 239, 0.22)',
    danger: '#E5484D',
    success: '#30A46C',
    warning: '#F5A524',
    shadow: 'rgba(11, 15, 20, 0.08)',
    gradientStart: '#3FA0FF',
    gradientEnd: '#1B6FC8',
  },
  dark: {
    text: '#F5F6F7',
    textSecondary: '#9AA3AE',
    background: '#05070A',
    backgroundElement: '#121820',
    backgroundSelected: '#1A2330',
    surface: '#0C1018',
    surfaceElevated: '#151D2A',
    border: '#1A2330',
    borderStrong: '#2A3548',
    accent: '#4DA3FF',
    accentText: '#04101C',
    accentSoft: 'rgba(77, 163, 255, 0.16)',
    accentMuted: 'rgba(77, 163, 255, 0.32)',
    danger: '#FF6369',
    success: '#3DD68C',
    warning: '#F5A524',
    shadow: 'rgba(0, 0, 0, 0.55)',
    gradientStart: '#4DA3FF',
    gradientEnd: '#1A4A8C',
  },
};

const plum: Palette = {
  id: 'plum',
  name: 'Plum',
  swatch: '#8B5CF6',
  light: {
    text: '#1B0E2E',
    textSecondary: '#6B5C7E',
    background: '#FBF9FF',
    backgroundElement: '#F1ECFA',
    backgroundSelected: '#E4DCF4',
    surface: '#FFFFFF',
    surfaceElevated: '#F6F1FE',
    border: '#E5DCF4',
    borderStrong: '#CFC0E8',
    accent: '#8B5CF6',
    accentText: '#FFFFFF',
    accentSoft: 'rgba(139, 92, 246, 0.12)',
    accentMuted: 'rgba(139, 92, 246, 0.22)',
    danger: '#E5484D',
    success: '#30A46C',
    warning: '#F5A524',
    shadow: 'rgba(27, 14, 46, 0.08)',
    gradientStart: '#A78BFA',
    gradientEnd: '#6D28D9',
  },
  dark: {
    text: '#F4EDFF',
    textSecondary: '#A89BC2',
    background: '#0E0816',
    backgroundElement: '#181126',
    backgroundSelected: '#221833',
    surface: '#130C20',
    surfaceElevated: '#211736',
    border: '#221833',
    borderStrong: '#322447',
    accent: '#A78BFA',
    accentText: '#150827',
    accentSoft: 'rgba(167, 139, 250, 0.16)',
    accentMuted: 'rgba(167, 139, 250, 0.28)',
    danger: '#FF6369',
    success: '#3DD68C',
    warning: '#F5A524',
    shadow: 'rgba(0, 0, 0, 0.5)',
    gradientStart: '#A78BFA',
    gradientEnd: '#3B1A6E',
  },
};

const sunset: Palette = {
  id: 'sunset',
  name: 'Sunset',
  swatch: '#FF6B35',
  light: {
    text: '#1F1108',
    textSecondary: '#7A5B45',
    background: '#FFF9F4',
    backgroundElement: '#FBEFE4',
    backgroundSelected: '#F5DFCC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFF1E6',
    border: '#F1DEC7',
    borderStrong: '#E5C6A4',
    accent: '#FF6B35',
    accentText: '#FFFFFF',
    accentSoft: 'rgba(255, 107, 53, 0.12)',
    accentMuted: 'rgba(255, 107, 53, 0.22)',
    danger: '#D72638',
    success: '#0F9D58',
    warning: '#F5A524',
    shadow: 'rgba(31, 17, 8, 0.08)',
    gradientStart: '#FF7E47',
    gradientEnd: '#E0431E',
  },
  dark: {
    text: '#FCEEDC',
    textSecondary: '#C2A180',
    background: '#1A0E07',
    backgroundElement: '#251609',
    backgroundSelected: '#321C0B',
    surface: '#1F1107',
    surfaceElevated: '#2E1A0B',
    border: '#2E1B0C',
    borderStrong: '#43281B',
    accent: '#FF8A57',
    accentText: '#250F03',
    accentSoft: 'rgba(255, 138, 87, 0.16)',
    accentMuted: 'rgba(255, 138, 87, 0.28)',
    danger: '#FF7B7F',
    success: '#3DD68C',
    warning: '#F5A524',
    shadow: 'rgba(0, 0, 0, 0.5)',
    gradientStart: '#FF8A57',
    gradientEnd: '#7A2710',
  },
};

const forest: Palette = {
  id: 'forest',
  name: 'Forest',
  swatch: '#34A853',
  light: {
    text: '#0C1A11',
    textSecondary: '#4F6D5B',
    background: '#F8FBF8',
    backgroundElement: '#EDF3EE',
    backgroundSelected: '#DCE9DE',
    surface: '#FFFFFF',
    surfaceElevated: '#F1F7F1',
    border: '#DFE9E0',
    borderStrong: '#C7D8C9',
    accent: '#34A853',
    accentText: '#FFFFFF',
    accentSoft: 'rgba(52, 168, 83, 0.12)',
    accentMuted: 'rgba(52, 168, 83, 0.22)',
    danger: '#E5484D',
    success: '#1E8E3E',
    warning: '#F5A524',
    shadow: 'rgba(12, 26, 17, 0.08)',
    gradientStart: '#54C66E',
    gradientEnd: '#1E7C3A',
  },
  dark: {
    text: '#E9F4EC',
    textSecondary: '#94B49F',
    background: '#070F09',
    backgroundElement: '#101A12',
    backgroundSelected: '#16261B',
    surface: '#0C170F',
    surfaceElevated: '#152620',
    border: '#172420',
    borderStrong: '#23362A',
    accent: '#54C66E',
    accentText: '#03130A',
    accentSoft: 'rgba(84, 198, 110, 0.14)',
    accentMuted: 'rgba(84, 198, 110, 0.28)',
    danger: '#FF6369',
    success: '#3DD68C',
    warning: '#F5A524',
    shadow: 'rgba(0, 0, 0, 0.45)',
    gradientStart: '#54C66E',
    gradientEnd: '#0F4D24',
  },
};

export const PALETTES: Record<ThemePaletteId, Palette> = {
  tether,
  midnight,
  plum,
  sunset,
  forest,
};

export const PALETTE_ORDER: ThemePaletteId[] = ['tether', 'midnight', 'plum', 'sunset', 'forest'];

export const DEFAULT_PALETTE: ThemePaletteId = 'midnight';

/**
 * Backward-compat export. Anything that imported `Colors.light` / `Colors.dark`
 * before the palette refactor still works — those callers just receive the
 * default palette. New code should use the `useTheme()` hook instead so it
 * reacts to the user's palette choice at runtime.
 */
export const Colors = {
  light: PALETTES[DEFAULT_PALETTE].light,
  dark: PALETTES[DEFAULT_PALETTE].dark,
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
  pill: 999,
} as const;

export const Elevation = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  android: { elevation: 2 },
  default: {},
}) as Record<string, unknown>;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
