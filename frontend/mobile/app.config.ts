import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Environment-aware Expo config.
 *
 * API base URL resolution order:
 *   1. EXPO_PUBLIC_API_URL (set in .env or the shell / EAS build env)
 *   2. the built-in default for the current profile
 *
 * Set APP_ENV=development (or run `npm run dev`) to point the app at a local API.
 */
const APP_ENV = (process.env.APP_ENV ?? 'production') as 'development' | 'staging' | 'production';

const API_URLS: Record<typeof APP_ENV, string> = {
  development: 'http://localhost:5280/api/v1',
  staging: 'https://api-randevumkolay.azurewebsites.net/api/v1',
  production: 'https://api-randevumkolay.azurewebsites.net/api/v1',
};

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? API_URLS[APP_ENV];

// `androidNavigationBar` is a valid Expo key but is missing from ExpoConfig in
// this SDK's types, so the literal is asserted rather than widened.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'JetRandevu',
  slug: 'jetrandevu',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'jetrandevu',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.jetrandevu.app',
    buildNumber: '1',
    infoPlist: {
      // Required by Apple when the app talks to a server; ours is HTTPS-only.
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#0A0A0A',
    },
    package: 'com.jetrandevu.app',
    versionCode: 1,
  },
  androidNavigationBar: {
    visible: 'immersive',
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
    '@react-native-community/datetimepicker',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'JetRandevu, yakınındaki işletmeleri mesafeye göre listelemek için konumunu kullanır.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'JetRandevu, profil fotoğrafını değiştirebilmen için galerine erişir.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#0154F0',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl,
    appEnv: APP_ENV,
  },
} as ExpoConfig);
