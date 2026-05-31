import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AmbientBackground } from '@/components/wallet/AmbientBackground';
import { GlassCard } from '@/components/wallet/GlassCard';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { Radius, Spacing } from '@/constants/theme';
import { useActivePalette, useResolvedScheme, useTheme } from '@/hooks/use-theme';

type Highlight = {
  icon: 'hand.raised.fill' | 'globe' | 'key.fill';
  title: string;
  body: string;
};

const HIGHLIGHTS: Highlight[] = [
  {
    icon: 'hand.raised.fill',
    title: 'Payment commitments',
    body: 'Track what you owe and what others owe you across every USDT chain.',
  },
  {
    icon: 'globe',
    title: 'Invisible chains',
    body: 'Rune picks the cheapest rail when you fulfill. People first, networks second.',
  },
  {
    icon: 'key.fill',
    title: 'Self-custodial',
    body: 'Your keys never leave this device. Only you can recover your wallet.',
  },
];

export default function WelcomeScreen() {
  const theme = useTheme();
  const palette = useActivePalette();
  const scheme = useResolvedScheme();
  const heroVariant = palette[scheme];

  return (
    <ThemedView style={styles.root}>
      <AmbientBackground />
      <LinearGradient
        colors={[heroVariant.gradientStart, heroVariant.gradientEnd, `${heroVariant.gradientEnd}00`]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.hero}>
        <SafeAreaView style={styles.heroSafe} edges={['top']}>
          <Animated.View entering={FadeInUp.duration(600)} style={styles.brandBlock}>
            <View style={styles.logoCircle}>
              <SymbolView name="sparkles" size={32} tintColor={heroVariant.accentText} />
            </View>
            <ThemedText type="display" style={{ color: heroVariant.accentText }}>
              Rune
            </ThemedText>
            <ThemedText
              type="subtitle"
              style={{ color: heroVariant.accentText, opacity: 0.88, maxWidth: 300 }}>
              Pay what you promised — on the cheapest USDT rail.
            </ThemedText>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.highlights}>
          {HIGHLIGHTS.map((h, i) => (
            <Animated.View key={h.title} entering={FadeInDown.delay(120 + i * 80).duration(500)}>
              <GlassCard style={styles.row}>
                <LinearGradient
                  colors={[`${theme.accent}33`, `${theme.accent}10`]}
                  style={styles.iconCircle}>
                  <SymbolView name={h.icon} size={20} tintColor={theme.accent} />
                </LinearGradient>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText type="subtitle">{h.title}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {h.body}
                  </ThemedText>
                </View>
              </GlassCard>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.cta}>
          <PrimaryButton
            label="Create a new wallet"
            size="lg"
            onPress={() => router.push('/(onboarding)/create')}
          />
          <PrimaryButton
            label="Import existing wallet"
            variant="secondary"
            size="lg"
            onPress={() => router.push('/(onboarding)/import')}
          />
        </Animated.View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  heroSafe: {
    paddingTop: Spacing.four,
  },
  brandBlock: {
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: Spacing.one,
  },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    justifyContent: 'space-between',
    gap: Spacing.four,
  },
  highlights: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
    padding: Spacing.three,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: { gap: Spacing.two, paddingBottom: Spacing.three },
});
