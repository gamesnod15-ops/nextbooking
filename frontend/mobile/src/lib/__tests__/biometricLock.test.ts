import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getBiometricSupport,
  authenticate,
  isBiometricLockEnabled,
  setBiometricLockEnabled,
  BIOMETRIC_LOCK_KEY,
} from '../biometricLock';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  authenticateAsync: jest.fn(),
  AuthenticationType: { FACIAL_RECOGNITION: 1, FINGERPRINT: 2, IRIS: 3 },
}));

describe('getBiometricSupport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports unavailable when the device has no biometric hardware', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);

    const support = await getBiometricSupport();

    expect(support).toEqual({ available: false, kind: null, label: 'Biyometrik kilit' });
  });

  it('reports unavailable when hardware exists but nothing is enrolled', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);

    const support = await getBiometricSupport();

    expect(support.available).toBe(false);
  });

  it('prefers face recognition when both face and fingerprint are supported', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    ]);

    const support = await getBiometricSupport();

    expect(support).toEqual({ available: true, kind: 'face', label: 'Yüz tanıma' });
  });

  it('falls back to fingerprint when face recognition is not supported', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);

    const support = await getBiometricSupport();

    expect(support).toEqual({ available: true, kind: 'fingerprint', label: 'Parmak izi' });
  });

  it('never throws — a hardware-check failure degrades to unavailable', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockRejectedValue(new Error('boom'));

    await expect(getBiometricSupport()).resolves.toEqual({
      available: false,
      kind: null,
      label: 'Biyometrik kilit',
    });
  });
});

describe('authenticate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true only when the native prompt reports success', async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });
    await expect(authenticate()).resolves.toBe(true);

    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: false });
    await expect(authenticate()).resolves.toBe(false);
  });

  it('resolves false rather than throwing when the prompt errors', async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockRejectedValue(new Error('cancelled'));
    await expect(authenticate()).resolves.toBe(false);
  });
});

describe('biometric lock preference persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('defaults to disabled when nothing has been saved', async () => {
    await expect(isBiometricLockEnabled()).resolves.toBe(false);
  });

  it('round-trips an enabled preference through AsyncStorage', async () => {
    await setBiometricLockEnabled(true);
    await expect(AsyncStorage.getItem(BIOMETRIC_LOCK_KEY)).resolves.toBe('true');
    await expect(isBiometricLockEnabled()).resolves.toBe(true);
  });

  it('round-trips a disabled preference', async () => {
    await setBiometricLockEnabled(true);
    await setBiometricLockEnabled(false);
    await expect(isBiometricLockEnabled()).resolves.toBe(false);
  });
});
