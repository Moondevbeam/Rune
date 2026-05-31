import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export type FeeRowProps = {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
};

export const FeeRow = ({ label, value, hint, emphasis }: FeeRowProps) => (
  <ThemedView type={emphasis ? 'backgroundSelected' : 'backgroundElement'} style={styles.row}>
    <View style={{ flex: 1 }}>
      <ThemedText type={emphasis ? 'smallBold' : 'small'} themeColor={emphasis ? 'text' : 'textSecondary'}>
        {label}
      </ThemedText>
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
    <ThemedText type={emphasis ? 'default' : 'small'}>{value}</ThemedText>
  </ThemedView>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 12,
    gap: Spacing.two,
  },
});
