import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChainIcon } from '@/components/wallet/ChainIcon';
import { EmptyState } from '@/components/wallet/EmptyState';
import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { TokenRow } from '@/components/wallet/TokenRow';
import { NETWORK_LABELS, type SupportedNetwork } from '@/config/wdk';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTouchSession } from '@/hooks/use-touch-session';
import { formatFiat } from '@/services/formatters';
import { useWalletPortfolio, type EnrichedAsset } from '@/services/wdk';
import { usePreferences } from '@/store/preferences';

export default function PortfolioScreen() {
  useTouchSession();
  const theme = useTheme();
  const fiat = usePreferences((s) => s.fiat);
  const enabledChains = usePreferences((s) => s.enabledChains);
  const { assets, totalFiat, isLoading } = useWalletPortfolio();
  const [filter, setFilter] = useState<SupportedNetwork | 'all'>('all');

  const filtered = filter === 'all' ? assets : assets.filter((a) => a.network === filter);

  const renderItem = ({ item }: { item: EnrichedAsset }) => (
    <TokenRow
      symbol={item.symbol}
      name={item.name}
      network={item.network}
      cryptoAmount={item.cryptoAmount}
      fiatAmount={formatFiat(item.fiatAmountNumber, fiat)}
      onPress={() =>
        router.push({ pathname: '/receive/[chain]', params: { chain: item.network } })
      }
    />
  );

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Portfolio" />
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText type="small" themeColor="textSecondary">
                Total balance
              </ThemedText>
              <ThemedText type="title">{formatFiat(totalFiat, fiat)}</ThemedText>

              <FlatList
                horizontal
                data={[{ key: 'all' as const }, ...enabledChains.map((c) => ({ key: c }))]}
                keyExtractor={(item) => item.key}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
                renderItem={({ item }) => {
                  const isActive = filter === item.key;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        item.key === 'all' ? 'Show all chains' : `Filter ${item.key}`
                      }
                      onPress={() => setFilter(item.key)}>
                      {({ pressed }) => (
                        <ThemedView
                          type={isActive ? 'backgroundSelected' : 'backgroundElement'}
                          style={[styles.chip, pressed && { opacity: 0.85 }]}>
                          {item.key !== 'all' ? <ChainIcon network={item.key} size={18} /> : null}
                          <ThemedText
                            type="smallBold"
                            style={{ color: isActive ? theme.text : theme.textSecondary }}>
                            {item.key === 'all' ? 'All' : NETWORK_LABELS[item.key]}
                          </ThemedText>
                        </ThemedView>
                      )}
                    </Pressable>
                  );
                }}
              />
            </View>
          }
          ListEmptyComponent={
            isLoading ? (
              <EmptyState
                icon="hourglass"
                title="Loading assets"
                description="Fetching balances from each enabled network."
              />
            ) : (
              <EmptyState
                icon="line.3.horizontal.decrease.circle"
                title={
                  filter === 'all' ? 'No assets to show' : `No ${NETWORK_LABELS[filter]} assets`
                }
                description={
                  filter === 'all'
                    ? 'Receive USDT or any supported asset to get started.'
                    : 'Switch chain or receive an asset on this network.'
                }
                cta={
                  filter === 'all'
                    ? { label: 'Receive', onPress: () => router.push('/receive/ethereum') }
                    : undefined
                }
              />
            )
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  list: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
  },
  header: {
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  chips: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.six,
  },
});
