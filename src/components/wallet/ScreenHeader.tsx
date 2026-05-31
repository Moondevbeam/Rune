import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ScreenHeaderProps = {
  title?: string;
  back?: boolean;
  right?: React.ReactNode;
  style?: ViewStyle;
  large?: boolean;
};

export const ScreenHeader = ({ title, back, right, style, large }: ScreenHeaderProps) => {
  const theme = useTheme();
  const canGoBack = router.canGoBack();

  return (
    <View style={[styles.header, style]}>
      <View style={styles.side}>
        {back && canGoBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            hitSlop={12}>
            {({ pressed }) => (
              <View
                style={[
                  styles.backBtn,
                  { backgroundColor: theme.backgroundElement },
                  pressed && { opacity: 0.7 },
                ]}>
                <SymbolView name="chevron.left" size={18} tintColor={theme.text} />
              </View>
            )}
          </Pressable>
        ) : null}
      </View>

      {title ? (
        <ThemedText type={large ? 'headline' : 'subtitle'} style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>
      ) : (
        <View style={styles.title} />
      )}

      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: 52,
  },
  side: {
    width: 44,
    justifyContent: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
});
