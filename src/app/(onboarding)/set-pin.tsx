import { useWalletManager } from '@tetherto/wdk-react-native-core';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { PinPad } from '@/components/wallet/PinPad';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';
import { useOnboarding } from '@/store/onboarding';

const PIN_LENGTH = 6;
const DEFAULT_WALLET_ID = 'rune-default';

type Step = 'create' | 'confirm' | 'biometric' | 'commit';

export default function SetPinScreen() {
  const theme = useTheme();
  const setupPin = useAuthStore((s) => s.setupPin);
  const setBiometric = useAuthStore((s) => s.setBiometricEnabled);
  const mnemonic = useOnboarding((s) => s.mnemonic);
  const resetOnboarding = useOnboarding((s) => s.reset);
  const { restoreWallet } = useWalletManager();

  const [step, setStep] = useState<Step>('create');
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [error, setError] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);

  const handleCreate = (value: string) => {
    setFirst(value);
    setSecond('');
    setStep('confirm');
  };

  const handleConfirm = async (value: string) => {
    if (value !== first) {
      setError(true);
      setTimeout(() => {
        setSecond('');
        setError(false);
      }, 600);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setupPin(first);
    setStep('biometric');
  };

  const finalizeWallet = async () => {
    if (!mnemonic) {
      setCommitError('No recovery phrase available. Restart onboarding.');
      return;
    }
    setCommitting(true);
    setCommitError(null);
    try {
      await restoreWallet(mnemonic, DEFAULT_WALLET_ID);
      resetOnboarding();
      router.replace('/(app)');
    } catch (e) {
      setCommitError((e as Error).message);
    } finally {
      setCommitting(false);
    }
  };

  const enableBiometricAndContinue = async () => {
    const hardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hardware || !enrolled) {
      setStep('commit');
      return;
    }
    try {
      await setBiometric(true);
    } catch {
      /* ignore — user can still skip */
    }
    setStep('commit');
  };

  if (step === 'commit' || (step === 'biometric' && committing)) {
    return (
      <ThemedView style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <ScreenHeader title="Finishing setup" />
          <View style={styles.body}>
            <ThemedText type="title">Almost there…</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              We are creating your wallet on this device.
            </ThemedText>
            {commitError ? (
              <ThemedText type="small" style={{ color: theme.danger }}>
                {commitError}
              </ThemedText>
            ) : null}
            <View style={{ height: Spacing.four }} />
            <PrimaryButton
              label={committing ? 'Creating…' : 'Create wallet'}
              loading={committing}
              onPress={finalizeWallet}
              disabled={committing}
            />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (step === 'biometric') {
    return (
      <ThemedView style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <ScreenHeader title="Biometric unlock" />
          <View style={styles.body}>
            <ThemedText type="title">Enable Face ID / Touch ID?</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Use your biometrics to unlock Rune in a single tap. You can still fall back to your
              PIN at any time.
            </ThemedText>
            <View style={{ height: Spacing.four }} />
            <PrimaryButton label="Enable biometrics" onPress={enableBiometricAndContinue} />
            <PrimaryButton
              variant="secondary"
              label="Skip for now"
              onPress={() => setStep('commit')}
            />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title={step === 'create' ? 'Create a PIN' : 'Confirm your PIN'} back />
        <View style={styles.body}>
          <ThemedText type="subtitle">
            {step === 'create' ? 'Choose a 6-digit PIN' : 'Re-enter your PIN'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.help}>
            {step === 'create'
              ? 'You will use this PIN to unlock Rune and to confirm sensitive actions.'
              : error
                ? "PINs don't match. Try again."
                : 'Enter the same 6 digits to continue.'}
          </ThemedText>
          <View style={{ height: Spacing.four }} />
          <PinPad
            pinLength={PIN_LENGTH}
            value={step === 'create' ? first : second}
            onChange={step === 'create' ? setFirst : setSecond}
            onSubmit={step === 'create' ? handleCreate : handleConfirm}
            error={error}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  help: { textAlign: 'center' },
});
