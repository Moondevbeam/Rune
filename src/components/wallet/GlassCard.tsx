import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useResolvedScheme, useTheme } from '@/hooks/use-theme';

export type GlassCardProps = ViewProps & {
  elevated?: boolean;
  flush?: boolean;
  noShadow?: boolean;
  interactive?: boolean;
};

export const GlassCard = ({
  style,
  elevated,
  flush,
  noShadow,
  interactive,
  children,
  ...rest
}: GlassCardProps) => {
  const theme = useTheme();
  const scheme = useResolvedScheme();
  const bg = elevated ? theme.surfaceElevated : theme.surface;
  const cardStyle = [
    styles.card,
    { borderColor: `${theme.border}88` },
    !noShadow && Platform.OS === 'android' && {
      elevation: 3,
    },
    flush && styles.flush,
    style,
  ];

  if (isLiquidGlassAvailable()) {
    return (
      <GlassView
        glassEffectStyle="regular"
        isInteractive={interactive}
        colorScheme={scheme}
        tintColor={`${bg}CC`}
        style={cardStyle}
        {...rest}>
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        cardStyle,
        {
          backgroundColor: `${bg}F2`,
          ...(Platform.OS === 'ios' && !noShadow
            ? {
                shadowColor: theme.shadow,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.12,
                shadowRadius: 24,
              }
            : {}),
        },
      ]}
      {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  flush: {
    padding: 0,
  },
});
