/**
 * Session activity tracker — auto-lock the wallet after inactivity.
 * Components call `touch()` on user activity; AuthGate consumes `isStale`.
 */
import { create } from 'zustand';

type SessionState = {
  lastTouchedAt: number;
  touch: () => void;
};

export const useSession = create<SessionState>((set) => ({
  lastTouchedAt: Date.now(),
  touch: () => set({ lastTouchedAt: Date.now() }),
}));

export const isSessionStale = (lastTouchedAt: number, autoLockMs: number) =>
  Date.now() - lastTouchedAt > autoLockMs;
