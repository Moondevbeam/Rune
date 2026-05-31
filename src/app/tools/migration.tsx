import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { SurfaceCard } from '@/components/wallet/SurfaceCard';
import { Spacing } from '@/constants/theme';
import { useTouchSession } from '@/hooks/use-touch-session';

const STEPS = [
  'Never enter your seed phrase on a website, Telegram bot, or “support” chat.',
  'Confirm the destination network matches the recipient address format (0x…, T…, EQ…).',
  'Prefer a low-fee rail (TRON, Polygon) for the middle leg when moving large USDT balances.',
  'Send a small test transaction before moving your full balance.',
  'Keep Rune locked while screens show addresses; disable screen recording when sharing QR codes.',
  'After bridging or CEX withdrawal, wait for confirmations before deleting exchange records.',
];

export default function MigrationGuideScreen() {
  useTouchSession();

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="USDT migration" back />
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="small" themeColor="textSecondary">
            Moving USDT between Ethereum, TRON, TON and other chains is risky if you rush. Use
            this checklist every time — Rune never asks for your seed online.
          </ThemedText>
          {STEPS.map((step, i) => (
            <SurfaceCard key={step}>
              <ThemedText type="smallBold">
                {i + 1}. {step}
              </ThemedText>
            </SurfaceCard>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
});
