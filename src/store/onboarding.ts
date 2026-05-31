/**
 * Ephemeral onboarding store
 *
 * Holds the in-flight mnemonic across onboarding steps (create → confirm → pin).
 * Reset as soon as the wallet is committed; never written to disk.
 */
import { create } from 'zustand';

type OnboardingState = {
  mnemonic: string | null;
  /** Indexes that the user must re-type to prove they backed up the phrase. */
  challengeIndexes: number[];
  setMnemonic: (mnemonic: string | null) => void;
  setChallenge: (indexes: number[]) => void;
  reset: () => void;
};

export const useOnboarding = create<OnboardingState>((set) => ({
  mnemonic: null,
  challengeIndexes: [],
  setMnemonic: (mnemonic) => set({ mnemonic }),
  setChallenge: (indexes) => set({ challengeIndexes: indexes }),
  reset: () => set({ mnemonic: null, challengeIndexes: [] }),
}));
