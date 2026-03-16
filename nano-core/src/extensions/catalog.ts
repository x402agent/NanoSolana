import { existsSync, readdirSync, readFileSync, statSync, type Dirent } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type NanoExtensionKind = "channel" | "provider" | "tool" | "support" | "hybrid";
export type NanoExtensionMetadataSource = "nanosolana-plugin" | "openclaw-plugin" | "package-json";

export interface NanoExtensionInstallMetadata {
  npmSpec?: string;
  localPath?: string;
  defaultChoice?: string;
}

export interface NanoExtensionCatalogEntry {
  id: string;
  name: string;
  description: string;
  directory: string;
  packageName?: string;
  kind: NanoExtensionKind;
  channels: string[];
  aliases: string[];
  providers: string[];
  skills: string[];
  entrypoints: string[];
  fileCount: number;
  hasPersistence: boolean;
  metadataSources: NanoExtensionMetadataSource[];
  metadataPaths: string[];
  install?: NanoExtensionInstallMetadata;
}

export interface NanoExtensionCatalogSnapshot {
  directories: number;
  files: number;
  manifests: number;
  packageMetadata: number;
  entries: NanoExtensionCatalogEntry[];
}

export function resolveNanoRepositoryRoot(): string {
  const envRoot = process.env.NANO_REPO_ROOT?.trim();
  const sourceDirectory = dirname(fileURLToPath(import.meta.url));
  const nanoCoreRoot = resolve(sourceDirectory, "../..");
  const cwd = resolve(process.cwd());

  const candidates = [
    envRoot ? resolve(envRoot) : undefined,
    cwd,
    resolve(cwd, ".."),
    resolve(nanoCoreRoot, ".."),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (hasKnowledgeCorpus(candidate)) return candidate;
  }

  return resolve(nanoCoreRoot, "..");
}

export function scanNanoExtensions(
  repoRoot: string = resolveNanoRepositoryRoot(),
): NanoExtensionCatalogSnapshot {
  const extensionRoot = join(repoRoot, "extensions");
  if (!existsSync(extensionRoot)) {
    return {
      directories: 0,
      files: 0,
      manifests: 0,
      packageMetadata: 0,
      entries: [],
    };
  }

  const extensionDirectories = safeReadDirectory(extensionRoot)
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(extensionRoot, entry.name))
    .sort((left, right) => left.localeCompare(right));

  let totalFiles = 0;
  let manifestCount = 0;
  let packageMetadataCount = 0;
  const entries: NanoExtensionCatalogEntry[] = [];

  for (const directoryPath of extensionDirectories) {
    const fileCount = walkFiles(directoryPath).length;
    totalFiles += fileCount;

    const nanosolanaManifestPath = join(directoryPath, "nanosolana-plugin.json");
    const openClawManifestPath = join(directoryPath, "openclaw.plugin.json");
    const packagePath = join(directoryPath, "package.json");

    const nanosolanaManifest = readJsonObject(nanosolanaManifestPath);
    const openClawManifest = readJsonObject(openClawManifestPath);
    const packageJson = readJsonObject(packagePath);
    const packageMetadata = asRecord(packageJson?.["nanosolana"]);

    if (nanosolanaManifest) manifestCount += 1;
    if (openClawManifest) manifestCount += 1;
    if (packageMetadata) packageMetadataCount += 1;

    const extensionId = firstDefinedString(
      getStringField(nanosolanaManifest, "id"),
      getStringField(openClawManifest, "id"),
      getNestedStringField(packageMetadata, ["channel", "id"]),
      getStringField(packageJson, "name"),
      basename(directoryPath),
    ) ?? basename(directoryPath);

    const extensionName = firstDefinedString(
      getStringField(nanosolanaManifest, "name"),
      getStringField(openClawManifest, "name"),
      getNestedStringField(packageMetadata, ["channel", "label"]),
      getNestedStringField(packageMetadata, ["channel", "selectionLabel"]),
      humanizeExtensionId(extensionId),
    ) ?? humanizeExtensionId(extensionId);

    const extensionDescription = firstDefinedString(
      getStringField(nanosolanaManifest, "description"),
      getStringField(openClawManifest, "description"),
      getStringField(packageJson, "description"),
      getNestedStringField(packageMetadata, ["channel", "blurb"]),
      "",
    ) ?? "";

    const channels = uniqueStrings([
      ...getStringArrayField(nanosolanaManifest, "channels"),
      ...getStringArrayField(openClawManifest, "channels"),
      getNestedStringField(packageMetadata, ["channel", "id"]),
    ]);

    const aliases = uniqueStrings([
      ...getNestedStringArrayField(packageMetadata, ["channel", "aliases"]),
      getNestedStringField(packageMetadata, ["channel", "docsLabel"]),
    ]);

    const providers = uniqueStrings([
      ...getStringArrayField(nanosolanaManifest, "providers"),
      ...getStringArrayField(openClawManifest, "providers"),
    ]);

    const skills = uniqueStrings([
      ...getStringArrayField(nanosolanaManifest, "skills"),
      ...getStringArrayField(openClawManifest, "skills"),
    ]);

    const entrypoints = uniqueStrings([
      ...getNestedStringArrayField(packageMetadata, ["extensions"]),
      getStringField(packageJson, "main"),
    ]);

    const metadataSources = uniqueMetadataSources([
      nanosolanaManifest ? "nanosolana-plugin" : undefined,
      openClawManifest ? "openclaw-plugin" : undefined,
      packageMetadata ? "package-json" : undefined,
    ]);

    const metadataPaths = uniqueStrings([
      nanosolanaManifest ? toRepoRelative(repoRoot, nanosolanaManifestPath) : undefined,
      openClawManifest ? toRepoRelative(repoRoot, openClawManifestPath) : undefined,
      packageMetadata ? toRepoRelative(repoRoot, packagePath) : undefined,
    ]);

    const install = packageMetadata ? {
      npmSpec: getNestedStringField(packageMetadata, ["install", "npmSpec"]),
      localPath: getNestedStringField(packageMetadata, ["install", "localPath"]),
      defaultChoice: getNestedStringField(packageMetadata, ["install", "defaultChoice"]),
    } : undefined;

    entries.push({
      id: extensionId,
      name: extensionName,
      description: extensionDescription,
      directory: toRepoRelative(repoRoot, directoryPath),
      packageName: getStringField(packageJson, "name"),
      kind: determineExtensionKind(extensionId, channels, providers, skills, metadataSources),
      channels,
      aliases,
      providers,
      skills,
      entrypoints,
      fileCount,
      hasPersistence: hasPersistenceMetadata(nanosolanaManifest, openClawManifest),
      metadataSources,
      metadataPaths,
      install: install && hasInstallMetadata(install) ? install : undefined,
    });
  }

  entries.sort((left, right) => left.id.localeCompare(right.id));

  return {
    directories: extensionDirectories.length,
    files: totalFiles,
    manifests: manifestCount,
    packageMetadata: packageMetadataCount,
    entries,
  };
}

