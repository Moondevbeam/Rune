import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { ThemedText } from '@/components/themed-text';
import { ChainIcon } from '@/components/wallet/ChainIcon';
import { SurfaceCard } from '@/components/wallet/SurfaceCard';
import { NETWORK_LABELS, type SupportedNetwork } from '@/config/wdk';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type QRCardProps = {
  network: SupportedNetwork;
  address: string;
  /** Shown above the QR (e.g. requested amount). */
  caption?: string;
  amountLabel?: string;
};

export const QRCard = ({ network, address, caption, amountLabel }: QRCardProps) => {
  const theme = useTheme();

  return (
    <SurfaceCard elevated style={styles.card}>
      <View style={styles.header}>
        <ChainIcon network={network} size={28} />
        <View style={{ alignItems: 'center' }}>
          <ThemedText type="smallBold">{NETWORK_LABELS[network]}</ThemedText>
          {caption ? (
            <ThemedText type="small" themeColor="textSecondary">
              {caption}
            </ThemedText>
          ) : null}
        </View>
      </View>
      {amountLabel ? (
        <ThemedText type="title" style={{ color: theme.accent }}>
          {amountLabel}
        </ThemedText>
      ) : null}
      <View style={styles.qrWrap}>
        <QRCode value={address} size={220} backgroundColor="#fff" color="#000" />
      </View>
      <ThemedText
        type="small"
        themeColor="textSecondary"
        style={{ textAlign: 'center', color: theme.textSecondary }}
        selectable
        numberOfLines={2}>
        {address}
      </ThemedText>
    </SurfaceCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  qrWrap: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    backgroundColor: '#fff',
  },
});
