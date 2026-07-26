import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import * as Location from 'expo-location';

export interface Coords {
  latitude: number;
  longitude: number;
}

export type LocationStatus =
  | 'idle'        // not asked yet this session
  | 'loading'     // permission prompt / fix in progress
  | 'granted'     // we have coordinates
  | 'denied'      // user said no
  | 'disabled'    // permission is fine but device location services are off
  | 'unavailable'; // platform/hardware error

interface UseUserLocation {
  coords: Coords | null;
  status: LocationStatus;
  /** Ask for permission and read a fix. Safe to call repeatedly. */
  request: () => Promise<void>;
  /** Opens OS settings so the user can flip the permission/services switch. */
  openSettings: () => void;
}

/**
 * Reads the device's coarse location for distance-sorting nearby businesses.
 * Never throws — every failure path resolves to a status the UI can explain.
 */
export function useUserLocation(autoRequest = true): UseUserLocation {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');

  const request = useCallback(async () => {
    setStatus('loading');
    try {
      const servicesOn = await Location.hasServicesEnabledAsync();
      if (!servicesOn) {
        setStatus('disabled');
        return;
      }

      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('denied');
        return;
      }

      const fix = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({ latitude: fix.coords.latitude, longitude: fix.coords.longitude });
      setStatus('granted');
    } catch {
      setStatus('unavailable');
    }
  }, []);

  const openSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:').catch(() => {});
    } else {
      Linking.openSettings().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!autoRequest) return;
    // Only auto-prompt when the permission was already granted before, so a
    // first-time user isn't hit with a system dialog the moment the tab opens.
    (async () => {
      try {
        const { status: perm } = await Location.getForegroundPermissionsAsync();
        if (perm === 'granted') {
          await request();
        }
      } catch {
        /* leave status as 'idle' — the UI offers a manual button */
      }
    })();
  }, [autoRequest, request]);

  return { coords, status, request, openSettings };
}
