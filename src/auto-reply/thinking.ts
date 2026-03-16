// Stub: thinking
export function extractThinkingContent(text: string): { thinking: string | null; visible: string } {
  return { thinking: null, visible: text };
}
export function stripThinkingTags(text: string): string {
  return text;
}
export const THINKING_LEVELS = ["none", "low", "medium", "high"] as const;
export type ThinkingLevel = (typeof THINKING_LEVELS)[number];
