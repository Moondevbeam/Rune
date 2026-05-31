/**
 * AuthGate
 *
 * Sits between the providers and the route tree. Renders one of:
 * - a splash while the WDK worklet is initializing,
 * - a hard error screen if the bundle is missing or the engine crashed,
 * - the local PIN/biometric lock screen when the session is locked,
 * - the actual app otherwise.
 *
 * It also runs the auto-lock timer driven by the `useSession` store.
 */
import { useWdkApp } from '@tetherto/wdk-react-native-core';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LockScreen } from '@/components/wallet/LockScreen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';
import { useSession, isSessionStale } from '@/store/session';

const HEARTBEAT_MS = 5_000;

export const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { state, retry } = useWdkApp();
  const theme = useTheme();
  const isReady = useAuthStore((s) => s.isReady);
  const hasPin = useAuthStore((s) => s.hasPin);
  const isLocked = useAuthStore((s) => s.isLocked);
  const lock = useAuthStore((s) => s.lock);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const authenticateBiometric = useAuthStore((s) => s.authenticateBiometric);
  const autoLockMs = useAuthStore((s) => s.autoLockMs);
  const lastTouchedAt = useSession((s) => s.lastTouchedAt);
  const biometricTried = useRef(false);

  // Auto-lock on background or after inactivity.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active' && hasPin) lock();
    });
    return () => sub.remove();
  }, [hasPin, lock]);

  useEffect(() => {
    if (!hasPin) return;
    const id = setInterval(() => {
      if (isSessionStale(lastTouchedAt, autoLockMs)) lock();
    }, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [hasPin, lastTouchedAt, autoLockMs, lock]);

  // Try biometric automatically once after the lock screen mounts.
  useEffect(() => {
    if (isLocked && biometricEnabled && !biometricTried.current) {
      biometricTried.current = true;
      LocalAuthentication.hasHardwareAsync().then((hw) => {
        if (hw) authenticateBiometric('Unlock Rune Wallet').catch(() => {});
      });
    }
    if (!isLocked) biometricTried.current = false;
  }, [isLocked, biometricEnabled, authenticateBiometric]);

  if (!isReady) return <Splash text="Loading wallet…" />;

  switch (state.status) {
    case 'INITIALIZING':
    case 'REINITIALIZING':
      return <Splash text="Starting secure engine…" />;
    case 'ERROR':
      return (
        <BundleErrorScreen
          message={state.error?.message ?? 'Failed to start the WDK worklet.'}
          onRetry={retry}
        />
      );
    default:
      break;
  }

  if (hasPin && isLocked) {
    return <LockScreen />;
  }

  return <>{children}</>;
};

const Splash = ({ text }: { text: string }) => {
  const theme = useTheme();
  return (
    <ThemedView style={styles.center}>
      <SafeAreaView style={styles.centerInner}>
        <ActivityIndicator color={theme.accent} size="large" />
        <ThemedText type="small" themeColor="textSecondary">
          {text}
        </ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
};

const BundleErrorScreen = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <ThemedView style={styles.center}>
    <SafeAreaView style={styles.errorInner}>
      <ThemedText type="title" style={{ textAlign: 'center' }}>
        Setup required
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
        The WDK worklet failed to start. Generate the bundle from your project root and rebuild
        the dev client:
        {'\n\n'}
        npx wdk-worklet-bundler generate
        {'\n'}
        npx expo prebuild --clean
        {'\n'}
        npx expo run:ios
      </ThemedText>
      <View style={styles.errorMessage}>
        <ThemedText type="small" themeColor="textSecondary" selectable>
          {message}
        </ThemedText>
      </View>
      <PrimaryButton label="Retry" onPress={onRetry} />
    </SafeAreaView>
  </ThemedView>
);

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerInner: { alignItems: 'center', gap: Spacing.three },
  errorInner: {
    padding: Spacing.four,
    gap: Spacing.three,
    maxWidth: 520,
    width: '100%',
  },
  errorMessage: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 8,
    backgroundColor: '#0001',
  },
});
