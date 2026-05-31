import { useWdkApp } from '@tetherto/wdk-react-native-core';
import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export default function RouterSentinel() {
  const { state } = useWdkApp();
  const theme = useTheme();

  if (state.status === 'NO_WALLET') {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  if (state.status === 'READY' || state.status === 'LOCKED') {
    return <Redirect href="/(app)" />;
  }

  return (
    <ThemedView style={styles.center}>
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={theme.accent} size="large" />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
