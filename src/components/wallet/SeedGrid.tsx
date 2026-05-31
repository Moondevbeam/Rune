import * as ScreenCapture from 'expo-screen-capture';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export type SeedGridProps = {
  words: string[];
  hideIndexes?: number[];
};

/**
 * Displays a seed phrase as a numbered grid. Activates screen-capture
 * prevention while mounted so screenshots are blocked on screens that show
 * sensitive material.
 */
export const SeedGrid = ({ words, hideIndexes }: SeedGridProps) => {
  useEffect(() => {
    let active = true;
    ScreenCapture.preventScreenCaptureAsync('seed-grid').catch(() => {});
    return () => {
      if (active) ScreenCapture.allowScreenCaptureAsync('seed-grid').catch(() => {});
      active = false;
    };
  }, []);

  return (
    <View style={styles.grid} accessibilityLabel="Recovery phrase">
      {words.map((word, i) => {
        const hidden = hideIndexes?.includes(i);
        return (
          <ThemedView key={`${i}-${word}`} type="backgroundElement" style={styles.cell}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.idx}>
              {i + 1}
            </ThemedText>
            <ThemedText type="smallBold" style={styles.word}>
              {hidden ? '••••••' : word}
            </ThemedText>
          </ThemedView>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  cell: {
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
  idx: {
    width: 18,
    textAlign: 'right',
  },
  word: {
    flex: 1,
  },
});
