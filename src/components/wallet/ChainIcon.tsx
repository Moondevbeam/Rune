import { StyleSheet, View } from 'react-native';

import { NETWORK_COLORS, NETWORK_SYMBOLS, type SupportedNetwork } from '@/config/wdk';
import { ThemedText } from '@/components/themed-text';

type Props = {
  network: SupportedNetwork;
  size?: number;
};

export const ChainIcon = ({ network, size = 32 }: Props) => {
  const symbol = NETWORK_SYMBOLS[network];
  const color = NETWORK_COLORS[network];
  return (
    <View
      style={[
        styles.dot,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
      accessibilityLabel={`${network} icon`}>
      <ThemedText
        type="smallBold"
        style={{ color: '#fff', fontSize: size * 0.36 }}>
        {symbol.slice(0, 3)}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  dot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
