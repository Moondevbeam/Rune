# Rune Wallet

[![CI](https://github.com/moondevbeam/Rune/actions/workflows/ci.yml/badge.svg)](https://github.com/moondevbeam/Rune/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Self-custodial **multi-chain mobile wallet** (EVM, TRON, TON) built around **payment commitments** — track what you owe and what others owe you, then fulfill on the cheapest USDT rail. Powered by [Expo SDK 56](https://docs.expo.dev/) and the [Tether WDK](https://docs.tether.io/wdk/intro).

> **Disclaimer:** Rune is an open-source **MVP / portfolio project**. It has **not** been professionally audited. Do **not** rely on it for large amounts of funds.

## Features

- **Payment commitments** — gifts, split bills, recurring, remittances, and custom promises in one hub
- Onboarding: create / import wallet, 6-digit PIN, optional biometrics
- Send & receive across Ethereum, Polygon, BNB Chain, TRON, TON
- Portfolio, transaction history, themed UI with multiple palettes
- Smart receive, chain health, contacts, spending vault, proof of payment
- Security: secure seed storage, auto-lock, screen-capture block on seed screens, ESLint rules against logging secrets
- 
## Quick start

Rune **does not run in Expo Go** — the WDK worklet needs native modules.

```bash
git clone https://github.com/YOUR_USERNAME/Rune.git
cd Rune
npm install
npx expo install --fix
cp .env.example .env   # optional
npx wdk-worklet-bundler generate
npx expo prebuild --clean
npx expo run:ios       # or: npx expo run:android
```

The worklet bundle is written to `.wdk-bundle/wdk-worklet.bundle.js` (gitignored). Without it, Metro cannot resolve the WDK import and the app will not start. **EAS Build** regenerates it automatically via the `eas-build-post-install` script in `package.json`.

### Environment variables

Copy [`.env.example`](.env.example). All keys are optional; public RPCs and CoinGecko / explorer APIs are used as fallbacks.

## Development

```bash
npm run start        # Metro
npm run lint         # ESLint (+ security rules)
npm run typecheck    # TypeScript
npm test             # Vitest (pure services)
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for PR guidelines.

## Stack

| Layer | Technology |
|-------|------------|
| App | Expo 56, Expo Router, React Native 0.85 |
| Wallet | `@tetherto/wdk-react-native-core`, chain modules, secure storage |
| State | Zustand |
| Data | TanStack Query |
| UI | Custom themed components + `react-native-qrcode-svg` |

## Project layout

```
src/
  app/                 Expo Router (onboarding, tabs, modals, tools)
  components/wallet/   PinPad, AuthGate, QRCard, …
  services/            wdk, indexer, prices, chainHealth, formatters
  store/               auth, preferences, session, contacts, use-cases
  config/wdk.ts        Networks and assets
docs/
  ARCHITECTURE.md      System overview
  screenshots/         README assets (add your PNGs here)
```

Full architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Security model

- PIN hashed (SHA-256) in `expo-secure-store`
- Mnemonic in WDK secure storage (Keychain / Keystore)
- `AuthGate` locks on background and after inactivity (default 2 minutes)
- Custom ESLint rules block logging `mnemonic`, `seed`, `pin`, `privateKey`, etc.

  
## Commitments

Rune is organized around **payment commitments** — promises between you and someone else:

| Type | Description |
|------|-------------|
| Custom | Anything you owe or are owed, with optional due date |
| Split bill | Each unpaid participant becomes an incoming commitment |
| Gift envelope | Time-boxed gift with shareable receive link |
| Recurring | Rent, stipend, or subscription on a schedule |
| Remittance lane | Plan source → low-fee rail → destination |

Supporting tools: smart receive, chain health, trusted contacts, spending vault, watch-only wallets, proof of payment.

## GitHub Release (APK) — guida rapida

### Setup (una volta)

```bash
cd /Users/moonbeam/Rune   # il tuo path al progetto
npm install
npx eas login             # account gratis su expo.dev
npx eas init              # collega il progetto a Expo
```

> `eas-cli` è già nel progetto (`npm install`). **Non** serve `npm install -g`.

### Build APK + Release GitHub (manuale, 4 comandi)

```bash
cd /Users/moonbeam/Rune

# 1) Build in cloud (~10-15 min). Aggiungi --wait per aspettare qui.
npm run build:apk -- --wait

# 2) Scarica l'APK sul Mac
npm run download:apk

# 3) Crea la release su GitHub (serve `gh` installato e loggato)
gh release create v1.0.0 rune-wallet.apk \
  --title "Rune Wallet v1.0.0" \
  --generate-notes
```

Fatto. L’APK compare in **GitHub → Releases**.

### Automatico con tag

Dopo aver messo il secret `EXPO_TOKEN` su GitHub (Settings → Secrets → Actions):

```bash
git tag v1.0.0
git push origin v1.0.0
```

Il workflow [release.yml](.github/workflows/release.yml) builda e pubblica da solo.

### Prima di distribuire

- Change `android.package` in `app.json` from `com.anonymous.Rune` to your own ID.
- Optional: add RPC API keys as [EAS environment variables](https://docs.expo.dev/build-reference/variables/) so balances work out of the box.
- This APK is **preview / MVP** — not audited. See [SECURITY.md](SECURITY.md).

## Out of scope (MVP)

Bridge, lending, fiat on-ramp, push notifications, multi-wallet, WalletConnect, NFTs, staking, ERC-4337. Swap UI is preview-only until WDK Velora is available on the public registry.

## License

[MIT](LICENSE) — Copyright (c) 2026 Moonbeam.

## Acknowledgments

Built with [Tether WDK](https://docs.tether.io/wdk/intro). Expo template portions are MIT-licensed by Expo.
