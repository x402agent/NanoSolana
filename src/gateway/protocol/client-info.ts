// Stub: client-info
export interface ClientInfo {
  name: string;
  version: string;
  platform?: string;
}

export type GatewayClientName = "control-ui" | "cli" | "extension" | "api";
export type GatewayClientMode = "webchat" | "embedded" | "headless";

export const GATEWAY_CLIENT_NAMES = {
  CONTROL_UI: "control-ui" as GatewayClientName,
  CLI: "cli" as GatewayClientName,
  EXTENSION: "extension" as GatewayClientName,
  API: "api" as GatewayClientName,
} as const;

export const GATEWAY_CLIENT_MODES = {
  WEBCHAT: "webchat" as GatewayClientMode,
  EMBEDDED: "embedded" as GatewayClientMode,
  HEADLESS: "headless" as GatewayClientMode,
} as const;

export function parseClientInfo(_raw: unknown): ClientInfo {
  return { name: "nanoclawd-ui", version: "1.0.0" };
}
