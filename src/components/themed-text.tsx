import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamily, Typography } from '@/constants/typography';
import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'display'
    | 'title'
    | 'headline'
    | 'subtitle'
    | 'small'
    | 'smallBold'
    | 'caption'
    | 'captionBold'
    | 'overline'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'display' && styles.display,
        type === 'title' && styles.title,
        type === 'headline' && styles.headline,
        type === 'subtitle' && styles.subtitle,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'caption' && styles.caption,
        type === 'overline' && styles.overline,
        type === 'link' && styles.link,
        type === 'linkPrimary' && [styles.link, { color: theme.accent }],
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: Typography.body,
  display: Typography.display,
  title: Typography.title,
  headline: Typography.headline,
  subtitle: Typography.subtitle,
  small: Typography.caption,
  smallBold: Typography.captionBold,
  caption: Typography.caption,
  captionBold: Typography.captionBold,
  overline: Typography.overline,
  link: Typography.caption,
  code: {
    ...Typography.mono,
    fontWeight: Platform.select({ android: '700' }) ?? '500',
  },
});

export { FontFamily, Typography };
