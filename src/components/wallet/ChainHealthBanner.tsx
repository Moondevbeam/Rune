import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChainIcon } from '@/components/wallet/ChainIcon';
import { NETWORK_LABELS, type SupportedNetwork } from '@/config/wdk';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { healthLabel, suggestCheaperChain } from '@/services/chainFees';
import { probeAllChains, type ChainHealthEntry } from '@/services/chainHealth';

export type ChainHealthBannerProps = {
  currentChain: SupportedNetwork;
  enabledChains: SupportedNetwork[];
  onSwitchChain?: (chain: SupportedNetwork) => void;
};

export const ChainHealthBanner = ({
  currentChain,
  enabledChains,
  onSwitchChain,
}: ChainHealthBannerProps) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<ChainHealthEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    probeAllChains(enabledChains).then((data) => {
      if (!cancelled) {
        setEntries(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabledChains]);

  const current = entries.find((e) => e.network === currentChain);
  const cheaper = suggestCheaperChain(currentChain, enabledChains);

  if (loading) {
    return (
      <ThemedView type="backgroundElement" style={styles.wrap}>
        <ActivityIndicator size="small" color={theme.accent} />
        <ThemedText type="small" themeColor="textSecondary">
          Checking network health…
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="backgroundElement" style={styles.wrap}>
      <View style={styles.row}>
        <ChainIcon network={currentChain} size={24} />
        <View style={{ flex: 1 }}>
          <ThemedText type="smallBold">{NETWORK_LABELS[currentChain]}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {current
              ? `${healthLabel(current.health)}${current.latencyMs != null ? ` · ${current.latencyMs}ms` : ''}`
              : 'Status unknown'}
          </ThemedText>
        </View>
        {current?.health === 'fast' ? (
          <SymbolView name="checkmark.circle.fill" size={20} tintColor={theme.success} />
        ) : current?.health === 'slow' ? (
          <SymbolView name="exclamationmark.triangle.fill" size={20} tintColor={theme.warning} />
        ) : (
          <SymbolView name="wifi.slash" size={20} tintColor={theme.danger} />
        )}
      </View>

      {cheaper && onSwitchChain ? (
        <Pressable
          onPress={() => onSwitchChain(cheaper)}
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${NETWORK_LABELS[cheaper]} for lower fees`}>
          {({ pressed }) => (
            <ThemedView
              type="backgroundSelected"
              style={[styles.tip, pressed && { opacity: 0.85 }]}>
              <ThemedText type="small" style={{ color: theme.accent, flex: 1 }}>
                Save on USDT fees — try {NETWORK_LABELS[cheaper]} instead
              </ThemedText>
              <SymbolView name="chevron.right" size={12} tintColor={theme.accent} />
            </ThemedView>
          )}
        </Pressable>
      ) : null}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  wrap: {
    padding: Spacing.three,
    borderRadius: 14,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: 10,
    gap: Spacing.one,
  },
});
