import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export type AmbientBackgroundProps = {
  style?: StyleProp<ViewStyle>;
};

export const AmbientBackground = ({ style }: AmbientBackgroundProps) => {
  const theme = useTheme();

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <LinearGradient
        colors={[theme.background, theme.surfaceElevated, theme.background]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.orb,
          styles.orbPrimary,
          { backgroundColor: theme.accent, shadowColor: theme.accent },
        ]}
      />
      <View
        style={[
          styles.orb,
          styles.orbSecondary,
          { backgroundColor: theme.accentMuted },
        ]}
      />
      <View
        style={[
          styles.orb,
          styles.orbTertiary,
          { backgroundColor: theme.accentSoft },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbPrimary: {
    width: 280,
    height: 280,
    top: -80,
    right: -60,
    opacity: 0.22,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 80,
  },
  orbSecondary: {
    width: 220,
    height: 220,
    top: 120,
    left: -90,
    opacity: 0.35,
  },
  orbTertiary: {
    width: 160,
    height: 160,
    bottom: 120,
    right: 20,
    opacity: 0.5,
  },
});
