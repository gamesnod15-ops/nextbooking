// getDeviceId caches its result in module-level state, so each test needs a
// fresh module instance to actually exercise SecureStore rather than the cache.
describe('getDeviceId', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('persists a newly generated id when none is stored yet', async () => {
    const SecureStore = require('expo-secure-store');
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
    const { getDeviceId } = require('../deviceId');

    const id = await getDeviceId();

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('device_id', id);
  });

  it('reuses an id already in SecureStore without writing a new one', async () => {
    const SecureStore = require('expo-secure-store');
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('existing-device-id');
    const { getDeviceId } = require('../deviceId');

    const id = await getDeviceId();

    expect(id).toBe('existing-device-id');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it('caches the id in-process so a second call skips SecureStore entirely', async () => {
    const SecureStore = require('expo-secure-store');
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('cached-id');
    const { getDeviceId } = require('../deviceId');

    const first = await getDeviceId();
    const second = await getDeviceId();

    expect(first).toBe('cached-id');
    expect(second).toBe('cached-id');
    expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(1);
  });
});
