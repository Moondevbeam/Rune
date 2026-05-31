import { useWalletManager } from '@tetherto/wdk-react-native-core';
import Constants from 'expo-constants';
import * as ScreenCapture from 'expo-screen-capture';
import { router, type Href } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChainIcon } from '@/components/wallet/ChainIcon';
import { PinPad } from '@/components/wallet/PinPad';
import { PrimaryButton } from '@/components/wallet/PrimaryButton';
import { ScreenHeader } from '@/components/wallet/ScreenHeader';
import { SeedGrid } from '@/components/wallet/SeedGrid';
import { NETWORK_LABELS, SUPPORTED_NETWORKS } from '@/config/wdk';
import { PALETTES, PALETTE_ORDER, Radius, Spacing, type ThemePaletteId } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTouchSession } from '@/hooks/use-touch-session';
import { DEFAULT_AUTO_LOCK_MS, useAuthStore } from '@/store/auth';
import { type FiatCurrency, type ThemePreference, usePreferences } from '@/store/preferences';

const PIN_LENGTH = 6;
const DEFAULT_WALLET_ID = 'rune-default';

const FIATS: FiatCurrency[] = ['USD', 'EUR', 'GBP'];
const THEMES: ThemePreference[] = ['system', 'light', 'dark'];
const AUTO_LOCK_PRESETS: { label: string; ms: number }[] = [
  { label: '30 seconds', ms: 30_000 },
  { label: '2 minutes', ms: DEFAULT_AUTO_LOCK_MS },
  { label: '10 minutes', ms: 10 * 60_000 },
  { label: 'Never', ms: Number.MAX_SAFE_INTEGER },
];

type SettingsModal =
  | null
  | 'change-pin-old'
  | 'change-pin-new'
  | 'change-pin-confirm'
  | 'reauth-backup'
  | 'show-seed';

