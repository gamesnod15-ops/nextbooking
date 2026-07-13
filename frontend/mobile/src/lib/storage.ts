import * as SecureStore from 'expo-secure-store';

export const storage = {
  async get(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
  async clear(keys: string[]): Promise<void> {
    await Promise.all(keys.map((k) => SecureStore.deleteItemAsync(k)));
  },
};

export const AUTH_KEYS = [
  'access_token',
  'user_id',
  'role',
  'tenant_id',
  'full_name',
  'email',
  'phone',
  'job_title',
  'avatar_url',
  'app_role',
];
