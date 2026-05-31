/**
 * Preferences store
 *
 * App-level non-sensitive preferences that should survive app restarts. Stored
 * in AsyncStorage-equivalent (here we use expo-secure-store for simplicity —
 * not for security but for persistence parity across iOS/Android).
 */
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

import { SUPPORTED_NETWORKS, type SupportedNetwork } from '@/config/networks';
import { type FiatCurrency } from '@/constants/fiat';
import { DEFAULT_PALETTE, PALETTES, type ThemePaletteId } from '@/constants/theme';

export type { FiatCurrency } from '@/constants/fiat';

const FIAT_KEY = 'rune.prefs.fiat';
const THEME_KEY = 'rune.prefs.theme';
const PALETTE_KEY = 'rune.prefs.themePalette';
const ENABLED_CHAINS_KEY = 'rune.prefs.enabledChains';

export type ThemePreference = 'system' | 'light' | 'dark';

type PrefsState = {
  fiat: FiatCurrency;
  theme: ThemePreference;
  themePalette: ThemePaletteId;
  enabledChains: SupportedNetwork[];
  isReady: boolean;
  hydrate: () => Promise<void>;
  setFiat: (fiat: FiatCurrency) => Promise<void>;
  setTheme: (theme: ThemePreference) => Promise<void>;
  setThemePalette: (palette: ThemePaletteId) => Promise<void>;
  toggleChain: (chain: SupportedNetwork) => Promise<void>;
};

const isValidPalette = (v: string | null): v is ThemePaletteId =>
  v != null && Object.prototype.hasOwnProperty.call(PALETTES, v);

export const usePreferences = create<PrefsState>((set, get) => ({
  fiat: 'USD',
  theme: 'dark',
  themePalette: DEFAULT_PALETTE,
  enabledChains: [...SUPPORTED_NETWORKS],
  isReady: false,

  hydrate: async () => {
    const [fiat, theme, palette, chains] = await Promise.all([
      SecureStore.getItemAsync(FIAT_KEY),
      SecureStore.getItemAsync(THEME_KEY),
      SecureStore.getItemAsync(PALETTE_KEY),
      SecureStore.getItemAsync(ENABLED_CHAINS_KEY),
    ]);
    set({
      fiat: (fiat as FiatCurrency) ?? 'USD',
      theme: (theme as ThemePreference) ?? 'dark',
      themePalette: isValidPalette(palette) ? palette : DEFAULT_PALETTE,
      enabledChains: chains
        ? (JSON.parse(chains) as SupportedNetwork[])
        : [...SUPPORTED_NETWORKS],
      isReady: true,
    });
  },

  setFiat: async (fiat) => {
    await SecureStore.setItemAsync(FIAT_KEY, fiat);
    set({ fiat });
  },

  setTheme: async (theme) => {
    await SecureStore.setItemAsync(THEME_KEY, theme);
    set({ theme });
  },

  setThemePalette: async (palette) => {
    await SecureStore.setItemAsync(PALETTE_KEY, palette);
    set({ themePalette: palette });
  },

  toggleChain: async (chain) => {
    const current = get().enabledChains;
    const next = current.includes(chain)
      ? current.filter((c) => c !== chain)
      : [...current, chain];
    await SecureStore.setItemAsync(ENABLED_CHAINS_KEY, JSON.stringify(next));
    set({ enabledChains: next });
  },
}));
