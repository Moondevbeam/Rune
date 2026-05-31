import { useWalletManager } from '@tetherto/wdk-react-native-core';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { SeedGrid } from '@/components/wallet/SeedGrid';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOnboarding } from '@/store/onboarding';

const SEED_WORD_COUNT = 12 as const;

const pickChallengeIndexes = (count: number, n = 3): number[] => {
  const pool = Array.from({ length: count }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n).sort((a, b) => a - b);
};

export default function CreateWalletScreen() {
  const { generateMnemonic } = useWalletManager();
  const setMnemonic = useOnboarding((s) => s.setMnemonic);
  const setChallenge = useOnboarding((s) => s.setChallenge);
  const mnemonic = useOnboarding((s) => s.mnemonic);
  const [loading, setLoading] = useState(!mnemonic);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (mnemonic) return;
    setLoading(true);
    generateMnemonic(SEED_WORD_COUNT)
      .then((phrase) => {
        setMnemonic(phrase);
        setChallenge(pickChallengeIndexes(SEED_WORD_COUNT));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [generateMnemonic, mnemonic, setMnemonic, setChallenge]);

  const handleCopy = async () => {
    if (!mnemonic) return;
    await Clipboard.setStringAsync(mnemonic);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const words = (mnemonic ?? '').split(' ').filter(Boolean);

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="Your recovery phrase" back />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <ThemedText type="small" themeColor="textSecondary">
            Write these 12 words down in order and store them offline. Anyone with this phrase can
            access your funds. Rune cannot recover this phrase if you lose it.
          </ThemedText>

          {loading ? (
            <ActivityIndicator color={theme.accent} size="large" />
          ) : error ? (
            <ThemedText style={{ color: theme.danger }}>{error}</ThemedText>
          ) : (
            <SeedGrid words={words} />
          )}

          <View style={styles.copyRow}>
            <PrimaryButton
              variant="secondary"
              label={copied ? 'Copied to clipboard' : 'Copy phrase'}
              onPress={handleCopy}
              disabled={!mnemonic}
            />
          </View>
        </ScrollView>

        <View style={styles.cta}>
          <PrimaryButton
            label="I have written it down"
            onPress={() => router.push('/(onboarding)/confirm-seed')}
            disabled={!mnemonic || loading}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.four,
  },
  copyRow: {
    alignItems: 'center',
  },
  cta: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
});
