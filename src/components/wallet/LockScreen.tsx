import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PinPad } from '@/components/wallet/PinPad';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useActivePalette, useResolvedScheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

const PIN_LENGTH = 6;

export const LockScreen = () => {
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const verifyPin = useAuthStore((s) => s.verifyPin);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const authenticateBiometric = useAuthStore((s) => s.authenticateBiometric);

  const palette = useActivePalette();
  const scheme = useResolvedScheme();
  const heroVariant = palette[scheme];

  const handleSubmit = async (value: string) => {
    const ok = await verifyPin(value);
    if (ok) {
      setError(false);
      setPin('');
      return;
    }
    setError(true);
    setTimeout(() => {
      setPin('');
      setError(false);
    }, 600);
  };

  return (
    <ThemedView style={styles.root}>
      <LinearGradient
        colors={[heroVariant.gradientStart, heroVariant.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1.4 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.inner} edges={['top', 'bottom']}>
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <SymbolView name="lock.shield.fill" size={32} tintColor={heroVariant.accentText} />
          </View>
          <ThemedText
            type="title"
            style={[styles.title, { color: heroVariant.accentText }]}>
            Rune
          </ThemedText>
          <ThemedText
            type="small"
            style={[
              styles.subtitle,
              { color: heroVariant.accentText, opacity: error ? 1 : 0.85 },
            ]}>
            {error ? 'Incorrect PIN. Try again.' : 'Enter your PIN to unlock'}
          </ThemedText>
        </View>
        <View style={[styles.pad, { paddingBottom: Math.max(insets.bottom, Spacing.three) }]}>
          <PinPad
            pinLength={PIN_LENGTH}
            value={pin}
            onChange={setPin}
            onSubmit={handleSubmit}
            onBiometric={
              biometricEnabled ? () => authenticateBiometric('Unlock Rune Wallet') : undefined
            }
            error={error}
            variant="onAccent"
            tint={heroVariant.accentText}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  brand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.three,
    minHeight: 120,
  },
  pad: {
    flexShrink: 0,
    alignItems: 'center',
    width: '100%',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: Spacing.two,
  },
  title: { textAlign: 'center', fontWeight: '700', fontSize: 40, lineHeight: 46 },
  subtitle: { textAlign: 'center' },
});
