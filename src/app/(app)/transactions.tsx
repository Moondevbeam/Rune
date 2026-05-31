import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChainIcon } from '@/components/wallet/ChainIcon';
import { EmptyState } from '@/components/wallet/EmptyState';
import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { TxStatusBadge } from '@/components/wallet/TxStatusBadge';
import { NETWORK_LABELS, type SupportedNetwork } from '@/config/wdk';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTouchSession } from '@/hooks/use-touch-session';
import { formatRelativeTime, truncateAddress } from '@/services/formatters';
import { type IndexedTx, useTransactions } from '@/services/indexer';
import { useAllAddresses } from '@/services/wdk';
import { usePreferences } from '@/store/preferences';

type DirectionFilter = 'all' | 'in' | 'out';

export default function TransactionsScreen() {
  useTouchSession();
  const theme = useTheme();
  const enabledChains = usePreferences((s) => s.enabledChains);
  const addresses = useAllAddresses();

  const [chainFilter, setChainFilter] = useState<SupportedNetwork | 'all'>('all');
  const [dirFilter, setDirFilter] = useState<DirectionFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const visibleChain = chainFilter === 'all' ? enabledChains[0] : chainFilter;
  const visibleAddress = visibleChain ? addresses[visibleChain]?.address ?? null : null;
  const query = useTransactions(visibleChain as SupportedNetwork, visibleAddress);

  const transactions = useMemo<IndexedTx[]>(() => {
    const list = query.data ?? [];
    if (dirFilter === 'all') return list;
    return list.filter((t) => (dirFilter === 'in' ? t.direction === 'in' : t.direction === 'out'));
  }, [query.data, dirFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await query.refetch();
    setRefreshing(false);
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="History" />
        <FlatList<IndexedTx>
          data={transactions}
          keyExtractor={(item) => `${item.network}-${item.hash}`}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
          ListHeaderComponent={
            <View style={styles.header}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={[{ key: 'all' as const }, ...enabledChains.map((c) => ({ key: c }))]}
                keyExtractor={(item) => item.key}
                contentContainerStyle={styles.chips}
                renderItem={({ item }) => {
                  const active = chainFilter === item.key;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        item.key === 'all' ? 'All chains' : `Filter ${item.key}`
                      }
                      onPress={() => setChainFilter(item.key)}>
                      {({ pressed }) => (
                        <ThemedView
                          type={active ? 'backgroundSelected' : 'backgroundElement'}
                          style={[styles.chip, pressed && { opacity: 0.85 }]}>
                          {item.key !== 'all' ? (
                            <ChainIcon network={item.key} size={16} />
                          ) : null}
                          <ThemedText type="smallBold">
                            {item.key === 'all' ? 'All chains' : NETWORK_LABELS[item.key]}
                          </ThemedText>
                        </ThemedView>
                      )}
                    </Pressable>
                  );
                }}
              />
              <View style={styles.dirRow}>
                {(['all', 'in', 'out'] as DirectionFilter[]).map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setDirFilter(d)}
                    accessibilityRole="button"
                    accessibilityLabel={`Direction ${d}`}>
                    {({ pressed }) => (
                      <ThemedView
                        type={dirFilter === d ? 'backgroundSelected' : 'backgroundElement'}
                        style={[styles.chip, pressed && { opacity: 0.85 }]}>
                        <ThemedText type="smallBold">
                          {d === 'all' ? 'All' : d === 'in' ? 'Received' : 'Sent'}
                        </ThemedText>
                      </ThemedView>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const isOut = item.direction === 'out';
            return (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/tx/[network]/[hash]',
                    params: { network: item.network, hash: item.hash },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Transaction ${item.hash}`}>
                {({ pressed }) => (
                  <ThemedView
                    type="backgroundElement"
                    style={[styles.txRow, pressed && { opacity: 0.85 }]}>
                    <ChainIcon network={item.network} size={40} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.txTop}>
                        <ThemedText type="smallBold">
                          {isOut ? 'Sent' : 'Received'} {item.symbol}
                        </ThemedText>
                        <ThemedText
                          type="smallBold"
                          style={{ color: isOut ? theme.danger : theme.success }}>
                          {item.amount} {item.symbol}
                        </ThemedText>
                      </View>
                      <View style={styles.txBottom}>
                        <ThemedText type="small" themeColor="textSecondary">
                          {truncateAddress(isOut ? item.to : item.from, 4)} ·{' '}
                          {formatRelativeTime(item.timestamp)}
                        </ThemedText>
                        <TxStatusBadge status={item.status} />
                      </View>
                    </View>
                  </ThemedView>
                )}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            query.isLoading ? (
              <View style={styles.center}>
                <ActivityIndicator color={theme.accent} />
              </View>
            ) : (
              <EmptyState
                icon="clock.arrow.circlepath"
                title="No transactions yet"
                description="Once you send or receive assets, your activity will appear here."
              />
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.accent}
            />
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
    gap: Spacing.two,
  },
  chips: { gap: Spacing.two, paddingVertical: Spacing.one },
  dirRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  txRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 14,
    alignItems: 'center',
  },
  txTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  empty: { textAlign: 'center', paddingVertical: Spacing.six },
  center: { paddingVertical: Spacing.six, alignItems: 'center' },
});
