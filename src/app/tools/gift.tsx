import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, TextInput, View } from 'react-native';
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
import { useUseCasesStore } from '@/store/use-cases';
import { usePreferences } from '@/store/preferences';

const EXPIRY_DAYS = 7;

export default function GiftEnvelopeScreen() {
  useTouchSession();
  const theme = useTheme();
  const enabledChains = usePreferences((s) => s.enabledChains);
  const defaultChain = rankChainsForUsdt(enabledChains)[0] ?? 'tron';
  const envelopes = useUseCasesStore((s) => s.envelopes);
  const addEnvelope = useUseCasesStore((s) => s.addEnvelope);
  const updateEnvelope = useUseCasesStore((s) => s.updateEnvelope);

  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [chain, setChain] = useState<SupportedNetwork>(defaultChain);
  const [lastLink, setLastLink] = useState<string | null>(null);

  const handleCreate = async () => {
    const entry = await addEnvelope({
      amount: amount.trim(),
      chain,
      symbol: 'USDT',
      message: message.trim() || undefined,
      expiresAt: Date.now() + EXPIRY_DAYS * 86_400_000,
    });
    const link = Linking.createURL(`/receive/${chain}`, {
      queryParams: { envelope: entry.id, amount: entry.amount },
    });
    setLastLink(link);
    await Clipboard.setStringAsync(
      `Rune gift: ${entry.amount} USDT on ${NETWORK_LABELS[chain]}${message ? ` — ${message}` : ''}\n${link}`,
    );
    setAmount('');
    setMessage('');
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="Gift commitment" back />
        <ScrollView contentContainerStyle={styles.content}>
          <SurfaceCard style={styles.form}>
            <ThemedText type="smallBold">Create envelope</ThemedText>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="Amount (USDT)"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
            />
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Optional message"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
            />
            <View style={styles.chainRow}>
              {enabledChains.map((c) => (
                <PrimaryButton
                  key={c}
                  variant={c === chain ? 'primary' : 'secondary'}
                  label={NETWORK_LABELS[c]}
                  onPress={() => setChain(c)}
                />
              ))}
            </View>
            <PrimaryButton label="Create & copy link" onPress={handleCreate} disabled={!amount} />
            {lastLink ? (
              <ThemedText type="small" themeColor="textSecondary" selectable>
                Link copied: {lastLink}
              </ThemedText>
            ) : null}
          </SurfaceCard>

          <ThemedText type="smallBold">Your envelopes</ThemedText>
          <FlatList
            scrollEnabled={false}
            data={envelopes}
            keyExtractor={(e) => e.id}
            ListEmptyComponent={
              <ThemedText type="small" themeColor="textSecondary">
                No envelopes yet.
              </ThemedText>
            }
            renderItem={({ item }) => (
              <SurfaceCard style={styles.row}>
                <ThemedText type="smallBold">
                  {item.amount} {item.symbol} · {NETWORK_LABELS[item.chain]}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.status} · expires {new Date(item.expiresAt).toLocaleDateString()}
                </ThemedText>
                {item.message ? (
                  <ThemedText type="small">{item.message}</ThemedText>
                ) : null}
                {item.status === 'pending' ? (
                  <PrimaryButton
                    variant="secondary"
                    label="Mark received"
                    onPress={() => updateEnvelope(item.id, 'received')}
                  />
                ) : null}
              </SurfaceCard>
            )}
          />
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
  chainRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  row: { gap: Spacing.one, marginBottom: Spacing.two },
});
