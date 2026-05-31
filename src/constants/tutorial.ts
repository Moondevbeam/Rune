import type { Href } from 'expo-router';
import type { SymbolViewProps } from 'expo-symbols';

export type TutorialStep = {
  id: string;
  icon: SymbolViewProps['name'];
  title: string;
  body: string;
  tip?: string;
  action?: {
    label: string;
    href: Href;
  };
};

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'concept',
    icon: 'hand.raised.fill',
    title: 'Payment commitments',
    body:
      'Rune is built around promises between people — not chains. Track what you owe and what others owe you in one place.',
    tip: 'Think rent, dinner splits, gifts, or monthly support to family abroad.',
  },
  {
    id: 'home',
    icon: 'house.fill',
    title: 'Your home dashboard',
    body:
      'The Home tab shows how many commitments are active, which are due, and your total balance. Priority items appear first.',
    action: { label: 'Go to Home', href: '/(app)' },
  },
  {
    id: 'new',
    icon: 'plus.circle.fill',
    title: 'Create a commitment',
    body:
      'Tap New on Home or open Settings → Tutorial. Set a title, amount, direction (you owe / they owe you), and optional due date.',
    action: { label: 'Create one now', href: '/tools/new-commitment' as Href },
  },
  {
    id: 'fulfill',
    icon: 'arrow.up.right',
    title: 'Fulfill when it\'s time',
    body:
      'When a commitment is due, tap Fulfill on the card or use the Fulfill shortcut on Home. Send is pre-filled — confirm with your PIN.',
    action: { label: 'Open Send', href: '/send' },
  },
  {
    id: 'request',
    icon: 'arrow.down.left',
    title: 'Request a payment',
    body:
      'Waiting for someone to pay you? Use Request or Smart receive. Rune suggests the cheapest enabled chain for incoming USDT.',
    action: { label: 'Smart receive', href: '/tools/smart-receive' },
  },
  {
    id: 'templates',
    icon: 'square.grid.2x2.fill',
    title: 'Templates & tools',
    body:
      'Split bill, gift envelope, recurring payments, and remittance planner are shortcuts that create commitments for common situations.',
    action: { label: 'Browse templates', href: '/tools' },
  },
  {
    id: 'chains',
    icon: 'globe',
    title: 'Invisible chains',
    body:
      'You don\'t need to pick TRON vs Polygon every time. Enable the networks you use in Settings, and Rune routes on the cheapest rail.',
    tip: 'Disable chains you don\'t use to reduce RPC rate limits during development.',
  },
  {
    id: 'contacts',
    icon: 'person.2.fill',
    title: 'Trusted contacts',
    body:
      'Save names with per-chain addresses. When fulfilling a commitment, Rune warns you if the address format doesn\'t match the network.',
    action: { label: 'Manage contacts', href: '/tools/contacts' },
  },
  {
    id: 'security',
    icon: 'lock.shield.fill',
    title: 'Stay self-custodial',
    body:
      'Your keys never leave this device. Back up your 12-word recovery phrase offline. Rune cannot recover a lost seed or PIN.',
    tip: 'Use biometrics + auto-lock in Settings for everyday security.',
  },
];

export const TUTORIAL_RPC_TIP =
  'If balances fail to load (429 errors), add free RPC API keys in .env or disable unused networks in Settings.';
