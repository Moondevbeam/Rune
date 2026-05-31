import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChainIcon } from '@/components/wallet/ChainIcon';
import { FeeRow } from '@/components/wallet/FeeRow';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { TxStatusBadge } from '@/components/wallet/TxStatusBadge';
import {
  NETWORK_EXPLORERS,
  NETWORK_LABELS,
  SUPPORTED_NETWORKS,
  type SupportedNetwork,
} from '@/config/wdk';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTouchSession } from '@/hooks/use-touch-session';
import { formatRelativeTime, truncateAddress } from '@/services/formatters';
import { buildProofOfPaymentText } from '@/services/proofOfPayment';
import { useTransactions } from '@/services/indexer';
import { useAllAddresses } from '@/services/wdk';

const isSupported = (v: unknown): v is SupportedNetwork =>
  typeof v === 'string' && (SUPPORTED_NETWORKS as string[]).includes(v);

export default function TxDetailScreen() {
  useTouchSession();
  const theme = useTheme();
  const params = useLocalSearchParams<{ network?: string; hash?: string }>();
  const network = isSupported(params.network) ? params.network : null;
  const hash = typeof params.hash === 'string' ? params.hash : null;
  const addresses = useAllAddresses();
  const address = network ? addresses[network]?.address ?? null : null;

  const txQuery = useTransactions(network ?? 'ethereum', address);
  const tx = txQuery.data?.find((t) => t.hash === hash);

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader
          title="Transaction"
          back
          right={
            <SymbolView
              name="xmark.circle.fill"
              size={24}
              tintColor={theme.textSecondary}
              onAccessibilityAction={() => router.back()}
            />
          }
        />

        {!tx ? (
          <View style={styles.center}>
            <ThemedText type="small" themeColor="textSecondary">
              Loading transaction…
            </ThemedText>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.heroRow}>
              <ChainIcon network={tx.network} size={48} />
              <View style={{ flex: 1 }}>
                <ThemedText type="subtitle">
                  {tx.direction === 'out' ? 'Sent' : 'Received'} {tx.symbol}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {NETWORK_LABELS[tx.network]}
                </ThemedText>
              </View>
              <ThemedText
                type="subtitle"
                style={{ color: tx.direction === 'out' ? theme.danger : theme.success }}>
                {tx.amount}
              </ThemedText>
            </View>

            <TxStatusBadge status={tx.status} />

            <FeeRow label="From" value={truncateAddress(tx.from, 6)} />
            <FeeRow label="To" value={truncateAddress(tx.to, 6)} />
            {tx.fee ? (
              <FeeRow
                label="Network fee"
                value={`${tx.fee} ${tx.feeSymbol ?? tx.symbol}`}
              />
            ) : null}
            <FeeRow label="Time" value={formatRelativeTime(tx.timestamp)} />
            <FeeRow label="Tx hash" value={truncateAddress(tx.hash, 8)} />

            <View style={{ gap: Spacing.two, marginTop: Spacing.three }}>
              <PrimaryButton
                variant="secondary"
                label="Proof of payment"
                onPress={async () => {
                  const text = buildProofOfPaymentText(tx);
                  await Clipboard.setStringAsync(text);
                  if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(`data:text/plain,${encodeURIComponent(text)}`, {
                      dialogTitle: 'Proof of payment',
                      mimeType: 'text/plain',
                    });
                  }
                }}
              />
              <PrimaryButton
                variant="secondary"
                label="Copy hash"
                onPress={() => Clipboard.setStringAsync(tx.hash)}
              />
              <PrimaryButton
                label="View on explorer"
                onPress={() => Linking.openURL(NETWORK_EXPLORERS[tx.network](tx.hash))}
              />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginVertical: Spacing.three,
  },
});
