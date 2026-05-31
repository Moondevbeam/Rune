/** Shared TanStack Query options for WDK balance hooks — avoids hammering public RPCs. */
export const BALANCE_QUERY_OPTIONS = {
  /** Consider balances fresh for 2 minutes. */
  staleTime: 2 * 60 * 1000,
  /** Do not poll in the background; user pull-to-refresh or navigation refetch only. */
  refetchInterval: false as const,
};

/** Minimum ms between manual wallet refresh actions. */
export const BALANCE_REFRESH_COOLDOWN_MS = 45_000;
