import type { SupportedNetwork } from '@/config/networks';

const EVM_RE = /^0x[a-fA-F0-9]{40}$/;
const TRON_RE = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const TON_RE = /^(EQ|UQ)[A-Za-z0-9_-]{46}$/;

export const detectAddressNetwork = (address: string): SupportedNetwork | null => {
  const trimmed = address.trim();
  if (EVM_RE.test(trimmed)) return 'ethereum';
  if (TRON_RE.test(trimmed)) return 'tron';
  if (TON_RE.test(trimmed)) return 'ton';
  return null;
};

export const isAddressValidForNetwork = (
  address: string,
  network: SupportedNetwork,
): boolean => {
  const trimmed = address.trim();
  if (network === 'ethereum' || network === 'polygon' || network === 'bsc') {
    return EVM_RE.test(trimmed);
  }
  if (network === 'tron') return TRON_RE.test(trimmed);
  if (network === 'ton') return TON_RE.test(trimmed);
  return false;
};
