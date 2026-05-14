import type {
  ClawdHubSkillManifestResponse,
} from "./oneshot.js";

const DEFAULT_CLAWDHUB_SITE_URL = "https://hub.solana-clawd.com";

export type ClawdHubExploreSort =
  | "newest"
  | "downloads"
  | "rating"
  | "installs"
  | "installsAllTime"
  | "trending";

export interface ClawdHubSkillListItem {
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

export interface ClawdHubSkillDetail extends ClawdHubSkillListItem {
  owner?: {
    handle?: string | null;
    displayName?: string | null;
    image?: string | null;
  } | null;
}

export interface ClawdHubSearchResult {
  score: number;
  slug?: string | null;
  displayName?: string | null;
  summary?: string | null;
  version?: string | null;
  updatedAt?: number | null;
}

export interface ClawdHubSkillsResponse {
  items: ClawdHubSkillListItem[];
  nextCursor?: string | null;
}

export interface ClawdHubSkillResponse {
  skill: ClawdHubSkillDetail | null;
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

export interface ClawdHubSearchResponse {
  results: ClawdHubSearchResult[];
}

export interface ClawdHubSkillFileResponse {
  content: string;
  contentType?: string | null;
  path?: string | null;
  version?: string | null;
}

export function normalizeClawdHubSiteUrl(raw?: string | null): string {
  const candidate = raw?.trim() || DEFAULT_CLAWDHUB_SITE_URL;
  const normalized = candidate.startsWith("http://") || candidate.startsWith("https://")
    ? candidate
    : `https://${candidate}`;
  return normalized.replace(/\/+$/, "");
}

export function getClawdHubSiteUrl(override?: string | null): string {
  return normalizeClawdHubSiteUrl(override ?? process.env.CLAWD_HUB_URL ?? DEFAULT_CLAWDHUB_SITE_URL);
}

export function getClawdHubApiBaseUrl(override?: string | null): string {
  return `${getClawdHubSiteUrl(override)}/api/v1`;
}

export function getClawdHubDiscoveryUrl(override?: string | null): string {
  return `${getClawdHubSiteUrl(override)}/.well-known/nanohub.json`;
}

export function getClawdHubSkillUrl(
  slug: string,
  options: { siteUrl?: string | null; ownerHandle?: string | null } = {},
): string {
  const siteUrl = getClawdHubSiteUrl(options.siteUrl);
  const safeSlug = encodeURIComponent(slug.trim());
  if (options.ownerHandle?.trim()) {
    return `${siteUrl}/${encodeURIComponent(options.ownerHandle.trim())}/${safeSlug}`;
  }
  return `${siteUrl}/skills/${safeSlug}`;
}

export function getClawdHubApiSort(sort?: string | null): string {
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

export async function listClawdHubSkills(options: {
  siteUrl?: string | null;
  limit?: number;
  sort?: string | null;
  highlightedOnly?: boolean;
} = {}): Promise<ClawdHubSkillsResponse> {
  const url = new URL(`${getClawdHubApiBaseUrl(options.siteUrl)}/skills`);
  if (options.limit) {
    url.searchParams.set("limit", String(clampClawdHubLimit(options.limit)));
  }
  const apiSort = getClawdHubApiSort(options.sort);
  if (apiSort !== "updated") {
    url.searchParams.set("sort", apiSort);
  }
  if (options.highlightedOnly) {
    url.searchParams.set("highlightedOnly", "true");
  }
  return fetchClawdHubJson<ClawdHubSkillsResponse>(url.toString());
}

export async function searchClawdHubSkills(options: {
  query: string;
  siteUrl?: string | null;
  limit?: number;
  highlightedOnly?: boolean;
}): Promise<ClawdHubSearchResponse> {
  const url = new URL(`${getClawdHubApiBaseUrl(options.siteUrl)}/search`);
  url.searchParams.set("q", options.query.trim());
  if (options.limit) {
    url.searchParams.set("limit", String(clampClawdHubLimit(options.limit)));
  }
  if (options.highlightedOnly) {
    url.searchParams.set("highlightedOnly", "true");
  }
  return fetchClawdHubJson<ClawdHubSearchResponse>(url.toString());
}

export async function getClawdHubSkill(
  slug: string,
  options: { siteUrl?: string | null } = {},
): Promise<ClawdHubSkillResponse> {
  return fetchClawdHubJson<ClawdHubSkillResponse>(
    `${getClawdHubApiBaseUrl(options.siteUrl)}/skills/${encodeURIComponent(slug.trim())}`,
  );
}

export async function getClawdHubSkillFile(
  slug: string,
  options: {
    path?: string;
    siteUrl?: string | null;
    version?: string | null;
    tag?: string | null;
  } = {},
): Promise<ClawdHubSkillFileResponse> {
  const url = new URL(`${getClawdHubApiBaseUrl(options.siteUrl)}/skills/${encodeURIComponent(slug.trim())}/file`);
  url.searchParams.set("path", options.path?.trim() || "SKILL.md");
  if (options.version?.trim()) {
    url.searchParams.set("version", options.version.trim());
  }
  if (options.tag?.trim()) {
    url.searchParams.set("tag", options.tag.trim());
  }
  return fetchClawdHubJson<ClawdHubSkillFileResponse>(url.toString());
}

export async function getClawdHubSkillManifest(
  slug: string,
  options: { siteUrl?: string | null } = {},
): Promise<ClawdHubSkillManifestResponse> {
  return fetchClawdHubJson<ClawdHubSkillManifestResponse>(
    `${getClawdHubApiBaseUrl(options.siteUrl)}/skills/${encodeURIComponent(slug.trim())}/manifest`,
  );
}

export function clampClawdHubLimit(limit: number, fallback = 10): number {
  if (!Number.isFinite(limit)) return fallback;
  return Math.max(1, Math.min(200, Math.floor(limit)));
}

async function fetchClawdHubJson<T>(url: string): Promise<T> {
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
    throw new Error(message || `ClawdHub request failed (${response.status})`);
  }

  return payload as T;
}
