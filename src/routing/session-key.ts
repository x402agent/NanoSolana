// Stub: session-key
export function parseSessionKey(key: string): { agentId?: string; kind: string; label: string } {
  return { kind: "chat", label: key };
}
export function buildSessionKey(parts: { agentId?: string; kind: string; label: string }): string {
  return parts.label ?? "default";
}
export function formatSessionKey(key: string): string {
  return key;
}
export function sessionKeyParts(key: string) {
  return { agentId: undefined, kind: "chat", label: key };
}
