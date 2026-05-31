import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { SurfaceCard } from '@/components/wallet/SurfaceCard';
import { NETWORK_LABELS, type SupportedNetwork } from '@/config/wdk';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTouchSession } from '@/hooks/use-touch-session';
import { rankChainsForUsdt } from '@/services/chainHealth';
import { useAllAddresses } from '@/services/wdk';
import { useUseCasesStore, type SplitBill } from '@/store/use-cases';
import { usePreferences } from '@/store/preferences';

const splitAmount = (total: number, count: number): string[] => {
  if (count < 1 || total <= 0) return [];
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  const remainder = cents - base * count;
  return Array.from({ length: count }, (_, i) => {
    const c = base + (i < remainder ? 1 : 0);
    return (c / 100).toFixed(2);
  });
};

export default function SplitBillScreen() {
  useTouchSession();
  const theme = useTheme();
  const enabledChains = usePreferences((s) => s.enabledChains);
  const chain = rankChainsForUsdt(enabledChains)[0] ?? 'tron';
  const addresses = useAllAddresses();
  const addSplit = useUseCasesStore((s) => s.addSplit);
  const markSplitPaid = useUseCasesStore((s) => s.markSplitPaid);
  const splits = useUseCasesStore((s) => s.splits);

  const [title, setTitle] = useState('');
  const [total, setTotal] = useState('');
  const [count, setCount] = useState('2');
  const [active, setActive] = useState<SplitBill | null>(null);

  const participants = useMemo(() => {
    const n = Math.max(1, parseInt(count, 10) || 1);
    const t = parseFloat(total) || 0;
    return splitAmount(t, n).map((amount, i) => ({
      name: `Person ${i + 1}`,
      amount,
      paid: false,
    }));
  }, [total, count]);

  const handleCreate = async () => {
    const bill = await addSplit({
      title: title.trim() || 'Split bill',
      total,
      chain,
      participants,
    });
    setActive(bill);
    setTitle('');
    setTotal('');
  };

  const address = addresses[chain]?.address;

  const handleShareRequest = async (amount: string, name: string) => {
    if (!address) return;
    const text = `${name} owes ${amount} USDT on ${NETWORK_LABELS[chain]}.\nPay to:\n${address}`;
    await Clipboard.setStringAsync(text);
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="Split bill commitment" back />
        <ScrollView contentContainerStyle={styles.content}>
          <SurfaceCard style={styles.form}>
            <ThemedText type="smallBold">New split</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Network: {NETWORK_LABELS[chain]} (lowest-fee enabled chain)
            </ThemedText>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Dinner, trip, …"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
            />
            <TextInput
              value={total}
              onChangeText={setTotal}
              keyboardType="decimal-pad"
              placeholder="Total USDT"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
            />
            <TextInput
              value={count}
              onChangeText={setCount}
              keyboardType="number-pad"
              placeholder="People"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
            />
            <PrimaryButton
              label="Create split"
              onPress={handleCreate}
              disabled={!total || participants.length === 0}
            />
          </SurfaceCard>

          {(active ?? splits[splits.length - 1])?.participants.map((p, i) => {
            const bill = active ?? splits[splits.length - 1];
            if (!bill) return null;
            return (
              <SurfaceCard key={`${bill.id}-${i}`} style={styles.row}>
                <ThemedText type="smallBold">
                  {p.name} — {p.amount} USDT
                </ThemedText>
                <View style={styles.rowActions}>
                  <PrimaryButton
                    variant="secondary"
                    label="Copy request"
                    onPress={() => handleShareRequest(p.amount, p.name)}
                  />
                  <PrimaryButton
                    variant="secondary"
                    label={p.paid ? 'Paid' : 'Mark paid'}
                    disabled={p.paid}
                    onPress={() => markSplitPaid(bill.id, i)}
                  />
                </View>
              </SurfaceCard>
            );
          })}

          {address ? (
            <PrimaryButton
              label="Show receive QR"
              onPress={() =>
                router.push({
                  pathname: '/receive/[chain]',
                  params: { chain, amount: total },
                })
              }
            />
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  form: { gap: Spacing.two },
  input: { fontSize: 16, paddingVertical: Spacing.one },
  row: { gap: Spacing.two },
  rowActions: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
});
