import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOnboarding } from '@/store/onboarding';

const shuffle = <T,>(arr: T[]): T[] => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export default function ConfirmSeedScreen() {
  const mnemonic = useOnboarding((s) => s.mnemonic);
  const challengeIndexes = useOnboarding((s) => s.challengeIndexes);
  const words = (mnemonic ?? '').split(' ').filter(Boolean);
  const theme = useTheme();

  const expected = challengeIndexes.map((i) => words[i]);

  const choices = useMemo(() => {
    const pool = words.filter((w, i) => !challengeIndexes.includes(i));
    return challengeIndexes.map((idx, slot) => {
      const correct = words[idx];
      const distractors = shuffle(pool.filter((w) => w !== correct)).slice(0, 3);
      return shuffle([correct, ...distractors]);
    });
  }, [words, challengeIndexes]);

  const [picks, setPicks] = useState<(string | null)[]>(
    () => challengeIndexes.map(() => null),
  );

  const allCorrect = picks.every((p, i) => p === expected[i]);

  const handleSelect = (slot: number, word: string) => {
    Haptics.selectionAsync();
    setPicks((prev) => prev.map((v, i) => (i === slot ? word : v)));
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="Verify backup" back />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="small" themeColor="textSecondary">
            To confirm that you backed up your recovery phrase, select the correct word for each
            position below.
          </ThemedText>

          {challengeIndexes.map((idx, slot) => (
            <View key={idx} style={styles.section}>
              <ThemedText type="smallBold">Word #{idx + 1}</ThemedText>
              <View style={styles.options}>
                {choices[slot].map((word) => {
                  const selected = picks[slot] === word;
                  const correct = selected && word === expected[slot];
                  const wrong = selected && word !== expected[slot];
                  const borderColor = correct
                    ? theme.success
                    : wrong
                      ? theme.danger
                      : selected
                        ? theme.accent
                        : theme.border;
                  return (
                    <Pressable
                      key={word}
                      onPress={() => handleSelect(slot, word)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${word}`}>
                      {({ pressed }) => (
                        <ThemedView
                          type="backgroundElement"
                          style={[
                            styles.chip,
                            { borderColor, opacity: pressed ? 0.85 : 1 },
                          ]}>
                          <ThemedText type="small" style={{ color: theme.text }}>
                            {word}
                          </ThemedText>
                        </ThemedView>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.cta}>
          <PrimaryButton
            label="Continue"
            onPress={() => router.push('/(onboarding)/set-pin')}
            disabled={!allCorrect}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.four,
  },
  section: { gap: Spacing.two },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  cta: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
});
