import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useSession } from '@/store/session';

/**
 * Refresh the inactivity timer whenever the screen gains focus or the user
 * interacts. AuthGate consumes the timer to auto-lock the wallet.
 */
export const useTouchSession = () => {
  const touch = useSession((s) => s.touch);
  useFocusEffect(
    useCallback(() => {
      touch();
    }, [touch]),
  );
};
