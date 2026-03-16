// Stub: thinking
export function extractThinkingContent(text: string): { thinking: string | null; visible: string } {
  return { thinking: null, visible: text };
}
export function stripThinkingTags(text: string): string {
  return text;
}
export const THINKING_LEVELS = ["none", "low", "medium", "high"] as const;
export type ThinkingLevel = (typeof THINKING_LEVELS)[number];

export function formatThinkingLevels(): string {
  return THINKING_LEVELS.join(", ");
}
export function normalizeThinkLevel(raw: string): ThinkingLevel {
  const lower = raw.toLowerCase().trim();
  if (THINKING_LEVELS.includes(lower as ThinkingLevel)) return lower as ThinkingLevel;
  return "none";
}
export function normalizeVerboseLevel(raw: string): "on" | "off" {
  return raw.toLowerCase() === "on" ? "on" : "off";
}
export function resolveThinkingDefaultForModel(_model: string): ThinkingLevel {
  return "none";
}
