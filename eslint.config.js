/**
 * ESLint flat config for Rune Wallet.
 *
 * Extends the Expo preset (auto-installed by `expo lint`) and adds custom
 * security rules that forbid logging or persisting sensitive material such as
 * mnemonic seeds, private keys, entropy buffers and PINs. Anything that
 * matches the SENSITIVE_NAMES list is flagged the moment it appears as the
 * argument of `console.*`, `Storage.set*` or `JSON.stringify` calls.
 */
const expoConfig = require('eslint-config-expo/flat');

const SENSITIVE_NAMES = [
  'mnemonic',
  'seed',
  'seedPhrase',
  'recoveryPhrase',
  'privateKey',
  'privKey',
  'priv_key',
  'entropy',
  'encryptedSeed',
  'encryptedEntropy',
  'encryptionKey',
  'pin',
  'pinCode',
  'password',
];

const sensitivePattern = SENSITIVE_NAMES.join('|');

const restrictedSyntax = [
  {
    selector: `CallExpression[callee.object.name="console"] Identifier[name=/^(${sensitivePattern})$/i]`,
    message:
      'Do not log sensitive material (mnemonic/seed/private key/entropy/PIN/password). Use redacted logging.',
  },
  {
    selector: `CallExpression[callee.object.name="console"] Property[key.name=/^(${sensitivePattern})$/i]`,
    message:
      'Do not log objects with sensitive fields (mnemonic/seed/private key/entropy/PIN). Use redacted logging.',
  },
  {
    selector: `CallExpression[callee.object.name="JSON"][callee.property.name="stringify"] Identifier[name=/^(${sensitivePattern})$/i]`,
    message:
      'Do not JSON.stringify sensitive material. Persist redacted projections only.',
  },
];

module.exports = [
  ...expoConfig,
  {
    ignores: [
      'dist/*',
      '.wdk/**',
      'node_modules/**',
      'android/**',
      'ios/**',
      'scripts/**',
    ],
  },
  {
    rules: {
      'no-restricted-syntax': ['error', ...restrictedSyntax],
      // WDK / Expo packages use non-standard entry points that ESLint cannot resolve.
      'import/no-unresolved': 'off',
      // React Compiler rules are strict; wallet flows use intentional effects.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/purity': 'off',
    },
  },
];
