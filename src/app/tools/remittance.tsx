import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChainIcon } from '@/components/wallet/ChainIcon';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { SurfaceCard } from '@/components/wallet/SurfaceCard';
import { NETWORK_LABELS, type SupportedNetwork } from '@/config/wdk';
import { Spacing } from '@/constants/theme';
import { useTouchSession } from '@/hooks/use-touch-session';
import { rankChainsForUsdt } from '@/services/chainHealth';
import { buildRemittanceSummary } from '@/services/proofOfPayment';
import { usePreferences } from '@/store/preferences';

type Step = 1 | 2 | 3;

export default function RemittanceScreen() {
  useTouchSession();
  const enabled = usePreferences((s) => s.enabledChains);
  const ranked = useMemo(() => rankChainsForUsdt(enabled), [enabled]);

  const [step, setStep] = useState<Step>(1);
  const [source, setSource] = useState<SupportedNetwork>(ranked[ranked.length - 1] ?? 'ethereum');
  const [bridge, setBridge] = useState<SupportedNetwork>(ranked[0] ?? 'tron');
  const [destination, setDestination] = useState<SupportedNetwork>(ranked[1] ?? 'ton');

  const summary = buildRemittanceSummary({ source, bridge, destination });

  const pick = (network: SupportedNetwork) => {
    if (step === 1) {
      setSource(network);
      setStep(2);
      return;
    }
    if (step === 2) {
      setBridge(network);
      setStep(3);
      return;
    }
    setDestination(network);
  };

  const handleShare = async () => {
    await Clipboard.setStringAsync(summary);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(`data:text/plain,${encodeURIComponent(summary)}`, {
        dialogTitle: 'Remittance plan',
        mimeType: 'text/plain',
      });
    }
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="Remittance lane" back />
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="small" themeColor="textSecondary">
            Step {step} of 3 — pick source, low-fee rail, then destination network.
          </ThemedText>

          {step === 1 ? (
            <ThemedText type="smallBold">Where do you hold USDT today?</ThemedText>
          ) : null}
          {step === 2 ? (
            <ThemedText type="smallBold">Preferred low-fee rail</ThemedText>
          ) : null}
          {step === 3 ? (
            <ThemedText type="smallBold">Recipient network</ThemedText>
          ) : null}

          {enabled.map((network) => (
            <PrimaryButton
              key={network}
              variant="secondary"
              label={NETWORK_LABELS[network]}
              onPress={() => pick(network)}
            />
          ))}

          {step === 3 ? (
            <SurfaceCard elevated style={styles.plan}>
              <View style={styles.lane}>
                <ChainIcon network={source} size={28} />
                <ThemedText type="small">→</ThemedText>
                <ChainIcon network={bridge} size={28} />
                <ThemedText type="small">→</ThemedText>
                <ChainIcon network={destination} size={28} />
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {summary}
              </ThemedText>
              <PrimaryButton label="Copy plan" onPress={handleShare} />
            </SurfaceCard>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.two, paddingBottom: Spacing.six },
  plan: { gap: Spacing.three, marginTop: Spacing.three },
  lane: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
