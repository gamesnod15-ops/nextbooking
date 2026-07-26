import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import api from './api';

/* ────────────────────────────── OTA updates ────────────────────────────── */

/**
 * Checks for an over-the-air JS update when the app returns to the foreground
 * and applies it silently on the next launch.
 *
 * No-ops in Expo Go / dev, where `Updates.isEnabled` is false.
 */
export function useOtaUpdates() {
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    async function check() {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          await Updates.fetchUpdateAsync();
          // Applied on the next cold start rather than yanking the UI away
          // from whatever the user is doing right now.
        }
      } catch {
        /* offline or update server unreachable — try again next foreground */
      }
    }

    check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => sub.remove();
  }, []);
}

/* ─────────────────────────── Forced version gate ────────────────────────── */

export interface VersionGate {
  /** True when the installed build is older than the server's minimum. */
  updateRequired: boolean;
  storeUrl: string | null;
}

/** Compares dotted version strings, e.g. "1.2.10" vs "1.10.0". */
export function isVersionOlder(current: string, minimum: string): boolean {
  const toParts = (v: string) => v.split('.').map((n) => parseInt(n, 10) || 0);
  const a = toParts(current);
  const b = toParts(minimum);
  const len = Math.max(a.length, b.length);

  for (let i = 0; i < len; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    if (ai < bi) return true;
    if (ai > bi) return false;
  }
  return false;
}

/**
 * Asks the API whether this build is still supported. Fails open: if the check
 * cannot complete, the user is never blocked.
 */
export function useVersionGate(): VersionGate {
  const [gate, setGate] = useState<VersionGate>({ updateRequired: false, storeUrl: null });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const current = Constants.expoConfig?.version ?? '1.0.0';
        const res = await api.get('/app-version', { params: { platform: Platform.OS } });
        const minimum: string | undefined = res.data?.minimumVersion;
        const storeUrl: string | null = res.data?.storeUrl ?? null;

        if (!cancelled && minimum && isVersionOlder(current, minimum)) {
          setGate({ updateRequired: true, storeUrl });
        }
      } catch {
        /* fail open */
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return gate;
}
