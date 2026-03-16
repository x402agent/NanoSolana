// Stub: tool-display-common
export interface ToolDisplaySpec {
  verb?: string;
  title?: string;
  icon?: string;
  label?: string;
  description?: string;
  detail?: string;
}

export function normalizeToolName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9_.-]/g, "-");
}

export function defaultTitle(tool: string): string {
  return tool
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatToolDetailText(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (detail == null) return "";
  return JSON.stringify(detail, null, 2);
}

export function resolveToolVerbAndDetailForArgs(
  _tool: string,
  _args?: Record<string, unknown>,
  _spec?: ToolDisplaySpec | null,
): { verb: string; detail: string } {
  return { verb: "Running", detail: "" };
}

export function getToolDisplay(_tool: string): ToolDisplaySpec | null {
  return null;
}

export function formatToolLabel(tool: string): string {
  return defaultTitle(tool);
}
