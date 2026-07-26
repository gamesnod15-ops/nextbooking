import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api, { APP_ENV } from './api';
import { getDeviceId } from './deviceId';

export interface ErrorContext {
  componentStack?: string;
  /** Where in the app this happened, e.g. 'booking-submit'. */
  scope?: string;
  [key: string]: unknown;
}

/** Set to false in tests to keep the network quiet. */
let enabled = true;
export function setErrorReportingEnabled(value: boolean) {
  enabled = value;
}

/**
 * Ships a client error to our own backend.
 *
 * Deliberately fire-and-forget and fully swallowed: a reporting failure must
 * never surface to the user or trigger another error. If a third-party
 * reporter (Sentry etc.) is added later, hook it in here alongside the POST.
 */
export function reportError(error: unknown, context: ErrorContext = {}): void {
  const err = error instanceof Error ? error : new Error(String(error));

  if (__DEV__) {
    console.error('[reportError]', err.message, context);
  }

  if (!enabled) return;

  (async () => {
    try {
      const deviceId = await getDeviceId().catch(() => 'unknown');
      await api.post('/client-errors', {
        message: err.message?.slice(0, 500) ?? 'unknown',
        stack: err.stack?.slice(0, 4000) ?? null,
        componentStack: context.componentStack?.slice(0, 2000) ?? null,
        scope: context.scope ?? null,
        platform: Platform.OS,
        osVersion: String(Platform.Version),
        appVersion: Constants.expoConfig?.version ?? 'unknown',
        appEnv: APP_ENV,
        deviceId,
      });
    } catch {
      /* reporting is best-effort */
    }
  })();
}
