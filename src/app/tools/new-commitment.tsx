import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { SurfaceCard } from '@/components/wallet/SurfaceCard';
import { NETWORK_LABELS, type SupportedNetwork } from '@/config/wdk';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTouchSession } from '@/hooks/use-touch-session';
import { rankChainsForUsdt } from '@/services/chainHealth';
import { useContactsStore } from '@/store/contacts';
import type { CommitmentDirection } from '@/store/use-cases';
import { useUseCasesStore } from '@/store/use-cases';
import { usePreferences } from '@/store/preferences';

export default function NewCommitmentScreen() {
  useTouchSession();
  const theme = useTheme();
  const enabledChains = usePreferences((s) => s.enabledChains);
  const defaultChain = rankChainsForUsdt(enabledChains)[0] ?? 'tron';
  const contacts = useContactsStore((s) => s.items);
  const addCustom = useUseCasesStore((s) => s.addCustom);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<CommitmentDirection>('outgoing');
  const [chain, setChain] = useState<SupportedNetwork>(defaultChain);
  const [dueDays, setDueDays] = useState('7');
  const [contactId, setContactId] = useState<string | undefined>();
  const [recipient, setRecipient] = useState('');

  const selectedContact = contacts.find((c) => c.id === contactId);

  const handleCreate = async () => {
    if (!title.trim() || !amount.trim()) return;
    const days = Math.max(0, parseInt(dueDays, 10) || 0);
    const dueAt = days > 0 ? Date.now() + days * 86_400_000 : undefined;
    const contact = selectedContact;
    const addr =
      recipient.trim() ||
      (contact && direction === 'outgoing' ? contact.addresses[chain] : undefined);

    await addCustom({
      title: title.trim(),
      amount: amount.trim(),
      chain,
      direction,
      contactId: contact?.id,
      contactName: contact?.name,
      recipient: addr,
      dueAt,
    });
    router.back();
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="New commitment" back />
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="small" themeColor="textSecondary">
            A payment promise between you and someone else. Rune picks the cheapest
            rail when it&apos;s time to pay.
          </ThemedText>

          <SurfaceCard style={styles.form}>
            <ThemedText type="smallBold">What is this about?</ThemedText>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Rent, dinner, birthday gift…"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
              accessibilityLabel="Commitment title"
            />

            <ThemedText type="smallBold">Amount (USDT)</ThemedText>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
              accessibilityLabel="Amount"
            />

            <ThemedText type="smallBold">Direction</ThemedText>
            <View style={styles.row}>
              <PrimaryButton
                variant={direction === 'outgoing' ? 'primary' : 'secondary'}
                label="I owe"
                onPress={() => setDirection('outgoing')}
              />
              <PrimaryButton
                variant={direction === 'incoming' ? 'primary' : 'secondary'}
                label="They owe me"
                onPress={() => setDirection('incoming')}
              />
            </View>

            {direction === 'outgoing' ? (
              <>
                <ThemedText type="smallBold">Recipient (optional)</ThemedText>
                <TextInput
                  value={recipient}
                  onChangeText={setRecipient}
                  placeholder="Address or pick a contact below"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  style={[styles.input, { color: theme.text }]}
                  accessibilityLabel="Recipient address"
                />
              </>
            ) : null}

            {contacts.length ? (
              <>
                <ThemedText type="smallBold">Contact (optional)</ThemedText>
                <View style={styles.row}>
                  {contacts.slice(0, 4).map((c) => (
                    <PrimaryButton
                      key={c.id}
                      variant={contactId === c.id ? 'primary' : 'secondary'}
                      label={c.name}
                      onPress={() => {
                        setContactId(c.id);
                        if (direction === 'outgoing' && c.addresses[chain]) {
                          setRecipient(c.addresses[chain] ?? '');
                        }
                      }}
                    />
                  ))}
                </View>
              </>
            ) : null}

            <ThemedText type="smallBold">Due in (days)</ThemedText>
            <TextInput
              value={dueDays}
              onChangeText={setDueDays}
              keyboardType="number-pad"
              placeholder="7"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
              accessibilityLabel="Due in days"
            />

            <ThemedText type="smallBold">Preferred network</ThemedText>
            <View style={styles.row}>
              {enabledChains.map((c) => (
                <PrimaryButton
                  key={c}
                  variant={c === chain ? 'primary' : 'secondary'}
                  label={NETWORK_LABELS[c]}
                  onPress={() => setChain(c)}
                />
              ))}
            </View>

            <PrimaryButton
              label="Create commitment"
              onPress={handleCreate}
              disabled={!title.trim() || !amount.trim()}
            />
          </SurfaceCard>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  form: { gap: Spacing.two },
  input: { fontSize: 16, paddingVertical: Spacing.one },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
});
