# Contributing to Rune Wallet

Thank you for your interest in contributing. This project is open source under the [MIT License](LICENSE).

## Before you start

1. Read the [README](README.md) — Rune requires a **custom dev build** (not Expo Go).
2. Generate the WDK worklet bundle: `npx wdk-worklet-bundler generate`
3. Copy [`.env.example`](.env.example) to `.env` if you need custom RPCs.

## Development setup

```bash
git clone <your-fork-url>
cd Rune
npm install
npx expo install --fix
npx wdk-worklet-bundler generate
npx expo prebuild --clean   # first time only
npm run ios                 # or npm run android
```

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
```

All three should pass before opening a pull request.

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Keep changes focused — one feature or fix per PR.
3. Update README or `docs/` if you change setup, env vars, or architecture.
4. Add or update tests for pure logic in `src/services/` and `src/lib/`.
5. **Never** commit secrets, real mnemonics, or production API keys.

## Code guidelines

- Match existing patterns: Expo Router file routes, Zustand stores, themed components under `src/components/wallet/`.
- Use early returns and `handle*` prefixes for event handlers.
- Do not log or persist sensitive fields (`mnemonic`, `seed`, `pin`, `privateKey`, …) — ESLint enforces this.
- Follow [Expo SDK 56 docs](https://docs.expo.dev/versions/v56.0.0/) for platform APIs.

## Good first issues

- Improve test coverage for formatters and chain recommendation helpers.
- Accessibility labels on new screens.
- Documentation and screenshots in `docs/screenshots/`.
- i18n (Italian/English) for user-facing strings.

## Questions

Open a **Discussion** or **Issue** with the `question` label if something is unclear.
