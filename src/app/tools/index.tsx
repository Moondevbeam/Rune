import { router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AmbientBackground } from '@/components/wallet/AmbientBackground';
import { CommitmentCard } from '@/components/wallet/CommitmentCard';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { UseCaseTile } from '@/components/wallet/UseCaseTile';
import { Spacing } from '@/constants/theme';
import { useTouchSession } from '@/hooks/use-touch-session';
import { aggregateCommitments } from '@/services/commitments';
import { useUseCasesStore } from '@/store/use-cases';

export default function CommitmentsHubScreen() {
  useTouchSession();
  const envelopes = useUseCasesStore((s) => s.envelopes);
  const splits = useUseCasesStore((s) => s.splits);
  const recurring = useUseCasesStore((s) => s.recurring);
  const custom = useUseCasesStore((s) => s.custom);

  const buckets = useMemo(
    () => aggregateCommitments({ envelopes, splits, recurring, custom }),
    [envelopes, splits, recurring, custom],
  );

  const dueCount = buckets.due.length;

  return (
    <ThemedView style={styles.root}>
      <AmbientBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="Commitments" back large />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="caption" themeColor="textSecondary">
            Every payment promise in one place — gifts, splits, recurring, and custom
            commitments across chains.
          </ThemedText>

          <PrimaryButton
            label="New commitment"
            size="lg"
            onPress={() => router.push('/tools/new-commitment' as Href)}
          />

          {buckets.all.length ? (
            <View style={styles.section}>
              <ThemedText type="overline" themeColor="textSecondary">
                Active {dueCount ? `· ${dueCount} due` : ''}
              </ThemedText>
              {buckets.all.map((c) => (
                <CommitmentCard key={c.id} commitment={c} />
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <ThemedText type="overline" themeColor="textSecondary">
              Create from template
            </ThemedText>
            <UseCaseTile
              title="Split bill"
              description="Divide a total — each person becomes an incoming commitment."
              icon="person.3.fill"
              onPress={() => router.push('/tools/split-bill')}
            />
            <UseCaseTile
              title="Gift envelope"
              description="Time-boxed gift with shareable receive link."
              icon="gift.fill"
              onPress={() => router.push('/tools/gift')}
            />
            <UseCaseTile
              title="Recurring payment"
              description="Rent, stipend, or subscription on a schedule."
              icon="calendar.badge.clock"
              onPress={() => router.push('/tools/recurring')}
            />
            <UseCaseTile
              title="Remittance lane"
              description="Plan EU → low-fee rail → destination network."
              icon="globe.europe.africa.fill"
              onPress={() => router.push('/tools/remittance')}
            />
          </View>

          <View style={styles.section}>
            <ThemedText type="overline" themeColor="textSecondary">
              Support tools
            </ThemedText>
            <UseCaseTile
              title="How Rune works"
              description="Step-by-step guide to commitments, fulfill, and smart receive."
              icon="book.fill"
              onPress={() => router.push('/tools/tutorial' as Href)}
            />
            <UseCaseTile
              title="Smart receive"
              description="Cheapest enabled chain for incoming USDT."
              icon="qrcode.viewfinder"
              onPress={() => router.push('/tools/smart-receive')}
            />
            <UseCaseTile
              title="Trusted contacts"
              description="Counterparties with per-chain addresses."
              icon="person.2.fill"
              onPress={() => router.push('/tools/contacts')}
            />
            <UseCaseTile
              title="Spending vault"
              description="Monthly fiat cap per chain when fulfilling commitments."
              icon="lock.shield.fill"
              onPress={() => router.push('/tools/vault')}
            />
            <UseCaseTile
              title="Offline receive pack"
              description="Static QR per network without RPC."
              icon="wifi.slash"
              onPress={() => router.push('/tools/offline-receive')}
            />
            <UseCaseTile
              title="Watch-only wallets"
              description="Track external addresses without keys."
              icon="eye.fill"
              onPress={() => router.push('/tools/watch')}
            />
            <UseCaseTile
              title="USDT migration guide"
              description="Safe checklist when moving USDT between chains."
              icon="arrow.triangle.swap"
              onPress={() => router.push('/tools/migration')}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  section: { gap: Spacing.three },
});
