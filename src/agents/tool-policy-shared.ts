// Stub: tool-policy-shared
export interface ToolPolicy {
  tool: string;
  action: "allow" | "deny" | "ask";
}
export type ToolPolicies = ToolPolicy[];

export function normalizeToolName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
}

export function expandToolGroups(
  tools: string[],
  _groups?: Record<string, string[]>,
): string[] {
  return tools;
}

export function resolveToolProfilePolicy(
  _tool: string,
  _profiles?: unknown[],
): "allow" | "deny" | "ask" {
  return "allow";
}
