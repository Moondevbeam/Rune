import { Platform } from 'react-native';

export const FontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const Typography = {
  display: {
    fontFamily: FontFamily.extrabold,
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -1.2,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  headline: {
    fontFamily: FontFamily.semibold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyBold: {
    fontFamily: FontFamily.semibold,
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  captionBold: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    lineHeight: 18,
  },
  overline: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontSize: 13,
    lineHeight: 18,
  },
};
