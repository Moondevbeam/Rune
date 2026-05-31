import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GlassCard } from '@/components/wallet/GlassCard';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type UseCaseTileProps = {
  title: string;
  description: string;
  icon: SymbolViewProps['name'];
  onPress: () => void;
  badge?: string;
};

export const UseCaseTile = ({ title, description, icon, onPress, badge }: UseCaseTileProps) => {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      {({ pressed }) => (
        <GlassCard style={[styles.card, pressed && { opacity: 0.92, transform: [{ scale: 0.995 }] }]}>
          <LinearGradient
            colors={[`${theme.accent}30`, `${theme.accent}08`]}
            style={styles.icon}>
            <SymbolView name={icon} size={22} tintColor={theme.accent} />
          </LinearGradient>
          <View style={styles.copy}>
            <View style={styles.titleRow}>
              <ThemedText type="subtitle">{title}</ThemedText>
              {badge ? (
                <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
                  <ThemedText type="captionBold" style={{ color: theme.accent }}>
                    {badge}
                  </ThemedText>
                </View>
              ) : null}
            </View>
            <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
              {description}
            </ThemedText>
          </View>
          <View style={[styles.chevron, { backgroundColor: theme.backgroundElement }]}>
            <SymbolView name="chevron.right" size={12} tintColor={theme.textSecondary} />
          </View>
        </GlassCard>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
