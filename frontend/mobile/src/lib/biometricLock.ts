import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BIOMETRIC_LOCK_KEY = 'biometric_lock_enabled';

export interface BiometricSupport {
  available: boolean;
  /** 'face' | 'fingerprint' | 'iris' | null — what the device actually offers. */
  kind: 'face' | 'fingerprint' | 'iris' | null;
  label: string;
}

/** What the hardware supports, and a Turkish label for it. */
export async function getBiometricSupport(): Promise<BiometricSupport> {
  if (Platform.OS === 'web') return { available: false, kind: null, label: 'Biyometrik kilit' };

  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) {
      return { available: false, kind: null, label: 'Biyometrik kilit' };
    }

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return { available: true, kind: 'face', label: 'Yüz tanıma' };
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return { available: true, kind: 'fingerprint', label: 'Parmak izi' };
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return { available: true, kind: 'iris', label: 'İris tanıma' };
    }
    return { available: true, kind: null, label: 'Biyometrik kilit' };
  } catch {
    return { available: false, kind: null, label: 'Biyometrik kilit' };
  }
}

/** Prompts for biometric confirmation. Returns true only on a real success. */
export async function authenticate(reason = 'JetRandevu\'yu açmak için kimliğini doğrula'): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Vazgeç',
      // Allow the device passcode so a failed scan is not a dead end.
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}

export async function isBiometricLockEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(BIOMETRIC_LOCK_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setBiometricLockEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(BIOMETRIC_LOCK_KEY, enabled ? 'true' : 'false');
  } catch {
    /* a failed write just means the lock stays off */
  }
}

/**
 * Drives the app lock: reports whether the user still needs to authenticate.
 * Returns `unlocked: true` when the lock is off or the prompt succeeded.
 */
export function useBiometricLock() {
  const [checked, setChecked] = useState(false);
  const [unlocked, setUnlocked] = useState(true);

  const unlock = useCallback(async () => {
    const ok = await authenticate();
    setUnlocked(ok);
    return ok;
  }, []);

  useEffect(() => {
    (async () => {
      const enabled = await isBiometricLockEnabled();
      if (!enabled) {
        setUnlocked(true);
        setChecked(true);
        return;
      }
      setUnlocked(false);
      setChecked(true);
      await unlock();
    })();
  }, [unlock]);

  return { checked, unlocked, unlock };
}
