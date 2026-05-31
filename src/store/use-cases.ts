import { create } from 'zustand';

import { ASSETS_BY_NETWORK, type AssetKey, type SupportedNetwork } from '@/config/wdk';
import { loadJson, saveJson } from '@/lib/json-store';

const STORAGE_KEY = 'rune.useCases';

export type CommitmentDirection = 'incoming' | 'outgoing';

export type CustomCommitment = {
  id: string;
  title: string;
  amount: string;
  symbol: string;
  chain: SupportedNetwork;
  assetKey: AssetKey;
  direction: CommitmentDirection;
  contactId?: string;
  contactName?: string;
  recipient?: string;
  dueAt?: number;
  status: 'pending' | 'fulfilled' | 'expired';
  createdAt: number;
};

export type GiftEnvelope = {
  id: string;
  amount: string;
  chain: SupportedNetwork;
  symbol: string;
  message?: string;
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'received' | 'expired';
};

export type SplitParticipant = {
  name: string;
  amount: string;
  paid: boolean;
};

export type SplitBill = {
  id: string;
  title: string;
  total: string;
  chain: SupportedNetwork;
  participants: SplitParticipant[];
  createdAt: number;
};

export type RecurringPayment = {
  id: string;
  label: string;
  amount: string;
  chain: SupportedNetwork;
  assetKey: AssetKey;
  recipient: string;
  intervalDays: number;
  nextDueAt: number;
  lastPaidAt?: number;
};

export type VaultBudget = {
  chain: SupportedNetwork;
  monthlyLimitFiat: number;
  spentFiatThisMonth: number;
  monthKey: string;
};

export type WatchWallet = {
  id: string;
  label: string;
  addresses: Partial<Record<SupportedNetwork, string>>;
};

type PersistedUseCases = {
  envelopes: GiftEnvelope[];
  splits: SplitBill[];
  recurring: RecurringPayment[];
  custom: CustomCommitment[];
  vaults: VaultBudget[];
  watchWallets: WatchWallet[];
};

const monthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const defaultData = (): PersistedUseCases => ({
  envelopes: [],
  splits: [],
  recurring: [],
  custom: [],
  vaults: [],
  watchWallets: [],
});

const snapshot = (state: PersistedUseCases): PersistedUseCases => ({
  envelopes: state.envelopes,
  splits: state.splits,
  recurring: state.recurring,
  custom: state.custom,
  vaults: state.vaults,
  watchWallets: state.watchWallets,
});

type UseCasesState = PersistedUseCases & {
  isReady: boolean;
  hydrate: () => Promise<void>;
  addEnvelope: (e: Omit<GiftEnvelope, 'id' | 'createdAt' | 'status'>) => Promise<GiftEnvelope>;
  updateEnvelope: (id: string, status: GiftEnvelope['status']) => Promise<void>;
  addSplit: (s: Omit<SplitBill, 'id' | 'createdAt'>) => Promise<SplitBill>;
  markSplitPaid: (splitId: string, participantIndex: number) => Promise<void>;
  addRecurring: (r: Omit<RecurringPayment, 'id' | 'nextDueAt'> & { nextDueAt?: number }) => Promise<RecurringPayment>;
  markRecurringPaid: (id: string) => Promise<void>;
  removeRecurring: (id: string) => Promise<void>;
  setVault: (vault: VaultBudget) => Promise<void>;
  recordVaultSpend: (chain: SupportedNetwork, fiatAmount: number) => Promise<void>;
  getVault: (chain: SupportedNetwork) => VaultBudget | null;
  addWatchWallet: (w: Omit<WatchWallet, 'id'>) => Promise<WatchWallet>;
  removeWatchWallet: (id: string) => Promise<void>;
  addCustom: (
    c: Omit<CustomCommitment, 'id' | 'createdAt' | 'status' | 'assetKey' | 'symbol'> & {
      assetKey?: AssetKey;
      symbol?: string;
    },
  ) => Promise<CustomCommitment>;
  markCustomFulfilled: (id: string) => Promise<void>;
  removeCustom: (id: string) => Promise<void>;
};

const persist = async (data: PersistedUseCases) => saveJson(STORAGE_KEY, data);

const normalizeVaults = (vaults: VaultBudget[]): VaultBudget[] => {
  const key = monthKey();
  return vaults.map((v) =>
    v.monthKey === key ? v : { ...v, monthKey: key, spentFiatThisMonth: 0 },
  );
};

