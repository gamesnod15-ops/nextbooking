import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import api from './api';
import { getDeviceId } from './deviceId';
import { reportError } from './errorReporting';

/** Foreground behaviour: show reminders even while the app is open. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type PushRegistrationResult =
  | { status: 'granted'; token: string }
  | { status: 'denied' }
  | { status: 'unsupported' }
  | { status: 'error' };

/**
 * Asks for notification permission and registers the Expo push token with our
 * API. Never throws — the caller only needs to know the outcome.
 */
export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  // Push tokens are not issued to simulators or the web build.
  if (!Device.isDevice || Platform.OS === 'web') {
    return { status: 'unsupported' };
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Randevu Bildirimleri',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0154F0',
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;

    if (finalStatus !== 'granted') {
      const asked = await Notifications.requestPermissionsAsync();
      finalStatus = asked.status;
    }

    if (finalStatus !== 'granted') {
      return { status: 'denied' };
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenResponse.data;

    const deviceId = await getDeviceId();
    await api.post('/push-tokens/register', {
      deviceId,
      token,
      platform: Platform.OS,
    });

    return { status: 'granted', token };
  } catch (error) {
    // Swallowing this silently is why "Bildirimler açılamadı" gives no clue —
    // report it through the same pipeline as every other client error so the
    // real cause (missing EAS push credentials, Expo Go's lack of remote-push
    // support, a rejected /push-tokens/register call, etc.) is visible on the
    // next occurrence instead of just "error".
    reportError(error, { scope: 'push-notifications' });
    return { status: 'error' };
  }
}

/**
 * Registers on mount and routes taps on a notification to the right screen.
 * Notifications carry a `route` in their data payload.
 */
export function usePushNotifications(enabled = true) {
  const router = useRouter();
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Only refresh silently when permission already exists — a first-time user
    // should meet the system prompt from the notification settings screen,
    // not the instant the app opens.
    (async () => {
      try {
        if (!Device.isDevice || Platform.OS === 'web') return;
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'granted') await registerForPushNotifications();
      } catch {
        /* ignore — the settings screen offers a manual path */
      }
    })();

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = response.notification.request.content.data?.route;
      if (typeof route === 'string' && route.startsWith('/')) {
        router.push(route as never);
      }
    });

    return () => {
      responseListener.current?.remove();
    };
  }, [enabled, router]);
}
