// Stub: config-ui-hints-types
export interface ConfigUiHint {
  path: string;
  label?: string;
  description?: string;
  section?: string;
  subsection?: string;
  type?: string;
  options?: string[];
  placeholder?: string;
  deprecated?: boolean;
}
export type ConfigUiHints = Record<string, ConfigUiHint>;
