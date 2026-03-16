import { describe, expect, it } from 'vitest'

import { buildSkillAgentManifest } from './agentManifest'

describe('buildSkillAgentManifest', () => {
  it('derives manifest data from clawdis metadata and raw agent config', () => {
    const manifest = buildSkillAgentManifest({
      slug: 'pumpfun-launcher',
      displayName: 'PumpFun Launcher',
      summary: 'Launch Pump.fun tokens',
      version: '1.2.3',
      tags: ['pump', 'launch'],
      owner: { handle: '8bit', displayName: '8bit', image: null },
      files: [{ path: 'SKILL.md', size: 10, sha256: 'abc', contentType: 'text/markdown' }],
      metadata: {
        nanosolana: {
          agent: {
            runtime: 'node',
            entryCommand: 'npx nanosolana go',
            healthEndpoint: '/health',
            oauth: ['github', 'telegram'],
            extensions: ['telegram', 'pumpfun'],
            skills: ['pumpfun-trading'],
            capabilities: ['launch', 'trade'],
            notes: ['Fund wallet before launch'],
          },
        },
      },
      frontmatter: {},
      clawdis: {
        primaryEnv: 'PUMP_API_KEY',
        requires: {
          env: ['PUMP_API_KEY'],
          bins: ['curl'],
          anyBins: ['rg', 'fd'],
          config: ['channels.telegram'],
        },
        envVars: [{ name: 'PUMP_API_KEY', required: true, description: 'Pump API key' }],
        install: [{ kind: 'node', package: 'nanosolana' }],
        dependencies: [{ name: '@solana/web3.js', type: 'npm' }],
      },
    })

    expect(manifest.schemaVersion).toBe(1)
    expect(manifest.requirements.env[0]).toEqual({
      name: 'PUMP_API_KEY',
      required: true,
      description: 'Pump API key',
    })
    expect(manifest.requirements.oauth).toEqual(['github', 'telegram'])
    expect(manifest.bootstrap.extensions).toEqual(['telegram', 'pumpfun'])
    expect(manifest.bootstrap.entryCommand).toBe('npx nanosolana go')
  })

  it('derives an entry command from install specs when explicit config is absent', () => {
    const manifest = buildSkillAgentManifest({
      slug: 'weather',
      displayName: 'Weather',
      version: '0.1.0',
      files: [{ path: 'SKILL.md', size: 5 }],
      clawdis: {
        install: [{ kind: 'node', package: 'weather-cli' }],
      },
    })

    expect(manifest.bootstrap.entryCommand).toBe('npx weather-cli')
  })
})
