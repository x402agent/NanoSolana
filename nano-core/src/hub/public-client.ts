import type {
  ScgHubSkillManifestResponse,
} from "./oneshot.js";

const DEFAULT_SCGHUB_SITE_URL = "https://hub.solana-clawd-go.com";

export type ScgHubExploreSort =
  | "newest"
  | "downloads"
  | "rating"
  | "installs"
  | "installsAllTime"
  | "trending";

export interface ScgHubSkillListItem {
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

export interface ScgHubSkillDetail extends ScgHubSkillListItem {
  owner?: {
    handle?: string | null;
    displayName?: string | null;
    image?: string | null;
  } | null;
}

export interface ScgHubSearchResult {
  score: number;
  slug?: string | null;
  displayName?: string | null;
  summary?: string | null;
  version?: string | null;
  updatedAt?: number | null;
}

export interface ScgHubSkillsResponse {
  items: ScgHubSkillListItem[];
  nextCursor?: string | null;
}

export interface ScgHubSkillResponse {
  skill: ScgHubSkillDetail | null;
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

export interface ScgHubSearchResponse {
  results: ScgHubSearchResult[];
}

export interface ScgHubSkillFileResponse {
  content: string;
  contentType?: string | null;
  path?: string | null;
  version?: string | null;
}

export function normalizeScgHubSiteUrl(raw?: string | null): string {
  const candidate = raw?.trim() || DEFAULT_SCGHUB_SITE_URL;
  const normalized = candidate.startsWith("http://") || candidate.startsWith("https://")
    ? candidate
    : `https://${candidate}`;
  return normalized.replace(/\/+$/, "");
}

export function getScgHubSiteUrl(override?: string | null): string {
  return normalizeScgHubSiteUrl(override ?? process.env.SCG_HUB_URL ?? DEFAULT_SCGHUB_SITE_URL);
}

export function getScgHubApiBaseUrl(override?: string | null): string {
  return `${getScgHubSiteUrl(override)}/api/v1`;
}

export function getScgHubDiscoveryUrl(override?: string | null): string {
  return `${getScgHubSiteUrl(override)}/.well-known/nanohub.json`;
}

export function getScgHubSkillUrl(
  slug: string,
  options: { siteUrl?: string | null; ownerHandle?: string | null } = {},
): string {
  const siteUrl = getScgHubSiteUrl(options.siteUrl);
  const safeSlug = encodeURIComponent(slug.trim());
  if (options.ownerHandle?.trim()) {
    return `${siteUrl}/${encodeURIComponent(options.ownerHandle.trim())}/${safeSlug}`;
  }
  return `${siteUrl}/skills/${safeSlug}`;
}

export function getScgHubApiSort(sort?: string | null): string {
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

export async function listScgHubSkills(options: {
  siteUrl?: string | null;
  limit?: number;
  sort?: string | null;
  highlightedOnly?: boolean;
} = {}): Promise<ScgHubSkillsResponse> {
  const url = new URL(`${getScgHubApiBaseUrl(options.siteUrl)}/skills`);
  if (options.limit) {
    url.searchParams.set("limit", String(clampScgHubLimit(options.limit)));
  }
  const apiSort = getScgHubApiSort(options.sort);
  if (apiSort !== "updated") {
    url.searchParams.set("sort", apiSort);
  }
  if (options.highlightedOnly) {
    url.searchParams.set("highlightedOnly", "true");
  }
  return fetchScgHubJson<ScgHubSkillsResponse>(url.toString());
}

export async function searchScgHubSkills(options: {
  query: string;
  siteUrl?: string | null;
  limit?: number;
  highlightedOnly?: boolean;
}): Promise<ScgHubSearchResponse> {
  const url = new URL(`${getScgHubApiBaseUrl(options.siteUrl)}/search`);
  url.searchParams.set("q", options.query.trim());
  if (options.limit) {
    url.searchParams.set("limit", String(clampScgHubLimit(options.limit)));
  }
  if (options.highlightedOnly) {
    url.searchParams.set("highlightedOnly", "true");
  }
  return fetchScgHubJson<ScgHubSearchResponse>(url.toString());
}

export async function getScgHubSkill(
  slug: string,
  options: { siteUrl?: string | null } = {},
): Promise<ScgHubSkillResponse> {
  return fetchScgHubJson<ScgHubSkillResponse>(
    `${getScgHubApiBaseUrl(options.siteUrl)}/skills/${encodeURIComponent(slug.trim())}`,
  );
}

export async function getScgHubSkillFile(
  slug: string,
  options: {
    path?: string;
    siteUrl?: string | null;
    version?: string | null;
    tag?: string | null;
  } = {},
): Promise<ScgHubSkillFileResponse> {
  const url = new URL(`${getScgHubApiBaseUrl(options.siteUrl)}/skills/${encodeURIComponent(slug.trim())}/file`);
  url.searchParams.set("path", options.path?.trim() || "SKILL.md");
  if (options.version?.trim()) {
    url.searchParams.set("version", options.version.trim());
  }
  if (options.tag?.trim()) {
    url.searchParams.set("tag", options.tag.trim());
  }
  return fetchScgHubJson<ScgHubSkillFileResponse>(url.toString());
}

export async function getScgHubSkillManifest(
  slug: string,
  options: { siteUrl?: string | null } = {},
): Promise<ScgHubSkillManifestResponse> {
  return fetchScgHubJson<ScgHubSkillManifestResponse>(
    `${getScgHubApiBaseUrl(options.siteUrl)}/skills/${encodeURIComponent(slug.trim())}/manifest`,
  );
}

export function clampScgHubLimit(limit: number, fallback = 10): number {
  if (!Number.isFinite(limit)) return fallback;
  return Math.max(1, Math.min(200, Math.floor(limit)));
}

async function fetchScgHubJson<T>(url: string): Promise<T> {
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
    throw new Error(message || `ScgHub request failed (${response.status})`);
  }

  return payload as T;
}
