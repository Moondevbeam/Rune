import { describe, expect, it } from 'vitest';

import { aggregateCommitments } from '@/services/commitments';

describe('aggregateCommitments', () => {
  const now = Date.now();

  it('groups due recurring payments', () => {
    const result = aggregateCommitments({
      envelopes: [],
      splits: [],
      custom: [],
      recurring: [
        {
          id: 'rec1',
          label: 'Rent',
          amount: '500',
          chain: 'tron',
          assetKey: 'usdtTron',
          recipient: 'TAddr',
          intervalDays: 30,
          nextDueAt: now - 1000,
        },
      ],
    });
    expect(result.due).toHaveLength(1);
    expect(result.due[0]?.title).toBe('Rent');
    expect(result.due[0]?.direction).toBe('outgoing');
  });

  it('maps unpaid split participants to incoming commitments', () => {
    const result = aggregateCommitments({
      envelopes: [],
      recurring: [],
      custom: [],
      splits: [
        {
          id: 's1',
          title: 'Dinner',
          total: '60',
          chain: 'tron',
          createdAt: now,
          participants: [
            { name: 'Alex', amount: '30', paid: false },
            { name: 'Sam', amount: '30', paid: true },
          ],
        },
      ],
    });
    expect(result.incoming).toHaveLength(1);
    expect(result.incoming[0]?.subtitle).toBe('Alex owes you');
  });

  it('includes pending custom outgoing commitments in upcoming', () => {
    const result = aggregateCommitments({
      envelopes: [],
      splits: [],
      recurring: [],
      custom: [
        {
          id: 'c1',
          title: 'Birthday gift',
          amount: '50',
          symbol: 'USDT',
          chain: 'polygon',
          assetKey: 'usdtPolygon',
          direction: 'outgoing',
          status: 'pending',
          createdAt: now,
          dueAt: now + 86_400_000,
        },
      ],
    });
    expect(result.upcoming).toHaveLength(1);
    expect(result.upcoming[0]?.title).toBe('Birthday gift');
  });
});