export default function SettingsScreen() {
  useTouchSession();
  const theme = useTheme();
  const fiat = usePreferences((s) => s.fiat);
  const setFiat = usePreferences((s) => s.setFiat);
  const themePref = usePreferences((s) => s.theme);
  const setTheme = usePreferences((s) => s.setTheme);
  const themePalette = usePreferences((s) => s.themePalette);
  const setThemePalette = usePreferences((s) => s.setThemePalette);
  const enabledChains = usePreferences((s) => s.enabledChains);
  const toggleChain = usePreferences((s) => s.toggleChain);

  const biometric = useAuthStore((s) => s.biometricEnabled);
  const setBiometric = useAuthStore((s) => s.setBiometricEnabled);
  const autoLockMs = useAuthStore((s) => s.autoLockMs);
  const setAutoLockMs = useAuthStore((s) => s.setAutoLockMs);
  const verifyPin = useAuthStore((s) => s.verifyPin);
  const changePin = useAuthStore((s) => s.changePin);
  const resetAuth = useAuthStore((s) => s.reset);

  const { getMnemonic, deleteWallet, activeWalletId } = useWalletManager();

  const [modal, setModal] = useState<SettingsModal>(null);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [backupPin, setBackupPin] = useState('');
  const [backupError, setBackupError] = useState(false);
  const [seedWords, setSeedWords] = useState<string[] | null>(null);

  const handleToggleBiometric = async (next: boolean) => {
    try {
      await setBiometric(next);
    } catch (e) {
      Alert.alert('Biometrics unavailable', (e as Error).message);
    }
  };

  const handleChangePinFlow = async (value: string) => {
    if (modal === 'change-pin-old') {
      const ok = await verifyPin(value);
      if (!ok) {
        setPinError(true);
        setTimeout(() => {
          setOldPin('');
          setPinError(false);
        }, 600);
        return;
      }
      setOldPin(value);
      setNewPin('');
      setModal('change-pin-new');
      return;
    }
    if (modal === 'change-pin-new') {
      setNewPin(value);
      setConfirmPin('');
      setModal('change-pin-confirm');
      return;
    }
    if (modal === 'change-pin-confirm') {
      if (value !== newPin) {
        setPinError(true);
        setTimeout(() => {
          setConfirmPin('');
          setPinError(false);
        }, 600);
        return;
      }
      await changePin(oldPin, newPin);
      setModal(null);
      Alert.alert('PIN updated', 'Your PIN has been changed.');
    }
  };

  const handleReauthBackup = async (value: string) => {
    const ok = await verifyPin(value);
    if (!ok) {
      setBackupError(true);
      setTimeout(() => {
        setBackupPin('');
        setBackupError(false);
      }, 600);
      return;
    }
    try {
      await ScreenCapture.preventScreenCaptureAsync('seed-backup');
      const mnemonic = await getMnemonic(activeWalletId ?? DEFAULT_WALLET_ID);
      if (!mnemonic) {
        Alert.alert('No seed available');
        setModal(null);
        return;
      }
      setSeedWords(mnemonic.split(' ').filter(Boolean));
      setModal('show-seed');
    } catch (e) {
      Alert.alert('Could not read seed', (e as Error).message);
      setModal(null);
    } finally {
      ScreenCapture.allowScreenCaptureAsync('seed-backup').catch(() => {});
    }
  };

  const handleResetWallet = () => {
    Alert.alert(
      'Reset wallet',
      'This will permanently delete your wallet from this device. Make sure you have backed up your recovery phrase before continuing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              if (activeWalletId) await deleteWallet(activeWalletId);
              await resetAuth();
              router.replace('/');
            } catch (e) {
              Alert.alert('Failed to reset', (e as Error).message);
            }
          },
        },
      ],
    );
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Settings" />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Section title="Help">
            <Row
              icon="book.fill"
              label="How Rune works"
              value="Tutorial"
              onPress={() => router.push('/tools/tutorial' as Href)}
            />
          </Section>

          <Section title="Rune Tools">
            <Row
              icon="square.grid.2x2.fill"
              label="Use cases hub"
              value="Smart receive, vault, …"
              onPress={() => router.push('/tools')}
            />
          </Section>

          <Section title="Security">
            <Row
              icon="lock.fill"
              label="Change PIN"
              onPress={() => {
                setOldPin('');
                setModal('change-pin-old');
              }}
            />
            <SwitchRow
              icon="faceid"
              label="Unlock with biometrics"
              value={biometric}
              onChange={handleToggleBiometric}
            />
            <Row
              icon="key.fill"
              label="Show recovery phrase"
              onPress={() => {
                setBackupPin('');
                setModal('reauth-backup');
              }}
            />
            <Row
              icon="timer"
              label="Auto-lock"
              value={
                AUTO_LOCK_PRESETS.find((p) => p.ms === autoLockMs)?.label ??
                `${Math.round(autoLockMs / 60_000)} min`
              }
              onPress={() => {
                Alert.alert(
                  'Auto-lock after',
                  'Choose how long to wait before locking the wallet.',
                  AUTO_LOCK_PRESETS.map((p) => ({
                    text: p.label,
                    onPress: () => setAutoLockMs(p.ms),
                  })),
                );
              }}
            />
          </Section>

          <Section title="Appearance">
            <View style={styles.paletteRow}>
              <View style={styles.paletteHeader}>
                <SymbolView name="paintpalette.fill" size={20} tintColor={theme.accent} />
                <ThemedText type="default" style={{ flex: 1 }}>
                  Palette
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {PALETTES[themePalette].name}
                </ThemedText>
              </View>
              <View style={styles.paletteGrid}>
                {PALETTE_ORDER.map((id) => (
                  <PaletteSwatch
                    key={id}
                    id={id}
                    active={id === themePalette}
                    onSelect={() => setThemePalette(id)}
                  />
                ))}
              </View>
            </View>
            <SegmentRow
              icon="circle.lefthalf.filled"
              label="Theme"
              options={THEMES}
              value={themePref}
              onChange={setTheme}
            />
            <SegmentRow
              icon="dollarsign.circle.fill"
              label="Currency"
              options={FIATS}
              value={fiat}
              onChange={setFiat}
            />
          </Section>

          <Section title="Networks">
            {SUPPORTED_NETWORKS.map((c) => (
              <ToggleRow
                key={c}
                icon={<ChainIcon network={c} size={28} />}
                label={NETWORK_LABELS[c]}
                value={enabledChains.includes(c)}
                onChange={() => toggleChain(c)}
              />
            ))}
          </Section>

          <Section title="Danger zone">
            <Row
              icon="trash.fill"
              label="Reset wallet"
              danger
              onPress={handleResetWallet}
            />
          </Section>

          <View style={styles.aboutBlock}>
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              Rune Wallet · v{Constants.expoConfig?.version ?? '1.0.0'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              Powered by WDK by Tether
            </ThemedText>
          </View>
        </ScrollView>

        <Modal
          visible={modal === 'change-pin-old' || modal === 'change-pin-new' || modal === 'change-pin-confirm'}
          animationType="slide"
          transparent>
          <Pressable
            style={styles.backdrop}
            onPress={() => setModal(null)}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          />
          <ThemedView type="background" style={styles.sheet}>
            <ScreenHeader
              title={
                modal === 'change-pin-old'
                  ? 'Current PIN'
                  : modal === 'change-pin-new'
                    ? 'New PIN'
                    : 'Confirm new PIN'
              }
            />
            <View style={styles.modalBody}>
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                {pinError ? 'Incorrect PIN. Try again.' : 'Enter your 6-digit PIN.'}
              </ThemedText>
              <View style={{ height: Spacing.three }} />
              <PinPad
                pinLength={PIN_LENGTH}
                value={
                  modal === 'change-pin-old'
                    ? oldPin
                    : modal === 'change-pin-new'
                      ? newPin
                      : confirmPin
                }
                onChange={
                  modal === 'change-pin-old'
                    ? setOldPin
                    : modal === 'change-pin-new'
                      ? setNewPin
                      : setConfirmPin
                }
                onSubmit={handleChangePinFlow}
                error={pinError}
              />
            </View>
          </ThemedView>
        </Modal>

        <Modal visible={modal === 'reauth-backup'} animationType="slide" transparent>
          <Pressable
            style={styles.backdrop}
            onPress={() => setModal(null)}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          />
          <ThemedView type="background" style={styles.sheet}>
            <ScreenHeader title="Enter your PIN" />
            <View style={styles.modalBody}>
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                {backupError
                  ? 'Incorrect PIN. Try again.'
                  : 'Your recovery phrase will be shown on the next screen. Make sure no one is looking.'}
              </ThemedText>
              <View style={{ height: Spacing.three }} />
              <PinPad
                pinLength={PIN_LENGTH}
                value={backupPin}
                onChange={setBackupPin}
                onSubmit={handleReauthBackup}
                error={backupError}
              />
            </View>
          </ThemedView>
        </Modal>

        <Modal visible={modal === 'show-seed'} animationType="slide">
          <ThemedView style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
              <ScreenHeader
                title="Recovery phrase"
                right={
                  <Pressable
                    onPress={() => {
                      setSeedWords(null);
                      setModal(null);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Close">
                    <SymbolView name="xmark.circle.fill" size={24} tintColor={theme.textSecondary} />
                  </Pressable>
                }
              />
              <View style={{ padding: Spacing.four, gap: Spacing.three }}>
                <ThemedText type="small" themeColor="textSecondary">
                  Never share this phrase. Anyone with these words can take all your funds. Rune
                  has disabled screenshots on this screen.
                </ThemedText>
                {seedWords ? <SeedGrid words={seedWords} /> : null}
                <PrimaryButton
                  label="I've stored it safely"
                  onPress={() => {
                    setSeedWords(null);
                    setModal(null);
                  }}
                />
              </View>
            </SafeAreaView>
          </ThemedView>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <ThemedText type="smallBold" themeColor="textSecondary">
      {title.toUpperCase()}
    </ThemedText>
    <ThemedView type="backgroundElement" style={styles.sectionInner}>
      {children}
    </ThemedView>
  </View>
);

const Row = ({
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}) => {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => (
        <View style={[styles.row, pressed && { opacity: 0.85 }]}>
          <SymbolView name={icon} size={20} tintColor={danger ? theme.danger : theme.accent} />
          <ThemedText
            type="default"
            style={{ flex: 1, color: danger ? theme.danger : theme.text }}>
            {label}
          </ThemedText>
          {value ? (
            <ThemedText type="small" themeColor="textSecondary">
              {value}
            </ThemedText>
          ) : null}
          <SymbolView name="chevron.right" size={14} tintColor={theme.textSecondary} />
        </View>
      )}
    </Pressable>
  );
};

