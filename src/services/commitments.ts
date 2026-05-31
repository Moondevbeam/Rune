import type { AssetKey, SupportedNetwork } from '@/config/wdk';
import type {
  CustomCommitment,
  GiftEnvelope,
  RecurringPayment,
  SplitBill,
} from '@/store/use-cases';

export type CommitmentKind = 'custom' | 'gift' | 'split' | 'recurring';

export type CommitmentDirection = 'incoming' | 'outgoing';

export type CommitmentStatus = 'pending' | 'due' | 'fulfilled' | 'expired';

export type CommitmentRef =
  | { source: 'custom'; id: string }
  | { source: 'recurring'; id: string }
  | { source: 'split'; splitId: string; participantIndex: number }
  | { source: 'envelope'; id: string };

export type Commitment = {
  id: string;
  kind: CommitmentKind;
  direction: CommitmentDirection;
  title: string;
  subtitle?: string;
  amount: string;
  symbol: string;
  chain: SupportedNetwork;
  assetKey?: AssetKey;
  status: CommitmentStatus;
  dueAt?: number;
  contactId?: string;
  contactName?: string;
  recipient?: string;
  ref: CommitmentRef;
};

export type CommitmentBuckets = {
  due: Commitment[];
  upcoming: Commitment[];
  incoming: Commitment[];
  all: Commitment[];
};

const resolveStatus = (dueAt: number | undefined, now: number): CommitmentStatus => {
  if (dueAt == null) return 'pending';
  if (dueAt <= now) return 'due';
  return 'pending';
};

const fromEnvelope = (e: GiftEnvelope, now: number): Commitment | null => {
  if (e.status !== 'pending') return null;
  const expired = e.expiresAt <= now;
  return {
    id: `envelope:${e.id}`,
    kind: 'gift',
    direction: 'incoming',
    title: e.message?.trim() || 'Gift envelope',
    subtitle: expired ? 'Expired' : `Expires ${new Date(e.expiresAt).toLocaleDateString()}`,
    amount: e.amount,
    symbol: e.symbol,
    chain: e.chain,
    status: expired ? 'expired' : resolveStatus(e.expiresAt, now),
    dueAt: e.expiresAt,
    ref: { source: 'envelope', id: e.id },
  };
};

const fromSplit = (bill: SplitBill): Commitment[] =>
  bill.participants.flatMap((p, i) => {
    if (p.paid) return [];
    return [
      {
        id: `split:${bill.id}:${i}`,
        kind: 'split' as const,
        direction: 'incoming' as const,
        title: bill.title,
        subtitle: `${p.name} owes you`,
        amount: p.amount,
        symbol: 'USDT',
        chain: bill.chain,
        status: 'pending' as const,
        ref: { source: 'split' as const, splitId: bill.id, participantIndex: i },
      },
    ];
  });

const fromRecurring = (r: RecurringPayment, now: number): Commitment => ({
  id: `recurring:${r.id}`,
  kind: 'recurring',
  direction: 'outgoing',
  title: r.label,
  subtitle: 'Recurring payment',
  amount: r.amount,
  symbol: 'USDT',
  chain: r.chain,
  assetKey: r.assetKey,
  recipient: r.recipient,
  status: resolveStatus(r.nextDueAt, now),
  dueAt: r.nextDueAt,
  ref: { source: 'recurring', id: r.id },
});

const fromCustom = (c: CustomCommitment, now: number): Commitment | null => {
  if (c.status === 'fulfilled' || c.status === 'expired') return null;

  return {
    id: `custom:${c.id}`,
    kind: 'custom',
    direction: c.direction,
    title: c.title,
    subtitle: c.contactName ?? (c.direction === 'outgoing' ? 'You owe' : 'Owes you'),
    amount: c.amount,
    symbol: c.symbol,
    chain: c.chain,
    assetKey: c.assetKey,
    contactId: c.contactId,
    contactName: c.contactName,
    recipient: c.recipient,
    status: c.dueAt != null && c.dueAt <= now ? 'due' : 'pending',
    dueAt: c.dueAt,
    ref: { source: 'custom', id: c.id },
  };
};

export type CommitmentSourceData = {
  envelopes: GiftEnvelope[];
  splits: SplitBill[];
  recurring: RecurringPayment[];
  custom: CustomCommitment[];
};

export const aggregateCommitments = (data: CommitmentSourceData): CommitmentBuckets => {
  const now = Date.now();
  const all: Commitment[] = [
    ...data.envelopes.flatMap((e) => {
      const c = fromEnvelope(e, now);
      return c ? [c] : [];
    }),
    ...data.splits.flatMap(fromSplit),
    ...data.recurring.map((r) => fromRecurring(r, now)),
    ...data.custom.flatMap((c) => {
      const entry = fromCustom(c, now);
      return entry ? [entry] : [];
    }),
  ].filter((c) => c.status !== 'expired');

  const sortByDue = (a: Commitment, b: Commitment) => {
    const aDue = a.dueAt ?? Number.MAX_SAFE_INTEGER;
    const bDue = b.dueAt ?? Number.MAX_SAFE_INTEGER;
    return aDue - bDue;
  };

  const due = all.filter((c) => c.status === 'due').sort(sortByDue);
  const upcoming = all
    .filter((c) => c.status === 'pending' && c.direction === 'outgoing')
    .sort(sortByDue);
  const incoming = all.filter((c) => c.direction === 'incoming' && c.status === 'pending');

  return { due, upcoming, incoming, all };
};

export const commitmentKindLabel: Record<CommitmentKind, string> = {
  custom: 'Commitment',
  gift: 'Gift',
  split: 'Split bill',
  recurring: 'Recurring',
};
