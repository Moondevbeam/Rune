# Rune Wallet

[![CI](https://github.com/moondevbeam/Rune/actions/workflows/ci.yml/badge.svg)](https://github.com/moondevbeam/Rune/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**A mobile wallet that helps you track payment promises — and pay them when the time comes.**

> **Status:** Early preview (`v0.1.x`). Open-source MVP, **not audited**. Do not use with real funds you cannot afford to lose.  
> **Download:** [GitHub Releases](https://github.com/moondevbeam/Rune/releases) (Android APK, pre-release)

---

## In sintesi (IT)

**Rune** è un wallet mobile per USDT su più blockchain. La differenza rispetto a un wallet normale: non mostra solo il saldo, ma anche **le promesse di pagamento** tra te e altre persone — chi ti deve, cosa devi tu, entro quando. Quando è il momento di pagare, tocchi **Fulfill** e l'invio è già precompilato.

*Esempio:* paghi la cena per 4 amici → crei uno split → ognuno compare come “ti deve €25”. Quando Luca paga, invii USDT con un tap.

---

## What is Rune?

Most crypto wallets answer: *“How much money do I have?”*

Rune also answers: *“Who owes what to whom — and when?”*

It combines:

1. **A self-custodial wallet** — you hold your own keys; send and receive USDT on Ethereum, Polygon, BNB Chain, TRON, and TON.
2. **A commitment hub** — a personal list of payment promises between you and other people (not on-chain contracts; stored locally on your phone).

Think of commitments as **IOUs with context**: a title, an amount, a person, and optionally a due date. When it's time to pay, Rune opens Send with the details already filled in.

### A concrete example

You pay dinner for four friends (€100 total). In Rune:

1. You create a **split bill** → each friend appears as *“owes you €25”* on your home screen.
2. When Luca is ready to pay, you tap **Fulfill** on his commitment.
3. The send screen opens with amount and chain pre-filled → you confirm with your PIN → USDT is sent.

Same idea works for rent, gifts, monthly support to family abroad, or any custom promise you want to track.

---

## How is this different from a normal wallet?

| Normal wallet | Rune |
|---------------|------|
| Shows balance and transaction history | Also shows **active payment promises** |
| You send when you remember | Commitments surface **what's due** on the home screen |
| No notion of “who owes me” | Split bills, gifts, recurring payments become **trackable commitments** |
| Chain-first UX | **People-first UX** — chains are infrastructure, not the product |

Rune is **not** a bank, exchange, lending app, or payment processor. It does not enforce payments on-chain. Commitments are reminders and organization — the actual transfer is a normal wallet send.

---

## Main features

### Core
- **Home dashboard** — active commitments, what's due, total balance
- **New commitment** — track anything you owe or are owed (title, amount, due date)
- **Fulfill** — one tap from a commitment to pre-filled Send
- **Send & receive** — USDT across 5 networks
- **Portfolio & history** — balances and past transactions

### Tools (each creates commitments on the home screen)
| Tool | What it does |
|------|----------------|
| **Split bill** | Divide an expense; each unpaid participant becomes “owes you” |
| **Gift envelope** | Time-boxed gift with a shareable receive link |
| **Recurring** | Rent, stipend, subscription on a schedule |
| **Custom commitment** | Any promise — “lunch with Marco”, “pay plumber Friday” |
| **Contacts** | Save trusted addresses |
| **Smart receive** | Suggest the best chain to receive on |
| **Spending vault** | Optional monthly spending cap |
| **Proof of payment** | Share a receipt after sending |

### Security (MVP level)
- Create or import wallet with 12-word recovery phrase
- 6-digit PIN + optional biometrics
- Auto-lock on background
- Screenshot blocking on seed phrase screens
- ESLint rules to prevent logging secrets in code

See [Security limitations](#security--disclaimer) below — this is preview software.

---

## How it works (3 steps)

```
1. CREATE          2. TRACK              3. FULFILL
   a commitment  →  on Home screen  →  tap Fulfill → Send → PIN → done
```

1. **Create** — split bill, gift, recurring payment, or custom commitment
2. **Track** — Home shows what's due, what's incoming, what's upcoming
3. **Fulfill** — when ready, tap the card → Send opens pre-filled → confirm with PIN

New to the app? Open **Settings → Tutorial** for a guided walkthrough.

---

## Try the app (Android)

Pre-built APKs are on [GitHub Releases](https://github.com/moondevbeam/Rune/releases).

1. Download `rune-wallet.apk`
2. Allow install from unknown sources on your Android device
3. Open and install

> Releases are marked **Pre-release** — experimental builds for testing and feedback.

---

## Security & disclaimer

Rune is an **unfinished, unaudited** open-source project:

- Do **not** store significant funds
- Security model may have gaps (PIN hashing, clipboard, backup settings, etc.)
- Use for **testing, demos, and contributions** only
- You use it **at your own risk**

Report issues on GitHub. For security concerns, avoid posting sensitive details in public issues.

---

## For developers

### Requirements

Rune **does not run in Expo Go** — the Tether WDK needs native modules and a generated worklet bundle.

### Quick start

```bash
git clone https://github.com/moondevbeam/Rune.git
cd Rune
npm install
npx expo install --fix
cp .env.example .env          # optional API keys
npx wdk-worklet-bundler generate
npx expo prebuild --clean
npx expo run:android          # or: npx expo run:ios
```

The worklet bundle lands in `.wdk-bundle/` (gitignored). EAS Build regenerates it via `eas-build-post-install` in `package.json`.

### Scripts

```bash
npm run start        # Metro dev server
npm run lint         # ESLint (+ security rules)
npm run typecheck    # TypeScript
npm test             # Vitest
npm run build:apk    # EAS cloud build (APK)
npm run download:apk # Download latest finished APK
```

### Stack

| Layer | Technology |
|-------|------------|
| App | Expo 56, Expo Router, React Native |
| Wallet engine | [Tether WDK](https://docs.tether.io/wdk/intro) |
| State | Zustand |
| Data fetching | TanStack Query |

### Project layout

```
src/
  app/                 Screens (onboarding, tabs, send, tools)
  components/wallet/   UI primitives (PinPad, CommitmentCard, …)
  services/            Wallet, prices, commitments logic
  store/               Auth, preferences, commitments data
docs/
  ARCHITECTURE.md      Technical overview for contributors
```

Full technical map: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).  
Contributing: [CONTRIBUTING.md](CONTRIBUTING.md).

### Building a release APK

```bash
npx eas login
npx eas init                    # once, links project to Expo

npm run build:apk -- --wait     # cloud build (~10–15 min)
npm run download:apk            # saves rune-wallet.apk in project root
```

Then upload to GitHub Releases manually, or push a `v*` tag to trigger [release.yml](.github/workflows/release.yml) (requires `EXPO_TOKEN` secret).

Before public distribution: change `android.package` in `app.json` from `com.anonymous.Rune` to your own ID.

---

## What's not in this version

Bridge, lending, fiat on-ramp, push notifications, multi-wallet, WalletConnect, NFTs, staking. Swap screen is preview-only.

---

## License

[MIT](LICENSE) — Copyright (c) 2026 Moonbeam.

Built with [Tether WDK](https://docs.tether.io/wdk/intro). Expo template portions are MIT-licensed by Expo.
