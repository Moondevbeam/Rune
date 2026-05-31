/**
 * Swap (preview)
 *
 * The WDK swap protocol package `@tetherto/wdk-protocol-swap-velora-evm` pulls
 * an `ox` preview build from `pkg.pr.new` whose URL is currently returning 403,
 * so it cannot be installed against the public registry. This screen lays out
 * the full swap UX so the bundling problem is the only thing in the way once
 * the upstream dependency is unpinned — the Velora client can drop in behind
 * `executeQuote` without touching the rest of the file.
 */
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChainIcon } from '@/components/wallet/ChainIcon';
import { FeeRow } from '@/components/wallet/FeeRow';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { ASSETS, type AssetKey } from '@/config/wdk';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTouchSession } from '@/hooks/use-touch-session';
import { formatFiat } from '@/services/formatters';
import { fiatValue, usePrices } from '@/services/prices';
import { usePreferences } from '@/store/preferences';

const SWAP_PAIRS: { from: AssetKey; to: AssetKey }[] = [
  { from: 'eth', to: 'usdtEth' },
  { from: 'usdtEth', to: 'eth' },
  { from: 'matic', to: 'usdtPolygon' },
  { from: 'bnb', to: 'usdtBsc' },
];

const DEFAULT_SLIPPAGE = 0.5;

export default function SwapScreen() {
  useTouchSession();
  const theme = useTheme();
  const fiat = usePreferences((s) => s.fiat);
  const prices = usePrices(fiat);
  const [pairIndex, setPairIndex] = useState(0);
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState<number>(DEFAULT_SLIPPAGE);

  const pair = SWAP_PAIRS[pairIndex];
  const fromAsset = ASSETS[pair.from];
  const toAsset = ASSETS[pair.to];

  const fromPrice = prices.data?.[fromAsset.getSymbol()] ?? 0;
  const toPrice = prices.data?.[toAsset.getSymbol()] ?? 0;

  const estimatedOut = useMemo(() => {
    const n = Number(amount) || 0;
    if (!fromPrice || !toPrice) return 0;
    return (n * fromPrice) / toPrice;
  }, [amount, fromPrice, toPrice]);

  const minReceived = useMemo(
    () => estimatedOut * (1 - slippage / 100),
    [estimatedOut, slippage],
  );

  const handleSwapPair = () => {
    const reversed = SWAP_PAIRS.findIndex(
      (p) => p.from === pair.to && p.to === pair.from,
    );
    if (reversed >= 0) setPairIndex(reversed);
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Swap" />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedView type="backgroundElement" style={styles.banner}>
            <SymbolView name="info.circle.fill" size={18} tintColor={theme.warning} />
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold">Swap coming soon</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Quotes are shown for preview only. Execution will be enabled once the WDK Velora
                swap protocol module is installable.
              </ThemedText>
            </View>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.tokenCard}>
            <ThemedText type="small" themeColor="textSecondary">
              You pay
            </ThemedText>
            <View style={styles.row}>
              <View style={styles.tokenInfo}>
                <ChainIcon network={fromAsset.getNetwork() as never} size={32} />
                <View>
                  <ThemedText type="default">{fromAsset.getSymbol()}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {fromAsset.getName()}
                  </ThemedText>
                </View>
              </View>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
                style={[styles.amountInput, { color: theme.text }]}
                accessibilityLabel="From amount"
              />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              ≈ {formatFiat(fiatValue(prices.data, fromAsset.getSymbol(), Number(amount) || 0), fiat)}
            </ThemedText>
          </ThemedView>

          <View style={styles.swapButtonRow}>
            <Pressable
              onPress={handleSwapPair}
              accessibilityRole="button"
              accessibilityLabel="Swap pair direction">
              {({ pressed }) => (
                <ThemedView
                  type="backgroundSelected"
                  style={[styles.swapButton, pressed && { opacity: 0.85 }]}>
                  <SymbolView
                    name="arrow.up.arrow.down"
                    size={18}
                    tintColor={theme.text}
                  />
                </ThemedView>
              )}
            </Pressable>
          </View>

          <ThemedView type="backgroundElement" style={styles.tokenCard}>
            <ThemedText type="small" themeColor="textSecondary">
              You receive
            </ThemedText>
            <View style={styles.row}>
              <View style={styles.tokenInfo}>
                <ChainIcon network={toAsset.getNetwork() as never} size={32} />
                <View>
                  <ThemedText type="default">{toAsset.getSymbol()}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {toAsset.getName()}
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="default">{estimatedOut.toFixed(6)}</ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              ≈ {formatFiat(fiatValue(prices.data, toAsset.getSymbol(), estimatedOut), fiat)}
            </ThemedText>
          </ThemedView>

          <FeeRow
            label="Slippage tolerance"
            value={`${slippage.toFixed(2)}%`}
            hint="Tap a preset to change"
          />
          <View style={styles.slippageRow}>
            {[0.1, 0.5, 1, 2].map((s) => (
              <Pressable
                key={s}
                onPress={() => setSlippage(s)}
                accessibilityRole="button"
                accessibilityLabel={`Slippage ${s}%`}>
                {({ pressed }) => (
                  <ThemedView
                    type={s === slippage ? 'backgroundSelected' : 'backgroundElement'}
                    style={[styles.slippageChip, pressed && { opacity: 0.85 }]}>
                    <ThemedText type="small">{s.toFixed(1)}%</ThemedText>
                  </ThemedView>
                )}
              </Pressable>
            ))}
          </View>

          <FeeRow
            label="Minimum received"
            value={`${minReceived.toFixed(6)} ${toAsset.getSymbol()}`}
            emphasis
          />
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label="Coming soon"
            disabled
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
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
  },
  tokenCard: {
    padding: Spacing.three,
    borderRadius: 16,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  amountInput: {
    fontSize: 28,
    fontWeight: '600',
    minWidth: 140,
    textAlign: 'right',
  },
  swapButtonRow: {
    alignItems: 'center',
    marginVertical: -Spacing.two,
  },
  swapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slippageRow: { flexDirection: 'row', gap: Spacing.two },
  slippageChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  footer: { padding: Spacing.four },
});
