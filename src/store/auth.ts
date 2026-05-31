/**
 * Auth store
 *
 * Manages PIN, biometric preference and the session lock state used by the
 * AuthGate. The PIN is stored as a SHA-256 hash in expo-secure-store; the
 * plaintext PIN never leaves memory.
 */
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';

const PIN_HASH_KEY = 'rune.auth.pinHash';
const BIOMETRIC_KEY = 'rune.auth.biometric';
const AUTO_LOCK_KEY = 'rune.auth.autoLockMs';

export const DEFAULT_AUTO_LOCK_MS = 2 * 60 * 1000;

type AuthState = {
  hasPin: boolean;
  biometricEnabled: boolean;
  isLocked: boolean;
  autoLockMs: number;
  isReady: boolean;
  hydrate: () => Promise<void>;
  setupPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  changePin: (current: string, next: string) => Promise<boolean>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  authenticateBiometric: (reason?: string) => Promise<boolean>;
  setAutoLockMs: (ms: number) => Promise<void>;
  lock: () => void;
  unlock: () => void;
  reset: () => Promise<void>;
};

const hashPin = async (pin: string): Promise<string> =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `rune:${pin}`);

export const useAuthStore = create<AuthState>((set, get) => ({
  hasPin: false,
  biometricEnabled: false,
  isLocked: true,
  autoLockMs: DEFAULT_AUTO_LOCK_MS,
  isReady: false,

  hydrate: async () => {
    const [pinHash, biometric, autoLock] = await Promise.all([
      SecureStore.getItemAsync(PIN_HASH_KEY),
      SecureStore.getItemAsync(BIOMETRIC_KEY),
      SecureStore.getItemAsync(AUTO_LOCK_KEY),
    ]);
    set({
      hasPin: Boolean(pinHash),
      biometricEnabled: biometric === '1',
      autoLockMs: autoLock ? Number(autoLock) : DEFAULT_AUTO_LOCK_MS,
      isLocked: Boolean(pinHash),
      isReady: true,
    });
  },

  setupPin: async (pin) => {
    const hash = await hashPin(pin);
    await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
    set({ hasPin: true, isLocked: false });
  },

  verifyPin: async (pin) => {
    const stored = await SecureStore.getItemAsync(PIN_HASH_KEY);
    if (!stored) return false;
    const hash = await hashPin(pin);
    const ok = hash === stored;
    if (ok) set({ isLocked: false });
    return ok;
  },

  changePin: async (current, next) => {
    const ok = await get().verifyPin(current);
    if (!ok) return false;
    await get().setupPin(next);
    return true;
  },

  setBiometricEnabled: async (enabled) => {
    if (enabled) {
      const hardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hardware || !enrolled) {
        throw new Error('Biometrics not available on this device.');
      }
    }
    await SecureStore.setItemAsync(BIOMETRIC_KEY, enabled ? '1' : '0');
    set({ biometricEnabled: enabled });
  },

  authenticateBiometric: async (reason = 'Authenticate to continue') => {
    if (!get().biometricEnabled) return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      disableDeviceFallback: false,
      cancelLabel: 'Use PIN instead',
    });
    if (result.success) set({ isLocked: false });
    return result.success;
  },

  setAutoLockMs: async (ms) => {
    await SecureStore.setItemAsync(AUTO_LOCK_KEY, String(ms));
    set({ autoLockMs: ms });
  },

  lock: () => set({ isLocked: true }),
  unlock: () => set({ isLocked: false }),

  reset: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(PIN_HASH_KEY),
      SecureStore.deleteItemAsync(BIOMETRIC_KEY),
      SecureStore.deleteItemAsync(AUTO_LOCK_KEY),
    ]);
    set({
      hasPin: false,
      biometricEnabled: false,
      isLocked: true,
      autoLockMs: DEFAULT_AUTO_LOCK_MS,
    });
  },
}));
