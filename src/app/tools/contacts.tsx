import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { SurfaceCard } from '@/components/wallet/SurfaceCard';
import { NETWORK_LABELS, SUPPORTED_NETWORKS, type SupportedNetwork } from '@/config/wdk';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTouchSession } from '@/hooks/use-touch-session';
import { isAddressValidForNetwork } from '@/services/addressValidation';
import { useContactsStore } from '@/store/contacts';

export default function ContactsScreen() {
  useTouchSession();
  const theme = useTheme();
  const items = useContactsStore((s) => s.items);
  const add = useContactsStore((s) => s.add);
  const remove = useContactsStore((s) => s.remove);

  const [name, setName] = useState('');
  const [addresses, setAddresses] = useState<Partial<Record<SupportedNetwork, string>>>({});

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Enter a display name for this contact.');
      return;
    }
    const filled = SUPPORTED_NETWORKS.filter((n) => addresses[n]?.trim());
    if (!filled.length) {
      Alert.alert('Address required', 'Add at least one network address.');
      return;
    }
    for (const network of filled) {
      const addr = addresses[network]!.trim();
      if (!isAddressValidForNetwork(addr, network)) {
        Alert.alert('Invalid address', `${NETWORK_LABELS[network]} address looks wrong.`);
        return;
      }
    }
    const cleaned = Object.fromEntries(
      filled.map((n) => [n, addresses[n]!.trim()]),
    ) as Partial<Record<SupportedNetwork, string>>;
    await add({ name: name.trim(), addresses: cleaned });
    setName('');
    setAddresses({});
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="Trusted contacts" back />
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <SurfaceCard style={styles.form}>
              <ThemedText type="smallBold">New contact</ThemedText>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Name"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text }]}
                accessibilityLabel="Contact name"
              />
              {SUPPORTED_NETWORKS.map((network) => (
                <View key={network}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {NETWORK_LABELS[network]} (optional)
                  </ThemedText>
                  <TextInput
                    value={addresses[network] ?? ''}
                    onChangeText={(t) =>
                      setAddresses((prev) => ({ ...prev, [network]: t }))
                    }
                    placeholder="Address"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.input, { color: theme.text }]}
                    accessibilityLabel={`${NETWORK_LABELS[network]} address`}
                  />
                </View>
              ))}
              <PrimaryButton label="Save contact" onPress={handleAdd} />
            </SurfaceCard>
          }
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              No contacts yet. Add someone you pay often.
            </ThemedText>
          }
          renderItem={({ item }) => (
            <SurfaceCard style={styles.row}>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold">{item.name}</ThemedText>
                {SUPPORTED_NETWORKS.filter((n) => item.addresses[n]).map((n) => (
                  <ThemedText key={n} type="small" themeColor="textSecondary" numberOfLines={1}>
                    {NETWORK_LABELS[n]}: {item.addresses[n]}
                  </ThemedText>
                ))}
              </View>
              <Pressable
                onPress={() => {
                  Alert.alert('Remove contact?', item.name, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: () => remove(item.id),
                    },
                  ]);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.name}`}>
                <ThemedText type="small" style={{ color: theme.danger }}>
                  Remove
                </ThemedText>
              </Pressable>
              <PrimaryButton
                variant="secondary"
                label="Send"
                onPress={() =>
                  router.push({ pathname: '/send', params: { contactId: item.id } })
                }
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
  form: { gap: Spacing.two, marginBottom: Spacing.two },
  input: { fontSize: 16, paddingVertical: Spacing.one },
  row: { gap: Spacing.two },
  empty: { textAlign: 'center', marginTop: Spacing.four },
});
