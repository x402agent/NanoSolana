import type {
  ClawdisSkillMetadata,
  DependencyDeclaration,
  EnvVarDeclaration,
  NixPluginSpec,
  SkillInstallSpec,
  TamaGObotConfigSpec,
} from 'nanohub-schema'

type ManifestFile = {
  path: string
  size: number
  sha256?: string | null
  contentType?: string | null
}

type PublicOwner = {
  handle?: string | null
  displayName?: string | null
  image?: string | null
} | null

type AgentBootstrap = {
  runtime: string | null
  entryCommand: string | null
  healthEndpoint: string | null
  extensions: string[]
  skills: string[]
  oauth: string[]
  capabilities: string[]
  notes: string[]
  setupUrl: string | null
}

export interface SkillAgentManifest {
  schemaVersion: 1
  kind: 'skill'
  slug: string
  displayName: string
  summary: string | null
  version: string
  owner: {
    handle: string | null
    displayName: string | null
    image: string | null
  } | null
  tags: string[]
  files: ManifestFile[]
  install: SkillInstallSpec[]
  dependencies: DependencyDeclaration[]
  nix: NixPluginSpec | null
  state: TamaGObotConfigSpec | null
  requirements: {
    env: EnvVarDeclaration[]
    bins: string[]
    anyBins: string[]
    config: string[]
    os: string[]
    oauth: string[]
    primaryEnv: string | null
  }
  bootstrap: AgentBootstrap
}

function normalizeStringList(input: unknown) {
  if (Array.isArray(input)) {
    return input
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter(Boolean)
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  }
  return []
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

function toEnvDeclarations(params: {
  envVars?: EnvVarDeclaration[]
  requiredEnv?: string[]
  primaryEnv?: string | null
}) {
  const map = new Map<string, EnvVarDeclaration>()

  for (const entry of params.envVars ?? []) {
    const name = entry.name?.trim()
    if (!name) continue
    map.set(name, {
      name,
      required: entry.required ?? false,
      description: entry.description,
    })
  }

  for (const name of params.requiredEnv ?? []) {
    const current = map.get(name)
    map.set(name, {
      name,
      required: true,
      description: current?.description,
    })
  }

  const primary = params.primaryEnv?.trim()
  if (primary) {
    const current = map.get(primary)
    map.set(primary, {
      name: primary,
      required: current?.required ?? true,
      description: current?.description,
    })
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

function getAgentConfig(rawMetadata: unknown, rawFrontmatter: unknown) {
  const metadataRecord =
    rawMetadata && typeof rawMetadata === 'object' && !Array.isArray(rawMetadata)
      ? (rawMetadata as Record<string, unknown>)
      : null

  const frontmatterRecord =
    rawFrontmatter && typeof rawFrontmatter === 'object' && !Array.isArray(rawFrontmatter)
      ? (rawFrontmatter as Record<string, unknown>)
      : null

  const metadataNamespaces = metadataRecord
    ? [metadataRecord.nanosolana, metadataRecord.tamagobot, metadataRecord.clawdis]
    : []

  for (const namespace of metadataNamespaces) {
    if (namespace && typeof namespace === 'object' && !Array.isArray(namespace)) {
      const agent = (namespace as Record<string, unknown>).agent
      if (agent && typeof agent === 'object' && !Array.isArray(agent)) {
        return agent as Record<string, unknown>
      }
    }
  }

  const frontmatterAgent = frontmatterRecord?.agent
  if (frontmatterAgent && typeof frontmatterAgent === 'object' && !Array.isArray(frontmatterAgent)) {
    return frontmatterAgent as Record<string, unknown>
  }

  return null
}

function deriveEntryCommand(install: SkillInstallSpec[], agentConfig: Record<string, unknown> | null) {
  const explicit =
    (typeof agentConfig?.entryCommand === 'string' && agentConfig.entryCommand.trim()) ||
    (typeof agentConfig?.startCommand === 'string' && agentConfig.startCommand.trim()) ||
    (typeof agentConfig?.command === 'string' && agentConfig.command.trim())
  if (explicit) return explicit

  for (const spec of install) {
    if (spec.kind === 'node' && spec.package) {
      return `npx ${spec.package}`
    }
    if (spec.kind === 'uv' && spec.package) {
      return `uvx ${spec.package}`
    }
    if (spec.kind === 'go' && spec.package) {
      return `${spec.package}`
    }
    if (spec.bins && spec.bins.length > 0) {
      return spec.bins[0] ?? null
    }
    if (spec.kind === 'brew' && spec.formula) {
      return spec.formula
    }
  }

  return null
}

export function buildSkillAgentManifest(params: {
  slug: string
  displayName: string
  summary?: string | null
  version: string
  tags?: string[]
  owner?: PublicOwner
  files: ManifestFile[]
  metadata?: unknown
  frontmatter?: unknown
  clawdis?: ClawdisSkillMetadata | null
}): SkillAgentManifest {
  const clawdis = params.clawdis ?? undefined
  const agentConfig = getAgentConfig(params.metadata, params.frontmatter)

  const requiredEnv = uniqueStrings([
    ...(clawdis?.requires?.env ?? []),
    ...(clawdis?.config?.requiredEnv ?? []),
  ])

  const oauth = uniqueStrings(normalizeStringList(agentConfig?.oauth))
  const capabilities = uniqueStrings(normalizeStringList(agentConfig?.capabilities))
  const notes = uniqueStrings(normalizeStringList(agentConfig?.notes))
  const extensions = uniqueStrings(normalizeStringList(agentConfig?.extensions))
  const skills = uniqueStrings(normalizeStringList(agentConfig?.skills))
  const primaryEnv = clawdis?.primaryEnv?.trim() || null
  const env = toEnvDeclarations({
    envVars: clawdis?.envVars,
    requiredEnv,
    primaryEnv,
  })

  return {
    schemaVersion: 1,
    kind: 'skill',
    slug: params.slug,
    displayName: params.displayName,
    summary: params.summary ?? null,
    version: params.version,
    owner: params.owner
      ? {
          handle: params.owner.handle ?? null,
          displayName: params.owner.displayName ?? null,
          image: params.owner.image ?? null,
        }
      : null,
    tags: uniqueStrings(params.tags ?? []),
    files: params.files,
    install: clawdis?.install ?? [],
    dependencies: clawdis?.dependencies ?? [],
    nix: clawdis?.nix ?? null,
    state: clawdis?.config ?? null,
    requirements: {
      env,
      bins: uniqueStrings(clawdis?.requires?.bins ?? []),
      anyBins: uniqueStrings(clawdis?.requires?.anyBins ?? []),
      config: uniqueStrings(clawdis?.requires?.config ?? []),
      os: uniqueStrings(clawdis?.os ?? []),
      oauth,
      primaryEnv,
    },
    bootstrap: {
      runtime:
        (typeof agentConfig?.runtime === 'string' && agentConfig.runtime.trim()) ||
        (params.files.some((file) => file.path.endsWith('.py')) ? 'python' : null),
      entryCommand: deriveEntryCommand(clawdis?.install ?? [], agentConfig),
      healthEndpoint:
        (typeof agentConfig?.healthEndpoint === 'string' && agentConfig.healthEndpoint.trim()) ||
        null,
      extensions,
      skills,
      oauth,
      capabilities,
      notes,
      setupUrl:
        (typeof agentConfig?.setupUrl === 'string' && agentConfig.setupUrl.trim()) ||
        clawdis?.links?.documentation ||
        clawdis?.links?.homepage ||
        clawdis?.homepage ||
        null,
    },
  }
}
