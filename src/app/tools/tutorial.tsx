import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AmbientBackground } from '@/components/wallet/AmbientBackground';
import { GlassCard } from '@/components/wallet/GlassCard';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { TutorialStepCard } from '@/components/wallet/TutorialStepCard';
import { Radius, Spacing } from '@/constants/theme';
import { TUTORIAL_RPC_TIP, TUTORIAL_STEPS } from '@/constants/tutorial';
import { useActivePalette, useResolvedScheme, useTheme } from '@/hooks/use-theme';
import { useTouchSession } from '@/hooks/use-touch-session';

export default function TutorialScreen() {
  useTouchSession();
  const theme = useTheme();
  const palette = useActivePalette();
  const scheme = useResolvedScheme();
  const heroVariant = palette[scheme];

  return (
    <ThemedView style={styles.root}>
      <AmbientBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader title="How Rune works" back large />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(450)}>
            <LinearGradient
              colors={[heroVariant.gradientStart, heroVariant.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1.1 }}
              style={styles.hero}>
              <SymbolView name="sparkles" size={28} tintColor={heroVariant.accentText} />
              <ThemedText type="headline" style={{ color: heroVariant.accentText }}>
                Learn Rune in 2 minutes
              </ThemedText>
              <ThemedText
                type="caption"
                style={{ color: heroVariant.accentText, opacity: 0.88 }}>
                Pay what you promised — on the cheapest USDT rail. Follow the steps below.
              </ThemedText>
            </LinearGradient>
          </Animated.View>

          <ThemedText type="overline" themeColor="textSecondary">
            Step by step
          </ThemedText>

          {TUTORIAL_STEPS.map((step, i) => (
            <Animated.View
              key={step.id}
              entering={FadeInDown.delay(80 + i * 50).duration(400)}>
              <TutorialStepCard
                index={i + 1}
                icon={step.icon}
                title={step.title}
                body={step.body}
                tip={step.tip}
                action={step.action}
                isLast={i === TUTORIAL_STEPS.length - 1}
              />
            </Animated.View>
          ))}

          <Animated.View entering={FadeInDown.delay(600).duration(450)}>
            <GlassCard style={styles.rpcCard}>
              <View style={styles.rpcHeader}>
                <SymbolView name="wifi.exclamationmark" size={18} tintColor={theme.warning} />
                <ThemedText type="subtitle">Developer tip</ThemedText>
              </View>
              <ThemedText type="caption" themeColor="textSecondary">
                {TUTORIAL_RPC_TIP}
              </ThemedText>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(650).duration(450)} style={styles.footer}>
            <PrimaryButton
              label="Create your first commitment"
              size="lg"
              onPress={() => router.push('/tools/new-commitment' as Href)}
            />
            <PrimaryButton
              variant="secondary"
              label="Back to Home"
              size="lg"
              onPress={() => router.push('/(app)')}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  hero: {
    borderRadius: Radius.xxl,
    padding: Spacing.four,
    gap: Spacing.two,
    overflow: 'hidden',
  },
  rpcCard: {
    gap: Spacing.two,
  },
  rpcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  footer: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
