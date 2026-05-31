import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { SurfaceCard } from '@/components/wallet/SurfaceCard';
import {
  ASSETS_BY_NETWORK,
  NETWORK_LABELS,
  type AssetKey,
  type SupportedNetwork,
} from '@/config/wdk';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTouchSession } from '@/hooks/use-touch-session';
import { formatRelativeTime } from '@/services/formatters';
import { rankChainsForUsdt } from '@/services/chainHealth';
import { useUseCasesStore } from '@/store/use-cases';
import { usePreferences } from '@/store/preferences';

export default function RecurringScreen() {
  useTouchSession();
  const theme = useTheme();
  const enabled = usePreferences((s) => s.enabledChains);
  const chain = rankChainsForUsdt(enabled)[0] ?? 'tron';
  const assetKey = ASSETS_BY_NETWORK[chain].find((k) => k.startsWith('usdt')) as AssetKey;
  const recurring = useUseCasesStore((s) => s.recurring);
  const addRecurring = useUseCasesStore((s) => s.addRecurring);
  const markRecurringPaid = useUseCasesStore((s) => s.markRecurringPaid);
  const removeRecurring = useUseCasesStore((s) => s.removeRecurring);
  const dueCount = useMemo(
    () => recurring.filter((r) => r.nextDueAt <= Date.now()).length,
    [recurring],
  );

  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [days, setDays] = useState('30');

  const handleAdd = async () => {
    if (!label.trim() || !recipient.trim() || !amount.trim()) return;
    await addRecurring({
      label: label.trim(),
      amount: amount.trim(),
      chain,
      assetKey,
      recipient: recipient.trim(),
      intervalDays: Math.max(1, parseInt(days, 10) || 30),
    });
    setLabel('');
    setAmount('');
    setRecipient('');
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="Recurring commitment" back />
        <FlatList
          data={recurring}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <SurfaceCard style={styles.form}>
              <ThemedText type="smallBold">New template</ThemedText>
              <TextInput
                value={label}
                onChangeText={setLabel}
                placeholder="Rent, stipend…"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text }]}
              />
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="Amount"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text }]}
              />
              <TextInput
                value={recipient}
                onChangeText={setRecipient}
                placeholder="Recipient address"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                style={[styles.input, { color: theme.text }]}
              />
              <TextInput
                value={days}
                onChangeText={setDays}
                keyboardType="number-pad"
                placeholder="Every N days"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text }]}
              />
              <ThemedText type="small" themeColor="textSecondary">
                Chain: {NETWORK_LABELS[chain]}
              </ThemedText>
              <PrimaryButton label="Save template" onPress={handleAdd} />
            </SurfaceCard>
          }
          renderItem={({ item }) => {
            const due = item.nextDueAt <= Date.now();
            return (
              <SurfaceCard style={styles.row}>
                <ThemedText type="smallBold">
                  {item.label} · {item.amount} USDT
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {due ? 'Due now' : `Next: ${formatRelativeTime(item.nextDueAt)}`}
                </ThemedText>
                <View style={styles.actions}>
                  <PrimaryButton
                    label="Fulfill"
                    onPress={() =>
                      router.push({
                        pathname: '/send',
                        params: {
                          chain: item.chain,
                          assetKey: item.assetKey,
                          recipient: item.recipient,
                          amount: item.amount,
                          commitmentSource: 'recurring',
                          commitmentId: item.id,
                          note: item.label,
                        },
                      })
                    }
                  />
                  <PrimaryButton
                    variant="secondary"
                    label="Mark paid"
                    onPress={() => markRecurringPaid(item.id)}
                  />
                  <PrimaryButton
                    variant="secondary"
                    label="Remove"
                    onPress={() => removeRecurring(item.id)}
                  />
                </View>
              </SurfaceCard>
            );
          }}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  list: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  form: { gap: Spacing.two, marginBottom: Spacing.two },
  input: { fontSize: 16, paddingVertical: Spacing.one },
  row: { gap: Spacing.two },
  actions: { gap: Spacing.two },
});
