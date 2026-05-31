import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GlassCard } from '@/components/wallet/GlassCard';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TutorialStepCardProps = {
  index: number;
  icon: SymbolViewProps['name'];
  title: string;
  body: string;
  tip?: string;
  action?: {
    label: string;
    href: Href;
  };
  isLast?: boolean;
};

export const TutorialStepCard = ({
  index,
  icon,
  title,
  body,
  tip,
  action,
  isLast,
}: TutorialStepCardProps) => {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      {!isLast ? (
        <View style={[styles.connector, { backgroundColor: theme.border }]} />
      ) : null}

      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
          <ThemedText type="captionBold" style={{ color: theme.accentText }}>
            {index}
          </ThemedText>
        </View>

        <GlassCard style={styles.card}>
          <LinearGradient
            colors={[`${theme.accent}33`, `${theme.accent}08`]}
            style={styles.iconWrap}>
            <SymbolView name={icon} size={22} tintColor={theme.accent} />
          </LinearGradient>

          <ThemedText type="subtitle">{title}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {body}
          </ThemedText>

          {tip ? (
            <View style={[styles.tipBox, { backgroundColor: theme.accentSoft }]}>
              <SymbolView name="lightbulb.fill" size={14} tintColor={theme.accent} />
              <ThemedText type="caption" style={{ flex: 1, color: theme.text }}>
                {tip}
              </ThemedText>
            </View>
          ) : null}

          {action ? (
            <PrimaryButton
              variant="secondary"
              size="md"
              label={action.label}
              onPress={() => router.push(action.href)}
            />
          ) : null}
        </GlassCard>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    paddingLeft: Spacing.one,
  },
  connector: {
    position: 'absolute',
    left: 15,
    top: 32,
    bottom: -Spacing.three,
    width: 2,
    borderRadius: 1,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
  },
  card: {
    flex: 1,
    gap: Spacing.two,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.md,
  },
});
