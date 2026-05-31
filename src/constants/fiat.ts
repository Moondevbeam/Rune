export type FiatCurrency = 'USD' | 'EUR' | 'GBP';

export const FIAT_SYMBOLS: Record<FiatCurrency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
};
