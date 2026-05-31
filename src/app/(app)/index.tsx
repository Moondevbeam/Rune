import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ActionShortcut } from '@/components/wallet/ActionShortcut';
import { AmbientBackground } from '@/components/wallet/AmbientBackground';
import { CommitmentCard } from '@/components/wallet/CommitmentCard';
import { EmptyState } from '@/components/wallet/EmptyState';
import { GlassCard } from '@/components/wallet/GlassCard';
import { Radius, Spacing } from '@/constants/theme';
import { useActivePalette, useResolvedScheme, useTheme } from '@/hooks/use-theme';
import { useTouchSession } from '@/hooks/use-touch-session';
import { aggregateCommitments, type Commitment } from '@/services/commitments';
import { formatFiat, truncateAddress } from '@/services/formatters';
import { useAllAddresses, useWalletPortfolio, throttledBalanceRefetch } from '@/services/wdk';
import { usePreferences } from '@/store/preferences';
import { useUseCasesStore } from '@/store/use-cases';

export default function HomeScreen() {
  useTouchSession();
  const theme = useTheme();
  const palette = useActivePalette();
  const scheme = useResolvedScheme();
  const fiat = usePreferences((s) => s.fiat);
  const envelopes = useUseCasesStore((s) => s.envelopes);
  const splits = useUseCasesStore((s) => s.splits);
  const recurring = useUseCasesStore((s) => s.recurring);
  const custom = useUseCasesStore((s) => s.custom);
  const { totalFiat, isLoading, refetch } = useWalletPortfolio();
  const addresses = useAllAddresses();
  const [refreshing, setRefreshing] = useState(false);

  const heroVariant = palette[scheme];
  const primaryAddress = addresses.ethereum.address;

  const buckets = useMemo(
    () => aggregateCommitments({ envelopes, splits, recurring, custom }),
    [envelopes, splits, recurring, custom],
  );

  const featured = useMemo(() => {
    const seen = new Set<string>();
    const items: Commitment[] = [];
    for (const c of [...buckets.due, ...buckets.incoming, ...buckets.upcoming]) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      items.push(c);
      if (items.length >= 5) break;
    }
    return items;
  }, [buckets]);

  const activeCount = buckets.all.length;
  const statusLine = buckets.due.length
    ? `${buckets.due.length} due now`
    : buckets.incoming.length
      ? `${buckets.incoming.length} awaiting payment`
      : 'All caught up';

  const handleRefresh = async () => {
    setRefreshing(true);
    await throttledBalanceRefetch(refetch);
    setRefreshing(false);
  };

  return (
    <ThemedView style={styles.root}>
      <AmbientBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.accent}
            />
          }>
          <Animated.View entering={FadeInDown.duration(500)}>
            <View style={styles.greetingRow}>
              <View>
                <ThemedText type="overline" themeColor="textSecondary">
                  Rune
                </ThemedText>
                <ThemedText type="headline">Your commitments</ThemedText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Refresh"
                onPress={handleRefresh}
                hitSlop={12}>
                {({ pressed }) => (
                  <View
                    style={[
                      styles.refreshChip,
                      { backgroundColor: theme.backgroundElement },
                      pressed && { opacity: 0.7 },
                    ]}>
                    <SymbolView name="arrow.clockwise" size={16} tintColor={theme.accent} />
                  </View>
                )}
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(550)}>
            <LinearGradient
              colors={[heroVariant.gradientStart, heroVariant.gradientEnd, `${heroVariant.gradientEnd}DD`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1.2 }}
              style={styles.hero}>
              <View style={styles.heroGlow} />
              <ThemedText type="overline" style={{ color: heroVariant.accentText, opacity: 0.75 }}>
                Active now
              </ThemedText>
              <ThemedText type="display" style={{ color: heroVariant.accentText }}>
                {activeCount}
              </ThemedText>
              <ThemedText type="caption" style={{ color: heroVariant.accentText, opacity: 0.82 }}>
                {statusLine}
              </ThemedText>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View portfolio balance"
                onPress={() => router.push('/(app)/portfolio')}
                style={styles.balanceGlass}>
                <View>
                  <ThemedText type="overline" style={{ color: heroVariant.accentText, opacity: 0.7 }}>
                    Total balance
                  </ThemedText>
                  <ThemedText
                    type="title"
                    style={{ color: heroVariant.accentText, fontVariant: ['tabular-nums'] }}>
                    {isLoading ? '—' : formatFiat(totalFiat, fiat)}
                  </ThemedText>
                  {primaryAddress ? (
                    <ThemedText
                      type="caption"
                      style={{ color: heroVariant.accentText, opacity: 0.65 }}>
                      {truncateAddress(primaryAddress, 4)}
                    </ThemedText>
                  ) : null}
                </View>
                <View style={styles.balanceChevron}>
                  <SymbolView name="chevron.right" size={14} tintColor={heroVariant.accentText} />
                </View>
              </Pressable>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(140).duration(550)}>
            <GlassCard style={styles.actionDock} noShadow>
              <View style={styles.actions}>
                <ActionShortcut
                  label="New"
                  icon="plus"
                  tint={theme.accent}
                  onPress={() => router.push('/tools/new-commitment' as Href)}
                />
                <ActionShortcut
                  label="Fulfill"
                  icon="arrow.up.right"
                  tint={theme.danger}
                  onPress={() =>
                    buckets.due[0]
                      ? router.push({
                          pathname: '/send',
                          params: {
                            chain: buckets.due[0].chain,
                            assetKey: buckets.due[0].assetKey,
                            recipient: buckets.due[0].recipient ?? '',
                            amount: buckets.due[0].amount,
                            commitmentSource: buckets.due[0].ref.source,
                            commitmentId:
                              buckets.due[0].ref.source === 'split'
                                ? undefined
                                : buckets.due[0].ref.id,
                            note: buckets.due[0].title,
                          },
                        })
                      : router.push('/send')
                  }
                />
                <ActionShortcut
                  label="Request"
                  icon="arrow.down.left"
                  tint={theme.success}
                  onPress={() => router.push('/tools/smart-receive')}
                />
              </View>
            </GlassCard>
          </Animated.View>

          {featured.length ? (
            <Animated.View entering={FadeInDown.delay(200).duration(550)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="overline" themeColor="textSecondary">
                  Priority
                </ThemedText>
                <Pressable
                  onPress={() => router.push('/tools')}
                  accessibilityRole="link"
                  accessibilityLabel="Manage all commitments">
                  <ThemedText type="captionBold" style={{ color: theme.accent }}>
                    See all
                  </ThemedText>
                </Pressable>
              </View>
              {featured.map((item, index) => (
                <Animated.View key={item.id} entering={FadeInDown.delay(240 + index * 60).duration(450)}>
                  <CommitmentCard commitment={item} />
                </Animated.View>
              ))}
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(200).duration(550)}>
              <EmptyState
                icon="hand.raised.fill"
                title="No commitments yet"
                description="Create a payment promise — rent, a gift, split bill, or anything you owe or are owed."
                cta={{
                  label: 'New commitment',
                  onPress: () => router.push('/tools/new-commitment' as Href),
                }}
              />
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(300).duration(550)}>
            <Pressable
              onPress={() => router.push('/tools')}
              accessibilityRole="button"
              accessibilityLabel="Open commitment templates">
              {({ pressed }) => (
                <GlassCard style={[styles.toolsRow, pressed && { opacity: 0.92 }]}>
                  <LinearGradient
                    colors={[`${theme.accent}33`, `${theme.accent}10`]}
                    style={styles.toolsIcon}>
                    <SymbolView name="square.grid.2x2.fill" size={18} tintColor={theme.accent} />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="subtitle">Templates & tools</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      Split bill, gift, recurring, remittance…
                    </ThemedText>
                  </View>
                  <SymbolView name="chevron.right" size={12} tintColor={theme.textSecondary} />
                </GlassCard>
              )}
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  refreshChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    borderRadius: Radius.xxl,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four + 4,
    gap: Spacing.one,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -60,
    right: -40,
  },
  balanceGlass: {
    marginTop: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  balanceChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDock: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  section: { gap: Spacing.three },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  toolsIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
