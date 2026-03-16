// Stub: device-auth (gateway)
export interface DeviceAuthPayload {
  deviceId: string;
  token: string;
  signature?: string;
}

export function buildDeviceAuthPayload(params: {
  deviceId: string;
  token: string;
  signature?: string;
}): DeviceAuthPayload {
  return {
    deviceId: params.deviceId,
    token: params.token,
    signature: params.signature,
  };
}

export function validateDeviceAuth(_payload: unknown): DeviceAuthPayload | null {
  return null;
}
