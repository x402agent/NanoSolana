// Stub: client-info
export interface ClientInfo {
  name: string;
  version: string;
  platform?: string;
}
export function parseClientInfo(_raw: unknown): ClientInfo {
  return { name: "nanosolana-ui", version: "1.0.0" };
}
