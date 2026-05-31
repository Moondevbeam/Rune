import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GlassCard } from '@/components/wallet/GlassCard';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { ChainIcon } from '@/components/wallet/ChainIcon';
import { NETWORK_LABELS } from '@/config/wdk';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDueTime } from '@/services/formatters';
import { commitmentKindLabel, type Commitment } from '@/services/commitments';

export type CommitmentCardProps = {
  commitment: Commitment;
  compact?: boolean;
};

const statusColor = (
  status: Commitment['status'],
  theme: ReturnType<typeof useTheme>,
): string => {
  if (status === 'due') return theme.warning;
  if (status === 'fulfilled') return theme.success;
  return theme.textSecondary;
};

export const CommitmentCard = ({ commitment, compact }: CommitmentCardProps) => {
  const theme = useTheme();
  const isOutgoing = commitment.direction === 'outgoing';
  const canFulfill = isOutgoing && commitment.status !== 'fulfilled';
  const accent = isOutgoing ? theme.danger : theme.success;

  const handleFulfill = () => {
    if (commitment.ref.source === 'recurring' || commitment.ref.source === 'custom') {
      router.push({
        pathname: '/send',
        params: {
          chain: commitment.chain,
          assetKey: commitment.assetKey,
          recipient: commitment.recipient ?? '',
          amount: commitment.amount,
          commitmentSource: commitment.ref.source,
          commitmentId: commitment.ref.id,
          note: commitment.title,
        },
      });
      return;
    }
    if (commitment.ref.source === 'split') {
      router.push('/tools/split-bill');
      return;
    }
    router.push('/tools/smart-receive');
  };

  const handleCollect = () => {
    router.push({ pathname: '/tools/smart-receive' });
  };

  return (
    <GlassCard style={styles.card} flush>
      <LinearGradient
        colors={[`${accent}18`, 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.accentStripe}
      />
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <LinearGradient
            colors={[`${theme.accent}33`, `${theme.accent}10`]}
            style={styles.kindIcon}>
            <SymbolView
              name={
                commitment.kind === 'gift'
                  ? 'gift.fill'
                  : commitment.kind === 'split'
                    ? 'person.3.fill'
                    : commitment.kind === 'recurring'
                      ? 'calendar.badge.clock'
                      : 'hand.raised.fill'
              }
              size={20}
              tintColor={theme.accent}
            />
          </LinearGradient>
          <View style={styles.copy}>
            <ThemedText type="subtitle" numberOfLines={1}>
              {commitment.title}
            </ThemedText>
            {commitment.subtitle ? (
              <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                {commitment.subtitle}
              </ThemedText>
            ) : null}
          </View>
          <View style={styles.amountCol}>
            <ThemedText type="subtitle" style={styles.amount}>
              {commitment.amount}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {commitment.symbol}
            </ThemedText>
          </View>
        </View>

        {!compact ? (
          <View style={styles.metaRow}>
            <View style={[styles.pill, { backgroundColor: theme.accentSoft }]}>
              <ChainIcon network={commitment.chain} size={14} />
              <ThemedText type="caption" themeColor="textSecondary">
                {NETWORK_LABELS[commitment.chain]}
              </ThemedText>
            </View>
            <View style={[styles.pill, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="caption" themeColor="textSecondary">
                {commitmentKindLabel[commitment.kind]}
              </ThemedText>
            </View>
            {commitment.dueAt ? (
              <ThemedText
                type="captionBold"
                style={{ color: statusColor(commitment.status, theme) }}>
                {formatDueTime(commitment.dueAt)}
              </ThemedText>
            ) : (
              <ThemedText type="captionBold" style={{ color: accent }}>
                {isOutgoing ? 'You pay' : 'You receive'}
              </ThemedText>
            )}
          </View>
        ) : null}

        {!compact && (canFulfill || !isOutgoing) ? (
          <PrimaryButton
            size="md"
            variant={canFulfill ? 'primary' : 'secondary'}
            label={canFulfill ? 'Fulfill' : 'Request payment'}
            onPress={canFulfill ? handleFulfill : handleCollect}
          />
        ) : null}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
  },
  accentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  inner: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  kindIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  amountCol: { alignItems: 'flex-end' },
  amount: {
    fontVariant: ['tabular-nums'],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
});
