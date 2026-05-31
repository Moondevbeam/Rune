import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ActionShortcutProps = {
  label: string;
  icon: SymbolViewProps['name'];
  onPress: () => void;
  disabled?: boolean;
  tint?: string;
};

export const ActionShortcut = ({ label, icon, onPress, disabled, tint }: ActionShortcutProps) => {
  const theme = useTheme();
  const color = tint ?? theme.accent;

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.wrap}>
      {({ pressed }) => (
        <>
          <LinearGradient
            colors={[`${color}33`, `${color}12`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.iconShell,
              {
                borderColor: `${color}44`,
                transform: [{ scale: pressed ? 0.94 : 1 }],
                opacity: disabled ? 0.4 : 1,
              },
            ]}>
            <View style={[styles.iconInner, { backgroundColor: `${color}22` }]}>
              <SymbolView name={icon} size={24} tintColor={color} resizeMode="scaleAspectFit" />
            </View>
          </LinearGradient>
          <ThemedText type="captionBold" style={styles.label}>
            {label}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  iconShell: {
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconInner: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
});
