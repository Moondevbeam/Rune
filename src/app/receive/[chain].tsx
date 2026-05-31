import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChainIcon } from '@/components/wallet/ChainIcon';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { QRCard } from '@/components/wallet/QRCard';
import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { NETWORK_LABELS, SUPPORTED_NETWORKS, type SupportedNetwork } from '@/config/wdk';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTouchSession } from '@/hooks/use-touch-session';
import { probeAllChains } from '@/services/chainHealth';
import { recommendReceiveChain } from '@/services/smartReceive';
import { useAllAddresses } from '@/services/wdk';
import { usePreferences } from '@/store/preferences';

const isSupported = (v: unknown): v is SupportedNetwork =>
  typeof v === 'string' && (SUPPORTED_NETWORKS as string[]).includes(v);

export default function ReceiveModal() {
  useTouchSession();
  const theme = useTheme();
  const params = useLocalSearchParams<{
    chain?: string;
    smart?: string;
    amount?: string;
    envelope?: string;
  }>();
  const enabledChains = usePreferences((s) => s.enabledChains);
  const addresses = useAllAddresses();

  const initialChain = useMemo<SupportedNetwork>(
    () => (isSupported(params.chain) ? params.chain : (enabledChains[0] ?? 'ethereum')),
    [params.chain, enabledChains],
  );
  const [chain, setChain] = useState<SupportedNetwork>(initialChain);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [smartTip, setSmartTip] = useState<string | null>(null);

  const requestedAmount =
    typeof params.amount === 'string' && params.amount.length > 0 ? params.amount : null;

  useEffect(() => {
    if (params.smart !== '1') return;
    let cancelled = false;
    probeAllChains(enabledChains).then((health) => {
      if (!cancelled) {
        setSmartTip(recommendReceiveChain(enabledChains, health).reason);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabledChains, params.smart]);

  const current = addresses[chain];
  const address = current?.address ?? null;
  const isLoading = current?.isLoading ?? true;

  const handleCopy = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!address) return;
    const available = await Sharing.isAvailableAsync();
    if (!available) return;
    await Sharing.shareAsync(`data:text/plain,${encodeURIComponent(address)}`, {
      dialogTitle: `${NETWORK_LABELS[chain]} address`,
      mimeType: 'text/plain',
    });
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader
          title="Receive"
          back
          right={
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close">
              <SymbolView name="xmark.circle.fill" size={24} tintColor={theme.textSecondary} />
            </Pressable>
          }
        />

        <View style={styles.content}>
          {smartTip ? (
            <ThemedView type="backgroundSelected" style={styles.tip}>
              <SymbolView name="sparkles" size={16} tintColor={theme.accent} />
              <ThemedText type="small" style={{ flex: 1, color: theme.accent }}>
                {smartTip}
              </ThemedText>
            </ThemedView>
          ) : null}
          {params.envelope ? (
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              Gift envelope · share only this {NETWORK_LABELS[chain]} address
            </ThemedText>
          ) : null}
          <Pressable
            onPress={() => setPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Select network">
            {({ pressed }) => (
              <ThemedView
                type="backgroundElement"
                style={[styles.networkPill, pressed && { opacity: 0.85 }]}>
                <ChainIcon network={chain} size={24} />
                <ThemedText type="smallBold">{NETWORK_LABELS[chain]}</ThemedText>
                <SymbolView
                  name="chevron.up.chevron.down"
                  size={14}
                  tintColor={theme.textSecondary}
                />
              </ThemedView>
            )}
          </Pressable>

          {isLoading || !address ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.accent} size="large" />
            </View>
          ) : (
            <QRCard
              network={chain}
              address={address}
              caption={requestedAmount ? 'Requested amount' : undefined}
              amountLabel={requestedAmount ? `${requestedAmount} USDT` : undefined}
            />
          )}

          <View style={styles.actions}>
            <PrimaryButton
              variant="secondary"
              label={copied ? 'Copied' : 'Copy address'}
              onPress={handleCopy}
              disabled={!address}
            />
            <PrimaryButton variant="secondary" label="Share" onPress={handleShare} disabled={!address} />
          </View>
        </View>

        <Modal visible={pickerOpen} animationType="slide" transparent>
          <Pressable
            style={styles.backdrop}
            onPress={() => setPickerOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
          <ThemedView type="backgroundElement" style={styles.sheet}>
            <ScreenHeader title="Select network" />
            <FlatList
              data={enabledChains}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setChain(item);
                    setPickerOpen(false);
                  }}
                  accessibilityRole="button">
                  {({ pressed }) => (
                    <ThemedView
                      type={item === chain ? 'backgroundSelected' : 'background'}
                      style={[styles.networkOption, pressed && { opacity: 0.85 }]}>
                      <ChainIcon network={item} size={32} />
                      <ThemedText type="default">{NETWORK_LABELS[item]}</ThemedText>
                    </ThemedView>
                  )}
                </Pressable>
              )}
            />
          </ThemedView>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    alignItems: 'center',
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  networkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
  backdrop: { flex: 1, backgroundColor: '#0006' },
  sheet: {
    paddingBottom: Spacing.six,
    paddingHorizontal: Spacing.three,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: Spacing.one,
    maxHeight: '60%',
  },
  networkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 12,
  },
});
