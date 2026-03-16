// Stub: session-key (routing)
export const DEFAULT_AGENT_ID = "default";
export const DEFAULT_MAIN_KEY = "main";

export function parseSessionKey(key: string): { agentId?: string; kind: string; label: string } {
  return { kind: "chat", label: key };
}
export function parseAgentSessionKey(key: string): {
  agentId: string | null;
  sessionKey: string;
} {
  if (key.includes(":")) {
    const [agentId, ...rest] = key.split(":");
    return { agentId: agentId ?? null, sessionKey: rest.join(":") };
  }
  return { agentId: null, sessionKey: key };
}
export function buildSessionKey(parts: { agentId?: string; kind: string; label: string }): string {
  return parts.label ?? "default";
}
export function buildAgentMainSessionKey(agentId: string): string {
  return `${agentId}:main`;
}
export function formatSessionKey(key: string): string {
  return key;
}
export function sessionKeyParts(key: string) {
  return { agentId: undefined, kind: "chat", label: key };
}
export function isSubagentSessionKey(key: string): boolean {
  return key.includes(":") && !key.startsWith(DEFAULT_AGENT_ID);
}
