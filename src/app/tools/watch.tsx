import { useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { SurfaceCard } from '@/components/wallet/SurfaceCard';
import { ADDRESS_EXPLORERS, NETWORK_LABELS, SUPPORTED_NETWORKS } from '@/config/wdk';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTouchSession } from '@/hooks/use-touch-session';
import { truncateAddress } from '@/services/formatters';
import { useUseCasesStore } from '@/store/use-cases';
import * as Linking from 'expo-linking';

export default function WatchWalletsScreen() {
  useTouchSession();
  const theme = useTheme();
  const watchWallets = useUseCasesStore((s) => s.watchWallets);
  const addWatchWallet = useUseCasesStore((s) => s.addWatchWallet);
  const removeWatchWallet = useUseCasesStore((s) => s.removeWatchWallet);

  const [label, setLabel] = useState('');
  const [eth, setEth] = useState('');

  const handleAdd = async () => {
    if (!label.trim() || !eth.trim()) return;
    await addWatchWallet({
      label: label.trim(),
      addresses: { ethereum: eth.trim() },
    });
    setLabel('');
    setEth('');
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="Watch-only" back />
        <FlatList
          data={watchWallets}
          keyExtractor={(w) => w.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <SurfaceCard style={styles.form}>
              <ThemedText type="smallBold">Add watch wallet</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Read-only — no keys stored. Start with an Ethereum address; add more networks
                later from settings.
              </ThemedText>
              <TextInput
                value={label}
                onChangeText={setLabel}
                placeholder="Family savings"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text }]}
              />
              <TextInput
                value={eth}
                onChangeText={setEth}
                placeholder="0x…"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                style={[styles.input, { color: theme.text }]}
              />
              <PrimaryButton label="Add" onPress={handleAdd} />
            </SurfaceCard>
          }
          renderItem={({ item }) => (
            <SurfaceCard style={styles.row}>
              <ThemedText type="smallBold">{item.label}</ThemedText>
              {SUPPORTED_NETWORKS.filter((n) => item.addresses[n]).map((n) => (
                <View key={n}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {NETWORK_LABELS[n]}: {truncateAddress(item.addresses[n]!, 8)}
                  </ThemedText>
                  <PrimaryButton
                    variant="secondary"
                    label="Explorer"
                    onPress={() =>
                      Linking.openURL(ADDRESS_EXPLORERS[n](item.addresses[n]!))
                    }
                  />
                </View>
              ))}
              <PrimaryButton
                variant="secondary"
                label="Remove"
                onPress={() => removeWatchWallet(item.id)}
              />
            </SurfaceCard>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  list: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  form: { gap: Spacing.two },
  input: { fontSize: 16, paddingVertical: Spacing.one },
  row: { gap: Spacing.two },
});
