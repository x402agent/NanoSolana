// Stub: device-auth
export interface DeviceAuthStore {
  list(): Promise<unknown[]>;
  add(device: unknown): Promise<void>;
  remove(deviceId: string): Promise<void>;
}
