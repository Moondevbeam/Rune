import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ChainIcon } from '@/components/wallet/ChainIcon';
import { NETWORK_COLORS, NETWORK_LABELS, type SupportedNetwork } from '@/config/wdk';
import { Elevation, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatPercent } from '@/services/formatters';

export type TokenRowProps = {
  symbol: string;
  name: string;
  network: SupportedNetwork;
  cryptoAmount: string;
  fiatAmount: string;
  change24h?: number;
  onPress?: () => void;
};

const ASSET_GLYPH_PALETTE: Record<string, string> = {
  USDT: '#26A17B',
  ETH: '#627EEA',
  MATIC: '#8247E5',
  BNB: '#F0B90B',
  TRX: '#EF0027',
  TON: '#0098EA',
};

export const TokenRow = ({
  symbol,
  name,
  network,
  cryptoAmount,
  fiatAmount,
  change24h,
  onPress,
}: TokenRowProps) => {
  const theme = useTheme();
  const changeColor =
    change24h == null ? theme.textSecondary : change24h >= 0 ? theme.success : theme.danger;
  const glyph = ASSET_GLYPH_PALETTE[symbol] ?? NETWORK_COLORS[network];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name} on ${NETWORK_LABELS[network]}, balance ${cryptoAmount} ${symbol}`}>
      {({ pressed }) => (
        <View
          style={[
            styles.row,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
            Elevation,
            pressed && { opacity: 0.85 },
          ]}>
          <View style={styles.iconStack}>
            <View
              style={[
                styles.assetGlyph,
                { backgroundColor: glyph },
              ]}>
              <ThemedText
                type="smallBold"
                style={{ color: '#fff' }}>
                {symbol.slice(0, 3)}
              </ThemedText>
            </View>
            <View
              style={[
                styles.chainBadge,
                { borderColor: theme.surface },
              ]}>
              <ChainIcon network={network} size={18} />
            </View>
          </View>

          <View style={styles.middle}>
            <ThemedText type="default" numberOfLines={1}>
              {symbol}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {name} · {NETWORK_LABELS[network]}
            </ThemedText>
          </View>
          <View style={styles.right}>
            <ThemedText type="default" numberOfLines={1}>
              {cryptoAmount}
            </ThemedText>
            <View style={styles.rightMeta}>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {fiatAmount}
              </ThemedText>
              {change24h != null && change24h !== 0 ? (
                <ThemedText type="small" style={{ color: changeColor }}>
                  {formatPercent(change24h)}
                </ThemedText>
              ) : null}
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
  },
  iconStack: {
    width: 44,
    height: 44,
    position: 'relative',
  },
  assetGlyph: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chainBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderRadius: 11,
    borderWidth: 2,
  },
  middle: {
    flex: 1,
    gap: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  rightMeta: {
    flexDirection: 'row',
    gap: Spacing.one,
    alignItems: 'center',
  },
});