const SwitchRow = ({
  icon,
  label,
  value,
  onChange,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) => {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <SymbolView name={icon} size={20} tintColor={theme.accent} />
      <ThemedText type="default" style={{ flex: 1 }}>
        {label}
      </ThemedText>
      <Switch
        value={value}
        onValueChange={onChange}
        thumbColor={value ? theme.accent : undefined}
        accessibilityLabel={label}
      />
    </View>
  );
};

const SegmentRow = <T extends string>({
  icon,
  label,
  options,
  value,
  onChange,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) => {
  const theme = useTheme();
  return (
    <View style={[styles.row, { flexDirection: 'column', alignItems: 'stretch', gap: Spacing.two }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
        <SymbolView name={icon} size={20} tintColor={theme.accent} />
        <ThemedText type="default" style={{ flex: 1 }}>
          {label}
        </ThemedText>
      </View>
      <View style={styles.segment}>
        {options.map((opt) => {
          const active = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${opt}`}>
              {({ pressed }) => (
                <ThemedView
                  type={active ? 'backgroundSelected' : 'background'}
                  style={[
                    styles.segmentChip,
                    { borderColor: active ? theme.accent : theme.border },
                    pressed && { opacity: 0.85 },
                  ]}>
                  <ThemedText type="small">{opt}</ThemedText>
                </ThemedView>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const ToggleRow = ({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onChange: () => void;
}) => (
  <View style={styles.row}>
    {icon}
    <ThemedText type="default" style={{ flex: 1 }}>
      {label}
    </ThemedText>
    <Switch value={value} onValueChange={onChange} accessibilityLabel={label} />
  </View>
);

const PaletteSwatch = ({
  id,
  active,
  onSelect,
}: {
  id: ThemePaletteId;
  active: boolean;
  onSelect: () => void;
}) => {
  const theme = useTheme();
  const palette = PALETTES[id];
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityLabel={`Palette ${palette.name}`}
      accessibilityState={{ selected: active }}
      style={{ flex: 1, minWidth: 60 }}>
      {({ pressed }) => (
        <View
          style={[
            styles.swatchOuter,
            {
              borderColor: active ? palette.swatch : theme.border,
            },
            pressed && { opacity: 0.85 },
          ]}>
          <View style={styles.swatchStack}>
            <View style={[styles.swatchSlice, { backgroundColor: palette.light.gradientStart }]} />
            <View style={[styles.swatchSlice, { backgroundColor: palette.dark.gradientEnd }]} />
          </View>
          <ThemedText
            type="small"
            style={{
              color: active ? palette.swatch : theme.text,
              fontWeight: active ? '700' : '500',
              textAlign: 'center',
            }}>
            {palette.name}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  section: { gap: Spacing.one },
  sectionInner: { borderRadius: 14, overflow: 'hidden' },
  paletteRow: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#0001',
    gap: Spacing.three,
  },
  paletteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  paletteGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  swatchOuter: {
    borderRadius: Radius.md,
    borderWidth: 2,
    padding: 4,
    alignItems: 'center',
    gap: Spacing.one,
  },
  swatchStack: {
    width: '100%',
    height: 32,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  swatchSlice: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#0001',
  },
  segment: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  segmentChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  aboutBlock: { gap: Spacing.one, paddingVertical: Spacing.four },
  backdrop: { flex: 1, backgroundColor: '#0006' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalBody: { padding: Spacing.four, alignItems: 'center' },
});
