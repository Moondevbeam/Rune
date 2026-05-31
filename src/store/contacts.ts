import { create } from 'zustand';

import type { SupportedNetwork } from '@/config/wdk';
import { loadJson, saveJson } from '@/lib/json-store';

const STORAGE_KEY = 'rune.contacts';

export type TrustedContact = {
  id: string;
  name: string;
  addresses: Partial<Record<SupportedNetwork, string>>;
  preferredNetwork?: SupportedNetwork;
  createdAt: number;
};

type ContactsState = {
  items: TrustedContact[];
  isReady: boolean;
  hydrate: () => Promise<void>;
  add: (contact: Omit<TrustedContact, 'id' | 'createdAt'>) => Promise<TrustedContact>;
  update: (id: string, patch: Partial<Omit<TrustedContact, 'id' | 'createdAt'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  getById: (id: string) => TrustedContact | undefined;
};

const persist = async (items: TrustedContact[]) => saveJson(STORAGE_KEY, items);

export const useContactsStore = create<ContactsState>((set, get) => ({
  items: [],
  isReady: false,

  hydrate: async () => {
    const items = await loadJson<TrustedContact[]>(STORAGE_KEY, []);
    set({ items, isReady: true });
  },

  add: async (contact) => {
    const entry: TrustedContact = {
      ...contact,
      id: `c_${Date.now().toString(36)}`,
      createdAt: Date.now(),
    };
    const next = [...get().items, entry];
    await persist(next);
    set({ items: next });
    return entry;
  },

  update: async (id, patch) => {
    const next = get().items.map((c) => (c.id === id ? { ...c, ...patch } : c));
    await persist(next);
    set({ items: next });
  },

  remove: async (id) => {
    const next = get().items.filter((c) => c.id !== id);
    await persist(next);
    set({ items: next });
  },

  getById: (id) => get().items.find((c) => c.id === id),
}));
