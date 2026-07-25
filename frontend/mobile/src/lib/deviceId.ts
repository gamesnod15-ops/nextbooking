import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'device_id';

let cachedId: string | null = null;

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Persistent, random id for this app install — used to look up guest bookings without an account. */
export async function getDeviceId(): Promise<string> {
  if (cachedId) return cachedId;

  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) {
    id = generateId();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  }

  cachedId = id;
  return id;
}
