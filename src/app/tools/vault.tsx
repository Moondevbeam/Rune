import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { SurfaceCard } from '@/components/wallet/SurfaceCard';
import { NETWORK_LABELS, SUPPORTED_NETWORKS, type SupportedNetwork } from '@/config/wdk';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTouchSession } from '@/hooks/use-touch-session';
import { formatFiat } from '@/services/formatters';
import { useUseCasesStore } from '@/store/use-cases';
import { usePreferences } from '@/store/preferences';

export default function VaultScreen() {
  useTouchSession();
  const theme = useTheme();
  const fiat = usePreferences((s) => s.fiat);
  const setVault = useUseCasesStore((s) => s.setVault);
  const getVault = useUseCasesStore((s) => s.getVault);

  const [chain, setChain] = useState<SupportedNetwork>('polygon');
  const [limit, setLimit] = useState('');

  const vault = getVault(chain);

  const handleSave = async () => {
    const monthlyLimitFiat = parseFloat(limit) || 0;
    if (monthlyLimitFiat <= 0) return;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await setVault({
      chain,
      monthlyLimitFiat,
      spentFiatThisMonth: vault?.spentFiatThisMonth ?? 0,
      monthKey,
    });
    setLimit('');
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="Spending vault" back />
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="small" themeColor="textSecondary">
            Set a monthly spending cap per chain. Outgoing sends warn you before you exceed
            the vault (tracked locally in {fiat}).
          </ThemedText>

          <View style={styles.chains}>
            {SUPPORTED_NETWORKS.map((c) => (
              <PrimaryButton
                key={c}
                variant={c === chain ? 'primary' : 'secondary'}
                label={NETWORK_LABELS[c]}
                onPress={() => setChain(c)}
              />
            ))}
          </View>

          {vault ? (
            <SurfaceCard elevated>
              <ThemedText type="smallBold">{NETWORK_LABELS[chain]} vault</ThemedText>
              <ThemedText type="title">
                {formatFiat(vault.spentFiatThisMonth, fiat)} /{' '}
                {formatFiat(vault.monthlyLimitFiat, fiat)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Resets monthly · {vault.monthKey}
              </ThemedText>
            </SurfaceCard>
          ) : null}

          <SurfaceCard style={styles.form}>
            <ThemedText type="smallBold">Monthly cap ({fiat})</ThemedText>
            <TextInput
              value={limit}
              onChangeText={setLimit}
              keyboardType="decimal-pad"
              placeholder="500"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
            />
            <PrimaryButton label="Save vault" onPress={handleSave} />
          </SurfaceCard>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  chains: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  form: { gap: Spacing.two },
  input: { fontSize: 16, paddingVertical: Spacing.one },
});
