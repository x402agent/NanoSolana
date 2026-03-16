// Stub: session-key-utils
export function parseAgentSessionKey(key: string): {
  agentId: string | null;
  sessionKey: string;
} {
  return { agentId: null, sessionKey: key };
}
export function buildAgentSessionKey(agentId: string, sessionKey: string): string {
  return agentId ? `${agentId}:${sessionKey}` : sessionKey;
}
