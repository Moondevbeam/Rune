import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { AuthGate } from '@/components/wallet/AuthGate';
import { WalletProviders } from '@/components/wallet/WalletProviders';
import { useAuthStore } from '@/store/auth';
import { useContactsStore } from '@/store/contacts';
import { usePreferences } from '@/store/preferences';
import { useUseCasesStore } from '@/store/use-cases';

export default function RootLayout() {
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydratePrefs = usePreferences((s) => s.hydrate);
  const hydrateContacts = useContactsStore((s) => s.hydrate);
  const hydrateUseCases = useUseCasesStore((s) => s.hydrate);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (__DEV__) {
      LogBox.ignoreLogs([
        'Failed to fetch balance for',
        '[AccountService] callAccountMethod:getTokenBalance failed',
        '[AccountService] callAccountMethod:getBalance failed',
      ]);
    }
    hydrateAuth();
    hydratePrefs();
    hydrateContacts();
    hydrateUseCases();
  }, [hydrateAuth, hydratePrefs, hydrateContacts, hydrateUseCases]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <WalletProviders>
          <AuthGate>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
              }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(app)" />
              <Stack.Screen
                name="send"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="receive/[chain]"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="tx/[network]/[hash]"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen name="tools" options={{ animation: 'slide_from_right' }} />
            </Stack>
          </AuthGate>
          <StatusBar style="auto" />
        </WalletProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