function hasKnowledgeCorpus(rootPath: string): boolean {
  return existsSync(join(rootPath, "nano-docs", "index.md")) && existsSync(join(rootPath, "extensions"));
}

function walkFiles(rootPath: string): string[] {
  if (!existsSync(rootPath)) return [];

  const files: string[] = [];
  const queue: string[] = [rootPath];

  while (queue.length > 0) {
    const currentPath = queue.pop();
    if (!currentPath) continue;

    for (const entry of safeReadDirectory(currentPath)) {
      const fullPath = join(currentPath, entry.name);

      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  files.sort((left, right) => left.localeCompare(right));
  return files;
}

function safeReadDirectory(path: string): Dirent[] {
  try {
    return readdirSync(path, { withFileTypes: true });
  } catch {
    return [];
  }
}

function readJsonObject(path: string): Record<string, unknown> | null {
  if (!existsSync(path)) return null;

  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
    return asRecord(parsed);
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function getStringField(record: Record<string, unknown> | null, key: string): string | undefined {
  if (!record) return undefined;
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function getStringArrayField(record: Record<string, unknown> | null, key: string): string[] {
  if (!record) return [];
  const value = record[key];
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
}

function getNestedStringField(record: Record<string, unknown> | null, keys: string[]): string | undefined {
  const value = getNestedValue(record, keys);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getNestedStringArrayField(record: Record<string, unknown> | null, keys: string[]): string[] {
  const value = getNestedValue(record, keys);
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
}

function getNestedValue(record: Record<string, unknown> | null, keys: string[]): unknown {
  let current: unknown = record;
  for (const key of keys) {
    const next = asRecord(current);
    if (!next) return undefined;
    current = next[key];
  }
  return current;
}

function firstDefinedString(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => typeof value === "string" && value.length > 0);
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  const normalized = values
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  return [...new Set(normalized)];
}

function uniqueMetadataSources(
  values: Array<NanoExtensionMetadataSource | undefined>,
): NanoExtensionMetadataSource[] {
  return [...new Set(values.filter((value): value is NanoExtensionMetadataSource => Boolean(value)))];
}

function determineExtensionKind(
  extensionId: string,
  channels: string[],
  providers: string[],
  skills: string[],
  metadataSources: NanoExtensionMetadataSource[],
): NanoExtensionKind {
  const categories = [
    channels.length > 0 ? "channel" : undefined,
    providers.length > 0 ? "provider" : undefined,
    skills.length > 0 ? "tool" : undefined,
  ].filter((value): value is Exclude<NanoExtensionKind, "support" | "hybrid"> => Boolean(value));

  if (categories.length > 1) return "hybrid";
  if (categories.length === 1) return categories[0]!;
  if (extensionId === "shared" || extensionId === "test-utils") return "support";
  return metadataSources.length > 0 ? "tool" : "support";
}

function hasPersistenceMetadata(
  nanosolanaManifest: Record<string, unknown> | null,
  openClawManifest: Record<string, unknown> | null,
): boolean {
  return asRecord(nanosolanaManifest?.["persistence"]) !== null || asRecord(openClawManifest?.["persistence"]) !== null;
}

function hasInstallMetadata(install: NanoExtensionInstallMetadata): boolean {
  return Boolean(install.npmSpec || install.localPath || install.defaultChoice);
}

function humanizeExtensionId(value: string): string {
  return value
    .replace(/^@nanosolana\//, "")
    .replace(/^@/, "")
    .split(/[\/_-]+/)
    .filter((part) => part.length > 0)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ");
}

function toRepoRelative(repoRoot: string, fullPath: string): string {
  const relativePath = resolve(fullPath).replace(`${resolve(repoRoot)}/`, "");
  return relativePath.length > 0 ? relativePath : basename(fullPath);
}

export function getExtensionCatalogSummary(
  snapshot: NanoExtensionCatalogSnapshot = scanNanoExtensions(),
): {
  directories: number;
  files: number;
  manifests: number;
  packageMetadata: number;
} {
  return {
    directories: snapshot.directories,
    files: snapshot.files,
    manifests: snapshot.manifests,
    packageMetadata: snapshot.packageMetadata,
  };
}
