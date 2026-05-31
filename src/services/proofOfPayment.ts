import { NETWORK_EXPLORERS, NETWORK_LABELS, type SupportedNetwork } from '@/config/networks';
import type { IndexedTx } from '@/services/indexer';

export const buildProofOfPaymentText = (tx: IndexedTx): string => {
  const explorer = NETWORK_EXPLORERS[tx.network](tx.hash);
  const when = new Date(tx.timestamp).toISOString();
  return [
    'Rune Wallet — Proof of Payment',
    '────────────────────────────',
    `Direction: ${tx.direction === 'out' ? 'Sent' : 'Received'}`,
    `Amount: ${tx.amount} ${tx.symbol}`,
    `Network: ${NETWORK_LABELS[tx.network]}`,
    `Status: ${tx.status}`,
    `From: ${tx.from}`,
    `To: ${tx.to}`,
    tx.fee ? `Fee: ${tx.fee} ${tx.feeSymbol ?? ''}`.trim() : null,
    `Time: ${when}`,
    `Tx hash: ${tx.hash}`,
    `Explorer: ${explorer}`,
  ]
    .filter(Boolean)
    .join('\n');
};

export const buildRemittanceSummary = (params: {
  source: SupportedNetwork;
  bridge: SupportedNetwork;
  destination: SupportedNetwork;
  note?: string;
}): string => {
  const { source, bridge, destination, note } = params;
  return [
    'Rune Remittance Plan',
    `1. Hold / receive USDT on ${NETWORK_LABELS[source]}`,
    `2. Prefer low-fee rail: ${NETWORK_LABELS[bridge]}`,
    `3. Deliver to recipient on ${NETWORK_LABELS[destination]}`,
    note ?? 'Always verify the recipient address matches the destination network.',
  ].join('\n');
};
