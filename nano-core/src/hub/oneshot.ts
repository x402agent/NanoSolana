export interface ScgHubManifestFile {
  path: string;
  size: number;
  sha256?: string | null;
  contentType?: string | null;
}

export interface ScgHubManifestOwner {
  handle?: string | null;
  displayName?: string | null;
  image?: string | null;
}

export interface ScgHubManifestEnvVar {
  name: string;
  required?: boolean;
  description?: string | null;
}

export interface ScgHubManifestDependency {
  name?: string;
  kind?: string;
  package?: string;
  version?: string;
}

export interface ScgHubManifestInstallSpec {
  kind?: string;
  package?: string;
  version?: string;
  command?: string;
  formula?: string;
  bins?: string[];
}

export interface ScgHubSkillManifest {
  schemaVersion: number;
  kind: "skill";
  slug: string;
  displayName: string;
  summary?: string | null;
  version: string;
  owner?: ScgHubManifestOwner | null;
  tags?: string[];
  files?: ScgHubManifestFile[];
  install?: ScgHubManifestInstallSpec[];
  dependencies?: ScgHubManifestDependency[];
  nix?: {
    plugin?: string | null;
    systems?: string[];
  } | null;
  state?: {
    requiredEnv?: string[];
    stateDirs?: string[];
    example?: string | null;
  } | null;
  requirements?: {
    env?: ScgHubManifestEnvVar[];
    bins?: string[];
    anyBins?: string[];
    config?: string[];
    os?: string[];
    oauth?: string[];
    primaryEnv?: string | null;
  };
  bootstrap?: {
    runtime?: string | null;
    entryCommand?: string | null;
    healthEndpoint?: string | null;
    extensions?: string[];
    skills?: string[];
    oauth?: string[];
    capabilities?: string[];
    notes?: string[];
    setupUrl?: string | null;
  };
}

export interface ScgHubSkillManifestResponse {
  manifest: ScgHubSkillManifest;
}

export interface ScgOneShotStep {
  key: string;
  title: string;
  status: "ready" | "needs_input" | "optional";
  details: string;
  data?: Record<string, unknown>;
}

export interface ScgOneShotPlan {
  slug: string;
  displayName: string;
  version: string;
  summary: string | null;
  runtime: string | null;
  entryCommand: string | null;
  siteUrl?: string | null;
  setupUrl: string | null;
  healthEndpoint: string | null;
  readyToLaunch: boolean;
  missingEnv: string[];
  requiredOAuth: string[];
  extensions: string[];
  linkedSkills: string[];
  installPackages: string[];
  warnings: string[];
  steps: ScgOneShotStep[];
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

export function buildScgOneShotPlan(
  manifest: ScgHubSkillManifest,
  options: {
    env?: Record<string, string | undefined>;
    siteUrl?: string | null;
  } = {},
): ScgOneShotPlan {
  const env = options.env ?? process.env;
  const requiredEnv = (manifest.requirements?.env ?? [])
    .filter((item) => item.required !== false)
    .map((item) => item.name.trim())
    .filter(Boolean);
  const missingEnv = requiredEnv.filter((name) => !env[name]);
  const requiredOAuth = uniqueStrings([
    ...(manifest.requirements?.oauth ?? []),
    ...(manifest.bootstrap?.oauth ?? []),
  ]);
  const extensions = uniqueStrings(manifest.bootstrap?.extensions ?? []);
  const linkedSkills = uniqueStrings(manifest.bootstrap?.skills ?? []);
  const installPackages = uniqueStrings((manifest.install ?? []).map((item) => {
    if (item.package?.trim()) return item.package;
    if (item.formula?.trim()) return item.formula;
    if (item.command?.trim()) return item.command;
    return null;
  }));
  const runtime = manifest.bootstrap?.runtime?.trim() || null;
  const entryCommand = manifest.bootstrap?.entryCommand?.trim() || null;
  const healthEndpoint = manifest.bootstrap?.healthEndpoint?.trim() || null;
  const setupUrl = manifest.bootstrap?.setupUrl?.trim() || null;

  const warnings: string[] = [];
  if (!entryCommand) {
    warnings.push("No entry command declared in the ScgHub manifest.");
  }
  if (extensions.length === 0) {
    warnings.push("No extension graph declared for this skill.");
  }
  for (const note of manifest.bootstrap?.notes ?? []) {
    const trimmed = note.trim();
    if (trimmed) warnings.push(trimmed);
  }

  const steps: ScgOneShotStep[] = [
    {
      key: "resolve",
      title: "Resolve ScgHub bundle",
      status: "ready",
      details: `Resolved from ScgHub.`,
      data: {
        slug: manifest.slug,
        version: manifest.version,
        owner: manifest.owner?.handle ?? null,
      },
    },
    {
      key: "install",
      title: "Install runtime dependencies",
      status: installPackages.length > 0 ? "ready" : "optional",
      details: installPackages.length > 0
        ? `Install packages: ${installPackages.join(", ")}`
        : "No explicit install packages declared.",
      data: {
        install: manifest.install ?? [],
        dependencies: manifest.dependencies ?? [],
      },
    },
    {
      key: "configure",
      title: "Configure required secrets and env",
      status: missingEnv.length > 0 ? "needs_input" : "ready",
      details: missingEnv.length > 0
        ? `Missing env vars: ${missingEnv.join(", ")}`
        : requiredEnv.length > 0
          ? "Required env vars are already present."
          : "No required env vars declared.",
      data: {
        requiredEnv,
        missingEnv,
        primaryEnv: manifest.requirements?.primaryEnv ?? null,
      },
    },
    {
      key: "oauth",
      title: "Complete provider auth",
      status: requiredOAuth.length > 0 ? "needs_input" : "optional",
      details: requiredOAuth.length > 0
        ? `Complete OAuth setup for: ${requiredOAuth.join(", ")}`
        : "No OAuth providers declared.",
      data: {
        requiredOAuth,
        setupUrl,
      },
    },
    {
      key: "enable",
      title: "Enable linked extensions and skills",
      status: extensions.length > 0 || linkedSkills.length > 0 ? "ready" : "optional",
      details: extensions.length > 0 || linkedSkills.length > 0
        ? `Extensions: ${extensions.join(", ") || "none"}; linked skills: ${linkedSkills.join(", ") || "none"}`
        : "No linked extensions or dependent skills declared.",
      data: {
        extensions,
        linkedSkills,
      },
    },
    {
      key: "launch",
      title: "Launch agent runtime",
      status: entryCommand ? "ready" : "needs_input",
      details: entryCommand
        ? `Launch command: ${entryCommand}`
        : "Manifest does not yet expose a launch command.",
      data: {
        runtime,
        entryCommand,
        healthEndpoint,
      },
    },
  ];

  return {
    slug: manifest.slug,
    displayName: manifest.displayName,
    version: manifest.version,
    summary: manifest.summary ?? null,
    runtime,
    entryCommand,
    siteUrl: options.siteUrl ?? null,
    setupUrl,
    healthEndpoint,
    readyToLaunch: missingEnv.length === 0 && requiredOAuth.length === 0 && Boolean(entryCommand),
    missingEnv,
    requiredOAuth,
    extensions,
    linkedSkills,
    installPackages,
    warnings,
    steps,
  };
}
