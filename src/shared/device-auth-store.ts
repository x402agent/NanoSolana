// Stub: device-auth-store
export interface DeviceAuthEntry {
  token: string;
  role: string;
  scopes?: string[];
  createdAt: number;
}

export interface DeviceAuthStore {
  version: number;
  deviceId: string;
  tokens: Record<string, DeviceAuthEntry>;
}

interface StoreAdapter {
  readStore(): DeviceAuthStore | null;
  writeStore(store: DeviceAuthStore): void;
}

export function loadDeviceAuthTokenFromStore(params: {
  adapter: StoreAdapter;
  deviceId: string;
  role: string;
}): DeviceAuthEntry | null {
  const store = params.adapter.readStore();
  if (!store || store.deviceId !== params.deviceId) return null;
  return store.tokens[params.role] ?? null;
}

export function storeDeviceAuthTokenInStore(params: {
  adapter: StoreAdapter;
  deviceId: string;
  role: string;
  token: string;
  scopes?: string[];
}): DeviceAuthEntry {
  let store = params.adapter.readStore();
  if (!store || store.deviceId !== params.deviceId) {
    store = { version: 1, deviceId: params.deviceId, tokens: {} };
  }
  const entry: DeviceAuthEntry = {
    token: params.token,
    role: params.role,
    scopes: params.scopes,
    createdAt: Date.now(),
  };
  store.tokens[params.role] = entry;
  params.adapter.writeStore(store);
  return entry;
}

export function clearDeviceAuthTokenFromStore(params: {
  adapter: StoreAdapter;
  deviceId: string;
  role: string;
}): void {
  const store = params.adapter.readStore();
  if (!store) return;
  delete store.tokens[params.role];
  params.adapter.writeStore(store);
}
