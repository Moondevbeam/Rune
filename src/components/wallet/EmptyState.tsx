import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GlassCard } from '@/components/wallet/GlassCard';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type EmptyStateProps = {
  icon: SymbolViewProps['name'];
  title: string;
  description?: string;
  cta?: { label: string; onPress: () => void };
};

export const EmptyState = ({ icon, title, description, cta }: EmptyStateProps) => {
  const theme = useTheme();

  return (
    <GlassCard style={styles.wrap} accessibilityRole="summary">
      <LinearGradient
        colors={[`${theme.accent}28`, `${theme.accent}08`]}
        style={styles.iconWrap}>
        <SymbolView name={icon} size={36} tintColor={theme.accent} />
      </LinearGradient>
      <ThemedText type="headline" style={styles.title}>
        {title}
      </ThemedText>
      {description ? (
        <ThemedText type="caption" themeColor="textSecondary" style={styles.desc}>
          {description}
        </ThemedText>
      ) : null}
      {cta ? (
        <View style={styles.cta}>
          <PrimaryButton label={cta.label} onPress={cta.onPress} size="lg" fullWidth={false} />
        </View>
      ) : null}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: Radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  title: { textAlign: 'center' },
  desc: { textAlign: 'center', maxWidth: 280 },
  cta: { marginTop: Spacing.two },
});