export const useUseCasesStore = create<UseCasesState>((set, get) => ({
  ...defaultData(),
  isReady: false,

  hydrate: async () => {
    const raw = await loadJson(STORAGE_KEY, defaultData());
    const data = { ...defaultData(), ...raw, custom: raw.custom ?? [] };
    set({ ...data, vaults: normalizeVaults(data.vaults), isReady: true });
  },

  addEnvelope: async (e) => {
    const entry: GiftEnvelope = {
      ...e,
      id: `env_${Date.now().toString(36)}`,
      createdAt: Date.now(),
      status: 'pending',
    };
    const data = { ...get(), envelopes: [...get().envelopes, entry] };
    await persist(snapshot({ ...get(), envelopes: data.envelopes }));
    set({ envelopes: data.envelopes });
    return entry;
  },

  updateEnvelope: async (id, status) => {
    const envelopes = get().envelopes.map((e) => (e.id === id ? { ...e, status } : e));
    await persist(snapshot({ ...get(), envelopes }));
    set({ envelopes });
  },

  addSplit: async (s) => {
    const entry: SplitBill = { ...s, id: `split_${Date.now().toString(36)}`, createdAt: Date.now() };
    const splits = [...get().splits, entry];
    await persist(snapshot({ ...get(), splits }));
    set({ splits });
    return entry;
  },

  markSplitPaid: async (splitId, participantIndex) => {
    const splits = get().splits.map((bill) => {
      if (bill.id !== splitId) return bill;
      const participants = bill.participants.map((p, i) =>
        i === participantIndex ? { ...p, paid: true } : p,
      );
      return { ...bill, participants };
    });
    await persist(snapshot({ ...get(), splits }));
    set({ splits });
  },

  addRecurring: async (r) => {
    const entry: RecurringPayment = {
      ...r,
      id: `rec_${Date.now().toString(36)}`,
      nextDueAt: r.nextDueAt ?? Date.now(),
    };
    const recurring = [...get().recurring, entry];
    await persist(snapshot({ ...get(), recurring }));
    set({ recurring });
    return entry;
  },

  markRecurringPaid: async (id) => {
    const recurring = get().recurring.map((r) => {
      if (r.id !== id) return r;
      const now = Date.now();
      return {
        ...r,
        lastPaidAt: now,
        nextDueAt: now + r.intervalDays * 86_400_000,
      };
    });
    await persist(snapshot({ ...get(), recurring }));
    set({ recurring });
  },

  removeRecurring: async (id) => {
    const recurring = get().recurring.filter((r) => r.id !== id);
    await persist(snapshot({ ...get(), recurring }));
    set({ recurring });
  },

  setVault: async (vault) => {
    const vaults = normalizeVaults([
      ...get().vaults.filter((v) => v.chain !== vault.chain),
      vault,
    ]);
    await persist(snapshot({ ...get(), vaults }));
    set({ vaults });
  },

  recordVaultSpend: async (chain, fiatAmount) => {
    const key = monthKey();
    const vaults = normalizeVaults(get().vaults).map((v) => {
      if (v.chain !== chain) return v;
      return {
        ...v,
        monthKey: key,
        spentFiatThisMonth: v.spentFiatThisMonth + fiatAmount,
      };
    });
    await persist(snapshot({ ...get(), vaults }));
    set({ vaults });
  },

  getVault: (chain) => {
    const key = monthKey();
    const v = get().vaults.find((x) => x.chain === chain);
    if (!v) return null;
    if (v.monthKey !== key) {
      return { ...v, monthKey: key, spentFiatThisMonth: 0 };
    }
    return v;
  },

  addWatchWallet: async (w) => {
    const entry: WatchWallet = { ...w, id: `watch_${Date.now().toString(36)}` };
    const watchWallets = [...get().watchWallets, entry];
    await persist(snapshot({ ...get(), watchWallets }));
    set({ watchWallets });
    return entry;
  },

  removeWatchWallet: async (id) => {
    const watchWallets = get().watchWallets.filter((w) => w.id !== id);
    await persist(snapshot({ ...get(), watchWallets }));
    set({ watchWallets });
  },

  addCustom: async (c) => {
    const assetKey =
      c.assetKey ??
      (ASSETS_BY_NETWORK[c.chain].find((k) => k.startsWith('usdt')) as AssetKey);
    const entry: CustomCommitment = {
      ...c,
      assetKey,
      symbol: c.symbol ?? 'USDT',
      id: `cmt_${Date.now().toString(36)}`,
      createdAt: Date.now(),
      status: 'pending',
    };
    const custom = [...get().custom, entry];
    await persist(snapshot({ ...get(), custom }));
    set({ custom });
    return entry;
  },

  markCustomFulfilled: async (id) => {
    const custom = get().custom.map((c) =>
      c.id === id ? { ...c, status: 'fulfilled' as const } : c,
    );
    await persist(snapshot({ ...get(), custom }));
    set({ custom });
  },

  removeCustom: async (id) => {
    const custom = get().custom.filter((c) => c.id !== id);
    await persist(snapshot({ ...get(), custom }));
    set({ custom });
  },
}));
