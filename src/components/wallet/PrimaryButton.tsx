import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type PressableProps, type ViewStyle } from 'react-native';

import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type PrimaryButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'md' | 'lg';
  fullWidth?: boolean;
};

export const PrimaryButton = ({
  label,
  loading,
  disabled,
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  onPress,
  ...rest
}: PrimaryButtonProps) => {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';

  const handlePress = (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  };

  const paddingVertical = size === 'lg' ? Spacing.three + 2 : Spacing.two + 2;
  const fontSize = size === 'lg' ? 17 : 15;
  const fg =
    isPrimary || isDanger ? theme.accentText : isGhost ? theme.accent : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={handlePress}
      {...rest}>
      {({ pressed }) => {
        const opacity = isDisabled ? 0.45 : pressed ? 0.88 : 1;
        const shell: ViewStyle[] = [
          styles.button,
          {
            paddingVertical,
            alignSelf: fullWidth ? 'stretch' : 'center',
            opacity,
          },
          !fullWidth ? styles.inline : null,
        ].filter(Boolean) as ViewStyle[];

        const labelNode = loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <Text style={[Typography.bodyBold, { color: fg, fontSize, textAlign: 'center' }]}>
            {label}
          </Text>
        );

        if (isPrimary) {
          return (
            <LinearGradient
              colors={[theme.gradientStart, theme.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={shell}>
              {labelNode}
            </LinearGradient>
          );
        }

        return (
          <View
            style={[
              shell,
              {
                backgroundColor: isDanger
                  ? theme.danger
                  : isGhost
                    ? 'transparent'
                    : `${theme.backgroundElement}EE`,
                borderWidth: isGhost ? 0 : StyleSheet.hairlineWidth,
                borderColor: `${theme.border}AA`,
              },
            ]}>
            {labelNode}
          </View>
        );
      }}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inline: {
    paddingHorizontal: Spacing.three,
  },
});
