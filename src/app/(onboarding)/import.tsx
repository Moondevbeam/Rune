import { validateMnemonic } from '@tetherto/wdk-react-native-core';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOnboarding } from '@/store/onboarding';

export default function ImportWalletScreen() {
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const setMnemonic = useOnboarding((s) => s.setMnemonic);
  const theme = useTheme();

  const normalised = phrase.trim().toLowerCase().replace(/\s+/g, ' ');
  const wordCount = normalised ? normalised.split(' ').length : 0;
  const valid = (wordCount === 12 || wordCount === 24) && validateMnemonic(normalised);

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    setPhrase(text);
    setError(null);
  };

  const handleContinue = () => {
    if (!valid) {
      setError('That phrase does not look like a valid BIP-39 12/24 word mnemonic.');
      return;
    }
    setMnemonic(normalised);
    router.push('/(onboarding)/set-pin');
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="Import wallet" back />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="small" themeColor="textSecondary">
            Enter your 12 or 24 word recovery phrase. Words are separated by spaces and are
            case-insensitive.
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.inputCard}>
            <TextInput
              value={phrase}
              onChangeText={(t) => {
                setPhrase(t);
                setError(null);
              }}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              placeholder="word1 word2 word3…"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
              accessibilityLabel="Recovery phrase input"
            />
          </ThemedView>

          <View style={styles.meta}>
            <ThemedText type="small" themeColor="textSecondary">
              {wordCount} word{wordCount === 1 ? '' : 's'}
            </ThemedText>
            <PrimaryButton
              variant="secondary"
              label="Paste from clipboard"
              fullWidth={false}
              onPress={handlePaste}
            />
          </View>

          {error ? (
            <ThemedText type="small" style={{ color: theme.danger }}>
              {error}
            </ThemedText>
          ) : null}
        </ScrollView>

        <View style={styles.cta}>
          <PrimaryButton label="Continue" onPress={handleContinue} disabled={!valid} />
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
    gap: Spacing.three,
  },
  inputCard: {
    padding: Spacing.three,
    borderRadius: 14,
  },
  input: {
    minHeight: 120,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cta: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
});
