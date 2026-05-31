/**
 * WDK Worklet Bundler Configuration
 *
 * Defines which blockchain modules are bundled into the Bare worklet that runs
 * the WDK engine on a background thread. Regenerate with:
 *   npx wdk-worklet-bundler generate
 *
 * The runtime network configuration (RPC providers, chain IDs, etc.) lives in
 * `src/config/wdk.ts` and is passed to <WdkAppProvider /> as `wdkConfigs`.
 */
module.exports = {
  modules: {
    core: '@tetherto/wdk',
    evm: '@tetherto/wdk-wallet-evm',
    tron: '@tetherto/wdk-wallet-tron',
    ton: '@tetherto/wdk-wallet-ton',
  },
  networks: {
    ethereum: { module: 'evm', package: '@tetherto/wdk-wallet-evm' },
    polygon: { module: 'evm', package: '@tetherto/wdk-wallet-evm' },
    bsc: { module: 'evm', package: '@tetherto/wdk-wallet-evm' },
    tron: { module: 'tron', package: '@tetherto/wdk-wallet-tron' },
    ton: { module: 'ton', package: '@tetherto/wdk-wallet-ton' },
  },
};
