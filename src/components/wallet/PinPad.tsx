import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const KEY_GAP = Spacing.three;
const KEY_MIN = 56;
const KEY_MAX = 76;

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'biometric', '0', 'delete'] as const;

type Key = (typeof KEYS)[number];

export type PinPadProps = {
  pinLength: number;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (pin: string) => void;
  onBiometric?: () => void;
  error?: boolean;
  /** "onAccent" inverts colors for use on top of a gradient hero. */
  variant?: 'default' | 'onAccent';
  /** Foreground tint when `variant="onAccent"`. */
  tint?: string;
};

export const PinPad = ({
  pinLength,
  value,
  onChange,
  onSubmit,
  onBiometric,
  error,
  variant = 'default',
  tint,
}: PinPadProps) => {
  const theme = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const keySize = useMemo(() => {
    const byWidth = Math.floor((screenWidth - Spacing.four * 2 - KEY_GAP * 2) / 3);
    const byHeight = Math.floor((screenHeight * 0.34) / 4);
    return Math.min(KEY_MAX, Math.max(KEY_MIN, Math.min(byWidth, byHeight)));
  }, [screenWidth, screenHeight]);
  const gridStyles = useMemo(
    () => ({
      grid: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        width: keySize * 3 + KEY_GAP * 2,
        gap: KEY_GAP,
      },
      key: {
        width: keySize,
        height: keySize,
        borderRadius: keySize / 2,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      keyPlaceholder: {
        width: keySize,
        height: keySize,
      },
      keyText: {
        fontSize: Math.round(keySize * 0.38),
        lineHeight: Math.round(keySize * 0.44),
        fontWeight: '600' as const,
        textAlign: 'center' as const,
        ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
      },
    }),
    [keySize],
  );

  const onAccent = variant === 'onAccent';
  const fg = tint ?? theme.text;
  const keyBg = onAccent ? 'rgba(255,255,255,0.16)' : theme.backgroundElement;
  const dotFill = onAccent ? fg : theme.text;
  const dotBorder = error ? theme.danger : onAccent ? 'rgba(255,255,255,0.55)' : theme.border;

  useEffect(() => {
    if (value.length === pinLength) onSubmit(value);
  }, [value, pinLength, onSubmit]);

  useEffect(() => {
    if (error) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [error]);

  const handlePress = (k: Key) => {
    Haptics.selectionAsync();
    if (k === 'delete') {
      onChange(value.slice(0, -1));
      return;
    }
    if (k === 'biometric') {
      onBiometric?.();
      return;
    }
    if (value.length >= pinLength) return;
    onChange(value + k);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.dots}>
        {Array.from({ length: pinLength }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < value.length ? dotFill : 'transparent',
                borderColor: dotBorder,
              },
            ]}
          />
        ))}
      </View>

      <View style={gridStyles.grid}>
        {KEYS.map((k) => {
          if (k === 'biometric' && !onBiometric) {
            return <View key={k} style={gridStyles.keyPlaceholder} />;
          }
          return (
            <Pressable
              key={k}
              onPress={() => handlePress(k)}
              accessibilityRole="button"
              accessibilityLabel={
                k === 'delete' ? 'Delete digit' : k === 'biometric' ? 'Use biometric' : `Digit ${k}`
              }>
              {({ pressed }) => {
                const inner = (
                  <>
                    {k === 'delete' ? (
                      <SymbolView name="delete.left.fill" size={22} tintColor={fg} />
                    ) : k === 'biometric' ? (
                      <SymbolView
                        name="faceid"
                        size={26}
                        tintColor={onAccent ? fg : theme.accent}
                      />
                    ) : (
                      <Text style={[gridStyles.keyText, { color: fg }]}>{k}</Text>
                    )}
                  </>
                );
                return onAccent ? (
                  <View
                    style={[
                      gridStyles.key,
                      { backgroundColor: keyBg },
                      pressed && { opacity: 0.7 },
                    ]}>
                    {inner}
                  </View>
                ) : (
                  <ThemedView
                    type="backgroundElement"
                    style={[gridStyles.key, pressed && { opacity: 0.7 }]}>
                    {inner}
                  </ThemedView>
                );
              }}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: Spacing.four,
    width: '100%',
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.three,
    minHeight: 20,
    alignItems: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
});
