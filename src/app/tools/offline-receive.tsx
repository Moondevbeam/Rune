import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { QRCard } from '@/components/wallet/QRCard';
import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { NETWORK_LABELS } from '@/config/wdk';
import { Spacing } from '@/constants/theme';
import { useTouchSession } from '@/hooks/use-touch-session';
import { useAllAddresses } from '@/services/wdk';
import { usePreferences } from '@/store/preferences';

export default function OfflineReceiveScreen() {
  useTouchSession();
  const enabledChains = usePreferences((s) => s.enabledChains);
  const addresses = useAllAddresses();

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="Offline receive" back />
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="small" themeColor="textSecondary">
            Addresses are derived on-device. No balance fetch — share these QR codes even
            without network access.
          </ThemedText>
          {enabledChains.map((chain) => {
            const addr = addresses[chain]?.address;
            if (!addr) {
              return (
                <ThemedView key={chain} type="backgroundElement" style={styles.missing}>
                  <ThemedText type="smallBold">{NETWORK_LABELS[chain]}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Address not ready
                  </ThemedText>
                </ThemedView>
              );
            }
            return (
              <View key={chain} style={styles.block}>
                <QRCard network={chain} address={addr} caption="Static receive QR" />
                <PrimaryButton
                  variant="secondary"
                  label={`Open ${NETWORK_LABELS[chain]} receive`}
                  onPress={() =>
                    router.push({ pathname: '/receive/[chain]', params: { chain } })
                  }
                />
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  block: { gap: Spacing.two },
  missing: {
    padding: Spacing.three,
    borderRadius: 14,
    gap: Spacing.one,
  },
});
