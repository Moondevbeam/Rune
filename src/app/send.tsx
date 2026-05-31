import { useAccount, type TransactionResult } from '@tetherto/wdk-react-native-core';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChainIcon } from '@/components/wallet/ChainIcon';
import { ChainHealthBanner } from '@/components/wallet/ChainHealthBanner';
import { FeeRow } from '@/components/wallet/FeeRow';
import { PinPad } from '@/components/wallet/PinPad';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import {
  ASSETS,
  ASSETS_BY_NETWORK,
  NETWORK_EXPLORERS,
  NETWORK_LABELS,
  type AssetKey,
  type SupportedNetwork,
} from '@/config/wdk';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTouchSession } from '@/hooks/use-touch-session';
import {
  formatFiat,
  formatTokenAmount,
  parseTokenAmount,
  truncateAddress,
} from '@/services/formatters';
import { isAddressValidForNetwork } from '@/services/addressValidation';
import { fiatValue, usePrices } from '@/services/prices';
import { useAuthStore } from '@/store/auth';
import { useContactsStore } from '@/store/contacts';
import { usePreferences } from '@/store/preferences';
import { useUseCasesStore } from '@/store/use-cases';

type Step = 'form' | 'preview' | 'confirm' | 'broadcasting' | 'success' | 'error';

const PIN_LENGTH = 6;
const ACCOUNT_INDEX = 0;

const isSupportedChain = (v: unknown): v is SupportedNetwork =>
  typeof v === 'string' &&
  (['ethereum', 'polygon', 'bsc', 'tron', 'ton'] as string[]).includes(v);

const isAssetKey = (v: unknown): v is AssetKey =>
  typeof v === 'string' && v in ASSETS;

