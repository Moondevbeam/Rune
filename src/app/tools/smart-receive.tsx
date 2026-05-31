import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChainIcon } from '@/components/wallet/ChainIcon';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { SurfaceCard } from '@/components/wallet/SurfaceCard';
import { NETWORK_LABELS } from '@/config/wdk';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTouchSession } from '@/hooks/use-touch-session';
import { probeAllChains } from '@/services/chainHealth';
import { recommendReceiveChain } from '@/services/smartReceive';
import { usePreferences } from '@/store/preferences';

export default function SmartReceiveScreen() {
  useTouchSession();
  const theme = useTheme();
  const enabledChains = usePreferences((s) => s.enabledChains);
  const [loading, setLoading] = useState(true);
  const [rec, setRec] = useState<ReturnType<typeof recommendReceiveChain> | null>(null);

  useEffect(() => {
    let cancelled = false;
    probeAllChains(enabledChains).then((health) => {
      if (!cancelled) {
        setRec(recommendReceiveChain(enabledChains, health));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabledChains]);

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="Smart receive" back />
        <View style={styles.content}>
          {loading || !rec ? (
            <ActivityIndicator color={theme.accent} size="large" />
          ) : (
            <>
              <SurfaceCard elevated style={styles.card}>
                <ChainIcon network={rec.chain} size={40} />
                <ThemedText type="title">{NETWORK_LABELS[rec.chain]}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.reason}>
                  {rec.reason}
                </ThemedText>
              </SurfaceCard>

              {rec.alternatives.length ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Alternatives:{' '}
                  {rec.alternatives.map((c) => NETWORK_LABELS[c]).join(', ')}
                </ThemedText>
              ) : null}

              <PrimaryButton
                label={`Receive on ${NETWORK_LABELS[rec.chain]}`}
                onPress={() =>
                  router.push({
                    pathname: '/receive/[chain]',
                    params: { chain: rec.chain, smart: '1' },
                  })
                }
              />
            </>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.five,
    alignSelf: 'stretch',
  },
  reason: { textAlign: 'center' },
});
