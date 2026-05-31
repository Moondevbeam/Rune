import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { TxStatus } from '@/services/indexer';

const LABEL: Record<TxStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  failed: 'Failed',
};

export const TxStatusBadge = ({ status }: { status: TxStatus }) => {
  const theme = useTheme();
  const color =
    status === 'confirmed' ? theme.success : status === 'failed' ? theme.danger : theme.warning;
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}1A` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <ThemedText type="small" style={{ color }}>
        {LABEL[status]}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