export default function SendModal() {
  useTouchSession();
  const theme = useTheme();
  const params = useLocalSearchParams<{
    contactId?: string;
    chain?: string;
    assetKey?: string;
    recipient?: string;
    amount?: string;
    note?: string;
    commitmentSource?: string;
    commitmentId?: string;
  }>();
  const enabledChains = usePreferences((s) => s.enabledChains);
  const fiat = usePreferences((s) => s.fiat);
  const verifyPin = useAuthStore((s) => s.verifyPin);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const authenticateBiometric = useAuthStore((s) => s.authenticateBiometric);
  const prices = usePrices(fiat);
  const contacts = useContactsStore((s) => s.items);
  const getContact = useContactsStore((s) => s.getById);
  const getVault = useUseCasesStore((s) => s.getVault);
  const recordVaultSpend = useUseCasesStore((s) => s.recordVaultSpend);
  const markCustomFulfilled = useUseCasesStore((s) => s.markCustomFulfilled);
  const markRecurringPaid = useUseCasesStore((s) => s.markRecurringPaid);

  const initialChain = isSupportedChain(params.chain) ? params.chain : (enabledChains[0] ?? 'ethereum');
  const [chain, setChain] = useState<SupportedNetwork>(initialChain);
  const [assetKey, setAssetKey] = useState<AssetKey>(
    isAssetKey(params.assetKey) ? params.assetKey : ASSETS_BY_NETWORK[initialChain][0],
  );
  const [recipient, setRecipient] = useState(
    typeof params.recipient === 'string' ? params.recipient : '',
  );
  const [amount, setAmount] = useState(typeof params.amount === 'string' ? params.amount : '');
  const [paymentNote, setPaymentNote] = useState(
    typeof params.note === 'string' ? params.note : '',
  );
  const [contactWarning, setContactWarning] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<Step>('form');
  const [fee, setFee] = useState<string | null>(null);
  const [feeError, setFeeError] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [txResult, setTxResult] = useState<TransactionResult | null>(null);
  const [chainPickerOpen, setChainPickerOpen] = useState(false);

  useEffect(() => {
    if (!params.contactId) return;
    const contact = getContact(params.contactId);
    if (!contact) return;
    const addr = contact.addresses[chain];
    if (addr) {
      setRecipient(addr);
      setContactWarning(null);
      return;
    }
    setContactWarning(`${contact.name} has no ${NETWORK_LABELS[chain]} address saved.`);
  }, [params.contactId, chain, getContact]);

  const asset = ASSETS[assetKey];
  const account = useAccount({ network: chain, accountIndex: ACCOUNT_INDEX });

  const assetOptions = useMemo(() => ASSETS_BY_NETWORK[chain], [chain]);

  const handleChainChange = (next: SupportedNetwork) => {
    setChain(next);
    setAssetKey(ASSETS_BY_NETWORK[next][0]);
    setRecipient('');
    setAmount('');
    setChainPickerOpen(false);
  };

  const handlePaste = async () => {
    const t = await Clipboard.getStringAsync();
    setRecipient(t.trim());
  };

  const handleScan = async () => {
    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) return;
    }
    setScannerOpen(true);
  };

  const handleQRCode = ({ data }: { data: string }) => {
    const cleaned = data.split('?')[0].replace(/^[a-z]+:/i, '');
    setRecipient(cleaned);
    setScannerOpen(false);
  };

  const goPreview = async () => {
    setFee(null);
    setFeeError(null);
    setStep('preview');
    if (!account.account) {
      setFeeError('Wallet not ready.');
      return;
    }
    try {
      const raw = parseTokenAmount(amount, asset.getDecimals()).toString();
      const result = await account.estimateFee({
        to: recipient,
        asset,
        amount: raw,
      });
      if (!result.success) {
        setFeeError(result.error ?? 'Could not estimate fee');
        return;
      }
      setFee(result.fee);
    } catch (e) {
      setFeeError((e as Error).message);
    }
  };

  const goConfirm = () => {
    setPin('');
    setPinError(false);
    setStep('confirm');
  };

  const broadcast = async () => {
    if (!account.account) return;
    setStep('broadcasting');
    try {
      const raw = parseTokenAmount(amount, asset.getDecimals()).toString();
      const result = await account.send({ to: recipient, asset, amount: raw });
      setTxResult(result);
      if (result.success) {
        const fiatAmount = fiatValue(prices.data, asset.getSymbol(), Number(amount) || 0);
        await recordVaultSpend(chain, fiatAmount);
        const source = params.commitmentSource;
        const id = params.commitmentId;
        if (source === 'custom' && typeof id === 'string') {
          await markCustomFulfilled(id);
        }
        if (source === 'recurring' && typeof id === 'string') {
          await markRecurringPaid(id);
        }
      }
      setStep(result.success ? 'success' : 'error');
      if (!result.success) setFeeError(result.error ?? 'Transaction failed');
    } catch (e) {
      setFeeError((e as Error).message);
      setStep('error');
    }
  };

  const handlePinSubmit = async (value: string) => {
    const ok = await verifyPin(value);
    if (!ok) {
      setPinError(true);
      setTimeout(() => {
        setPin('');
        setPinError(false);
      }, 600);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await broadcast();
  };

  const handlePinBiometric = async () => {
    const ok = await authenticateBiometric('Confirm transaction');
    if (ok) await broadcast();
  };

  const amountInt = useMemo(() => {
    try {
      return parseTokenAmount(amount || '0', asset.getDecimals());
    } catch {
      return 0n;
    }
  }, [amount, asset]);

  const canPreview =
    recipient.length > 4 &&
    amountInt > 0n &&
    !account.isLoading &&
    !!account.account &&
    isAddressValidForNetwork(recipient, chain);

  const fiatSend = fiatValue(prices.data, asset.getSymbol(), Number(amount) || 0);
  const vault = getVault(chain);
  const vaultExceeded =
    vault && vault.monthlyLimitFiat > 0
      ? vault.spentFiatThisMonth + fiatSend > vault.monthlyLimitFiat
      : false;

  const handleSelectContact = (id: string) => {
    const contact = getContact(id);
    if (!contact) return;
    const addr = contact.addresses[chain];
    if (!addr) {
      setContactWarning(`No ${NETWORK_LABELS[chain]} address for ${contact.name}.`);
      setContactsOpen(false);
      return;
    }
    setRecipient(addr);
    setContactWarning(null);
    setContactsOpen(false);
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader
          title={
            step === 'form'
              ? params.commitmentId
                ? 'Fulfill commitment'
                : 'Send'
              : step === 'preview'
                ? 'Review'
                : step === 'confirm'
                  ? 'Confirm with PIN'
                  : step === 'broadcasting'
                    ? 'Sending…'
                    : step === 'success'
                      ? 'Sent'
                      : 'Send failed'
          }
          back
        />

        {step === 'form' ? (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled">
            <ChainHealthBanner
              currentChain={chain}
              enabledChains={enabledChains}
              onSwitchChain={handleChainChange}
            />

            <Pressable
              onPress={() => setChainPickerOpen(true)}
              accessibilityRole="button">
              {({ pressed }) => (
                <ThemedView
                  type="backgroundElement"
                  style={[styles.field, pressed && { opacity: 0.85 }]}>
                  <ChainIcon network={chain} size={28} />
                  <View style={{ flex: 1 }}>
                    <ThemedText type="small" themeColor="textSecondary">
                      Network
                    </ThemedText>
                    <ThemedText type="default">{NETWORK_LABELS[chain]}</ThemedText>
                  </View>
                  <SymbolView name="chevron.up.chevron.down" size={16} tintColor={theme.textSecondary} />
                </ThemedView>
              )}
            </Pressable>

            <ThemedView type="backgroundElement" style={styles.field}>
              <View style={{ flex: 1 }}>
                <ThemedText type="small" themeColor="textSecondary">
                  Asset
                </ThemedText>
                <View style={styles.assetRow}>
                  {assetOptions.map((k) => {
                    const a = ASSETS[k];
                    const active = k === assetKey;
                    return (
                      <Pressable
                        key={k}
                        onPress={() => setAssetKey(k)}
                        accessibilityRole="button">
                        {({ pressed }) => (
                          <ThemedView
                            type={active ? 'backgroundSelected' : 'background'}
                            style={[
                              styles.assetChip,
                              { borderColor: active ? theme.accent : theme.border },
                              pressed && { opacity: 0.85 },
                            ]}>
                            <ThemedText type="smallBold">{a.getSymbol()}</ThemedText>
                          </ThemedView>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ThemedView>

            <ThemedView type="backgroundElement" style={[styles.field, { flexDirection: 'column', alignItems: 'stretch' }]}>
              <ThemedText type="small" themeColor="textSecondary">
                Recipient address
              </ThemedText>
              <TextInput
                value={recipient}
                onChangeText={setRecipient}
                placeholder="0x… or T… or EQ…"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                style={[styles.input, { color: theme.text }]}
                accessibilityLabel="Recipient address"
              />
              <View style={styles.addrActions}>
                <Pressable onPress={handlePaste} accessibilityRole="button">
                  <ThemedText type="small" style={{ color: theme.accent }}>
                    Paste
                  </ThemedText>
                </Pressable>
                <Pressable onPress={handleScan} accessibilityRole="button">
                  <ThemedText type="small" style={{ color: theme.accent }}>
                    Scan QR
                  </ThemedText>
                </Pressable>
                {contacts.length ? (
                  <Pressable onPress={() => setContactsOpen(true)} accessibilityRole="button">
                    <ThemedText type="small" style={{ color: theme.accent }}>
                      Contacts
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>
              {contactWarning ? (
                <ThemedText type="small" style={{ color: theme.warning }}>
                  {contactWarning}
                </ThemedText>
              ) : null}
              {!isAddressValidForNetwork(recipient, chain) && recipient.length > 4 ? (
                <ThemedText type="small" style={{ color: theme.danger }}>
                  Address format does not match {NETWORK_LABELS[chain]}.
                </ThemedText>
              ) : null}
            </ThemedView>

            <ThemedView type="backgroundElement" style={[styles.field, { flexDirection: 'column', alignItems: 'stretch' }]}>
              <ThemedText type="small" themeColor="textSecondary">
                Payment note (optional, local)
              </ThemedText>
              <TextInput
                value={paymentNote}
                onChangeText={setPaymentNote}
                placeholder="Invoice #1234"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text }]}
                accessibilityLabel="Payment note"
              />
            </ThemedView>

            <ThemedView type="backgroundElement" style={[styles.field, { flexDirection: 'column', alignItems: 'stretch' }]}>
              <ThemedText type="small" themeColor="textSecondary">
                Amount ({asset.getSymbol()})
              </ThemedText>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, styles.amountInput, { color: theme.text }]}
                accessibilityLabel="Amount"
              />
              <ThemedText type="small" themeColor="textSecondary">
                ≈ {formatFiat(fiatValue(prices.data, asset.getSymbol(), Number(amount) || 0), fiat)}
              </ThemedText>
            </ThemedView>
          </ScrollView>
        ) : null}

        {step === 'preview' ? (
          <ScrollView contentContainerStyle={styles.content}>
            <ThemedText type="title" style={styles.amountTitle}>
              {amount} {asset.getSymbol()}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              ≈ {formatFiat(fiatValue(prices.data, asset.getSymbol(), Number(amount) || 0), fiat)}
            </ThemedText>
            <View style={{ height: Spacing.two }} />
            <FeeRow label="Network" value={NETWORK_LABELS[chain]} />
            <FeeRow label="Recipient" value={truncateAddress(recipient, 6)} />
            <FeeRow
              label="Network fee"
              value={
                fee ? `${formatTokenAmount(fee, asset.getDecimals())} ${asset.getSymbol()}` : '…'
              }
              hint={feeError ? feeError : undefined}
            />
            <FeeRow label="From" value={truncateAddress(account.address ?? '', 6)} />
            {paymentNote ? <FeeRow label="Note" value={paymentNote} /> : null}
            {vault ? (
              <FeeRow
                label="Vault"
                value={`${formatFiat(vault.spentFiatThisMonth, fiat)} / ${formatFiat(vault.monthlyLimitFiat, fiat)}`}
                hint={
                  vaultExceeded
                    ? 'This send exceeds your monthly vault cap.'
                    : undefined
                }
              />
            ) : null}
          </ScrollView>
        ) : null}

        {step === 'confirm' ? (
          <View style={styles.pinWrap}>
            <ThemedText type="subtitle" style={{ textAlign: 'center' }}>
              Confirm with PIN
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              {pinError ? 'Incorrect PIN, try again.' : 'Enter your 6-digit PIN to broadcast.'}
            </ThemedText>
            <View style={{ height: Spacing.four }} />
            <PinPad
              pinLength={PIN_LENGTH}
              value={pin}
              onChange={setPin}
              onSubmit={handlePinSubmit}
              onBiometric={biometricEnabled ? handlePinBiometric : undefined}
              error={pinError}
            />
          </View>
        ) : null}

        {step === 'broadcasting' ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.accent} />
            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.three }}>
              Broadcasting transaction…
            </ThemedText>
          </View>
        ) : null}

        {step === 'success' && txResult ? (
          <View style={styles.center}>
            <SymbolView name="checkmark.circle.fill" size={64} tintColor={theme.success} />
            <ThemedText type="title" style={{ textAlign: 'center', marginTop: Spacing.three }}>
              Sent!
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              Tx hash: {truncateAddress(txResult.hash, 8)}
            </ThemedText>
            <View style={{ height: Spacing.four }} />
            <PrimaryButton
              variant="secondary"
              label="View on explorer"
              onPress={() => Linking.openURL(NETWORK_EXPLORERS[chain](txResult.hash))}
            />
            <PrimaryButton label="Done" onPress={() => router.back()} />
          </View>
        ) : null}

        {step === 'error' ? (
          <View style={styles.center}>
            <SymbolView name="xmark.octagon.fill" size={64} tintColor={theme.danger} />
            <ThemedText type="title" style={{ textAlign: 'center', marginTop: Spacing.three }}>
              Send failed
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={{ textAlign: 'center' }}
              selectable>
              {feeError ?? txResult?.error ?? 'Unknown error'}
            </ThemedText>
            <View style={{ height: Spacing.four }} />
            <PrimaryButton label="Try again" onPress={() => setStep('form')} />
          </View>
        ) : null}

        {step === 'form' ? (
          <View style={styles.footer}>
            <PrimaryButton label="Continue" onPress={goPreview} disabled={!canPreview} />
          </View>
        ) : null}
        {step === 'preview' ? (
          <View style={styles.footer}>
            <PrimaryButton
              label={vaultExceeded ? 'Send anyway' : 'Confirm send'}
              onPress={goConfirm}
              disabled={!fee}
            />
          </View>
        ) : null}

        <Modal visible={contactsOpen} animationType="slide" transparent>
          <Pressable
            style={styles.backdrop}
            onPress={() => setContactsOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close contacts"
          />
          <ThemedView type="backgroundElement" style={styles.sheet}>
            <ScreenHeader title="Trusted contacts" />
            {contacts.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => handleSelectContact(c.id)}
                accessibilityRole="button">
                {({ pressed }) => (
                  <ThemedView
                    type="background"
                    style={[styles.networkOption, pressed && { opacity: 0.85 }]}>
                    <ThemedText type="default">{c.name}</ThemedText>
                  </ThemedView>
                )}
              </Pressable>
            ))}
            <PrimaryButton
              variant="secondary"
              label="Manage contacts"
              onPress={() => {
                setContactsOpen(false);
                router.push('/tools/contacts');
              }}
            />
          </ThemedView>
        </Modal>

        <Modal visible={chainPickerOpen} animationType="slide" transparent>
          <Pressable
            style={styles.backdrop}
            onPress={() => setChainPickerOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close chain picker"
          />
          <ThemedView type="backgroundElement" style={styles.sheet}>
            <ScreenHeader title="Select network" />
            {enabledChains.map((c) => (
              <Pressable
                key={c}
                onPress={() => handleChainChange(c)}
                accessibilityRole="button">
                {({ pressed }) => (
                  <ThemedView
                    type={c === chain ? 'backgroundSelected' : 'background'}
                    style={[styles.networkOption, pressed && { opacity: 0.85 }]}>
                    <ChainIcon network={c} size={32} />
                    <ThemedText type="default">{NETWORK_LABELS[c]}</ThemedText>
                  </ThemedView>
                )}
              </Pressable>
            ))}
          </ThemedView>
        </Modal>

        <Modal visible={scannerOpen} animationType="slide">
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <SafeAreaView style={{ flex: 1 }}>
              <ScreenHeader title="Scan QR" />
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleQRCode}
              />
              <View style={{ padding: Spacing.three }}>
                <PrimaryButton
                  variant="secondary"
                  label="Cancel"
                  onPress={() => setScannerOpen(false)}
                />
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 14,
    gap: Spacing.three,
  },
  assetRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  assetChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  input: {
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
  amountInput: { fontSize: 28, fontWeight: '600' },
  addrActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  amountTitle: { textAlign: 'center', marginTop: Spacing.four },
  footer: {
    padding: Spacing.four,
  },
  pinWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.one,
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#0006',
  },
  sheet: {
    paddingBottom: Spacing.six,
    paddingHorizontal: Spacing.three,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: Spacing.one,
  },
  networkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 12,
  },
});
