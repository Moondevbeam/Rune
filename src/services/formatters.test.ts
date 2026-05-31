import { describe, expect, it } from 'vitest';

import {
  formatFiat,
  formatTokenAmount,
  parseTokenAmount,
  truncateAddress,
} from '@/services/formatters';

describe('formatTokenAmount', () => {
  it('formats USDT base units with 6 decimals', () => {
    expect(formatTokenAmount('1500000', 6)).toBe('1.5');
    expect(formatTokenAmount('1000000', 6)).toBe('1');
  });

  it('returns 0 for invalid input', () => {
    expect(formatTokenAmount('not-a-number', 6)).toBe('0');
    expect(formatTokenAmount(null, 6)).toBe('0');
  });
});

describe('parseTokenAmount', () => {
  it('round-trips with formatTokenAmount', () => {
    const raw = parseTokenAmount('1.25', 6);
    expect(raw).toBe(1250000n);
    expect(formatTokenAmount(raw, 6)).toBe('1.25');
  });

  it('handles comma decimal separator', () => {
    expect(parseTokenAmount('2,5', 6)).toBe(2500000n);
  });
});

describe('formatFiat', () => {
  it('prefixes USD with symbol', () => {
    expect(formatFiat(42.5, 'USD')).toBe('$42.50');
    expect(formatFiat(1234.5, 'USD')).toBe('$1,235');
  });
});

describe('truncateAddress', () => {
  it('shortens long EVM addresses', () => {
    const addr = '0x1234567890123456789012345678901234567890';
    expect(truncateAddress(addr, 4)).toBe('0x1234…7890');
  });

  it('returns empty for null', () => {
    expect(truncateAddress(null)).toBe('');
  });
});
