import { describe, expect, it } from 'vitest';

import {
  detectAddressNetwork,
  isAddressValidForNetwork,
} from '@/services/addressValidation';

const EVM = '0x1234567890123456789012345678901234567890';
const TRON = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const TON = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

describe('detectAddressNetwork', () => {
  it('detects EVM, TRON, and TON formats', () => {
    expect(detectAddressNetwork(EVM)).toBe('ethereum');
    expect(detectAddressNetwork(TRON)).toBe('tron');
    expect(detectAddressNetwork(TON)).toBe('ton');
  });

  it('returns null for garbage', () => {
    expect(detectAddressNetwork('hello')).toBeNull();
  });
});

describe('isAddressValidForNetwork', () => {
  it('accepts EVM address on polygon and bsc', () => {
    expect(isAddressValidForNetwork(EVM, 'polygon')).toBe(true);
    expect(isAddressValidForNetwork(EVM, 'bsc')).toBe(true);
  });

  it('rejects TRON address on ethereum', () => {
    expect(isAddressValidForNetwork(TRON, 'ethereum')).toBe(false);
    expect(isAddressValidForNetwork(TRON, 'tron')).toBe(true);
  });
});
