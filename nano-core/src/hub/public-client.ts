const DEFAULT_NANOHUB_SITE_URL = "https://nanosolana.netlify.app";

export type NanoHubExploreSort =
  | "newest"
  | "downloads"
  | "rating"
  | "installs"
  | "installsAllTime"
  | "trending";

export interface NanoHubSkillListItem {
  slug: string;
  displayName?: string | null;
  summary?: string | null;
  tags?: Record<string, string>;
  stats?: Record<string, number>;
  createdAt?: number;
  updatedAt?: number;
  latestVersion?: {
    version: string;
    createdAt?: number;
    changelog?: string | null;
  } | null;
}

export interface NanoHubSkillDetail extends NanoHubSkillListItem {
  owner?: {
    handle?: string | null;
    displayName?: string | null;
    image?: string | null;
  } | null;
}

export interface NanoHubSearchResult {
  score: number;
  slug?: string | null;
  displayName?: string | null;
  summary?: string | null;
  version?: string | null;
  updatedAt?: number | null;
}

export interface NanoHubSkillsResponse {
  items: NanoHubSkillListItem[];
  nextCursor?: string | null;
}

export interface NanoHubSkillResponse {
  skill: NanoHubSkillDetail | null;
  latestVersion?: {
    version: string;
    createdAt?: number;
    changelog?: string | null;
  } | null;
  owner?: {
    handle?: string | null;
    displayName?: string | null;
    image?: string | null;
  } | null;
}

export interface NanoHubSearchResponse {
  results: NanoHubSearchResult[];
}

export interface NanoHubSkillFileResponse {
  content: string;
  contentType?: string | null;
  path?: string | null;
  version?: string | null;
}

export function normalizeNanoHubSiteUrl(raw?: string | null): string {
  const candidate = raw?.trim() || DEFAULT_NANOHUB_SITE_URL;
  const normalized = candidate.startsWith("http://") || candidate.startsWith("https://")
    ? candidate
    : `https://${candidate}`;
  return normalized.replace(/\/+$/, "");
}

export function getNanoHubSiteUrl(override?: string | null): string {
  return normalizeNanoHubSiteUrl(override ?? process.env.NANO_HUB_URL ?? DEFAULT_NANOHUB_SITE_URL);
}

export function getNanoHubApiBaseUrl(override?: string | null): string {
  return `${getNanoHubSiteUrl(override)}/api/v1`;
}

export function getNanoHubDiscoveryUrl(override?: string | null): string {
  return `${getNanoHubSiteUrl(override)}/.well-known/nanohub.json`;
}

export function getNanoHubSkillUrl(
  slug: string,
  options: { siteUrl?: string | null; ownerHandle?: string | null } = {},
): string {
  const siteUrl = getNanoHubSiteUrl(options.siteUrl);
  const safeSlug = encodeURIComponent(slug.trim());
  if (options.ownerHandle?.trim()) {
    return `${siteUrl}/${encodeURIComponent(options.ownerHandle.trim())}/${safeSlug}`;
  }
  return `${siteUrl}/skills/${safeSlug}`;
}

export function getNanoHubApiSort(sort?: string | null): string {
  const normalized = sort?.trim().toLowerCase();
  if (!normalized || normalized === "newest" || normalized === "updated") {
    return "updated";
  }
  if (normalized === "downloads" || normalized === "download") {
    return "downloads";
  }
  if (normalized === "rating" || normalized === "stars" || normalized === "star") {
    return "stars";
  }
  if (
    normalized === "installs"
    || normalized === "install"
    || normalized === "installscurrent"
    || normalized === "installs-current"
    || normalized === "current"
  ) {
    return "installsCurrent";
  }
  if (normalized === "installsalltime" || normalized === "installs-all-time") {
    return "installsAllTime";
  }
  if (normalized === "trending") {
    return "trending";
  }
  throw new Error(
    `Invalid sort "${sort}". Use newest, downloads, rating, installs, installsAllTime, or trending.`,
  );
}

export async function listNanoHubSkills(options: {
  siteUrl?: string | null;
  limit?: number;
  sort?: string | null;
  highlightedOnly?: boolean;
} = {}): Promise<NanoHubSkillsResponse> {
  const url = new URL(`${getNanoHubApiBaseUrl(options.siteUrl)}/skills`);
  if (options.limit) {
    url.searchParams.set("limit", String(clampNanoHubLimit(options.limit)));
  }
  const apiSort = getNanoHubApiSort(options.sort);
  if (apiSort !== "updated") {
    url.searchParams.set("sort", apiSort);
  }
  if (options.highlightedOnly) {
    url.searchParams.set("highlightedOnly", "true");
  }
  return fetchNanoHubJson<NanoHubSkillsResponse>(url.toString());
}

export async function searchNanoHubSkills(options: {
  query: string;
  siteUrl?: string | null;
  limit?: number;
  highlightedOnly?: boolean;
}): Promise<NanoHubSearchResponse> {
  const url = new URL(`${getNanoHubApiBaseUrl(options.siteUrl)}/search`);
  url.searchParams.set("q", options.query.trim());
  if (options.limit) {
    url.searchParams.set("limit", String(clampNanoHubLimit(options.limit)));
  }
  if (options.highlightedOnly) {
    url.searchParams.set("highlightedOnly", "true");
  }
  return fetchNanoHubJson<NanoHubSearchResponse>(url.toString());
}

export async function getNanoHubSkill(
  slug: string,
  options: { siteUrl?: string | null } = {},
): Promise<NanoHubSkillResponse> {
  return fetchNanoHubJson<NanoHubSkillResponse>(
    `${getNanoHubApiBaseUrl(options.siteUrl)}/skills/${encodeURIComponent(slug.trim())}`,
  );
}

export async function getNanoHubSkillFile(
  slug: string,
  options: {
    path?: string;
    siteUrl?: string | null;
    version?: string | null;
    tag?: string | null;
  } = {},
): Promise<NanoHubSkillFileResponse> {
  const url = new URL(`${getNanoHubApiBaseUrl(options.siteUrl)}/skills/${encodeURIComponent(slug.trim())}/file`);
  url.searchParams.set("path", options.path?.trim() || "SKILL.md");
  if (options.version?.trim()) {
    url.searchParams.set("version", options.version.trim());
  }
  if (options.tag?.trim()) {
    url.searchParams.set("tag", options.tag.trim());
  }
  return fetchNanoHubJson<NanoHubSkillFileResponse>(url.toString());
}

export function clampNanoHubLimit(limit: number, fallback = 10): number {
  if (!Number.isFinite(limit)) return fallback;
  return Math.max(1, Math.min(200, Math.floor(limit)));
}

async function fetchNanoHubJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) as T | { error?: string; message?: string } : null;

  if (!response.ok) {
    const message = payload && typeof payload === "object" && payload !== null
      ? ("error" in payload && payload.error) || ("message" in payload && payload.message)
      : undefined;
    throw new Error(message || `NanoHub request failed (${response.status})`);
  }

  return payload as T;
}
