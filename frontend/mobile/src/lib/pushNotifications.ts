import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import api from './api';
import { getDeviceId } from './deviceId';
import { reportError } from './errorReporting';

const isExpoGo = Constants.appOwnership === 'expo';

let notificationsModule: typeof import('expo-notifications') | null = null;
async function getNotifications() {
  if (isExpoGo) return null;
  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications');
    notificationsModule!.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
  return notificationsModule;
}

export type PushRegistrationResult =
  | { status: 'granted'; token: string }
  | { status: 'denied' }
  | { status: 'unsupported' }
  | { status: 'error' };

export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  if (isExpoGo || !Device.isDevice || Platform.OS === 'web') {
    return { status: 'unsupported' };
  }

  try {
    const N = await getNotifications();
    if (!N) return { status: 'unsupported' };

    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('default', {
        name: 'Randevu Bildirimleri',
        importance: N.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0154F0',
      });
    }

    const existing = await N.getPermissionsAsync();
    let finalStatus = existing.status;

    if (finalStatus !== 'granted') {
      const asked = await N.requestPermissionsAsync();
      finalStatus = asked.status;
    }

    if (finalStatus !== 'granted') {
      return { status: 'denied' };
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    const tokenResponse = await N.getExpoPushTokenAsync(
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
    reportError(error, { scope: 'push-notifications' });
    return { status: 'error' };
  }
}

export function usePushNotifications(enabled = true) {
  const router = useRouter();
  const responseListener = useRef<{ remove(): void } | null>(null);

  useEffect(() => {
    if (!enabled || isExpoGo) return;

    (async () => {
      try {
        if (!Device.isDevice || Platform.OS === 'web') return;
        const N = await getNotifications();
        if (!N) return;
        const { status } = await N.getPermissionsAsync();
        if (status === 'granted') await registerForPushNotifications();
      } catch {
        /* ignore */
      }
    })();

    let mounted = true;
    (async () => {
      const N = await getNotifications();
      if (!mounted || !N) return;
      responseListener.current = N.addNotificationResponseReceivedListener((response) => {
        const route = response.notification.request.content.data?.route;
        if (typeof route === 'string' && route.startsWith('/')) {
          router.push(route as never);
        }
      });
    })();

    return () => {
      mounted = false;
      responseListener.current?.remove();
    };
  }, [enabled, router]);
}
