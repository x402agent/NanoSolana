import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  PLATFORM_SKILL_LICENSE,
  PLATFORM_SKILL_LICENSE_NAME,
  PLATFORM_SKILL_LICENSE_SUMMARY,
} from 'nanohub-schema'
import { useAction, useMutation } from 'convex/react'
import { useCallback, useMemo, useRef, useState } from 'react'
import semver from 'semver'
import { api } from '../../../convex/_generated/api'
import { useAuthStatus } from '../../lib/useAuthStatus'
import { formatBytes, formatPublishError, hashFile, uploadFile } from '../upload/-utils'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const KNOWN_MODELS = [
  'clawd-sonnet-4-20250514',
  'clawd-opus-4-20250514',
  'clawd-haiku-4-20250514',
  'gpt-4o',
  'gpt-4o-mini',
  'o3',
  'o4-mini',
]

const KNOWN_TOOLS = [
  'Read',
  'Edit',
  'Write',
  'Bash',
  'Glob',
  'Grep',
  'WebFetch',
  'WebSearch',
  'TodoWrite',
  'NotebookEdit',
]

interface ResourceFile {
  id: string
  name: string
  content: string
}

export const Route = createFileRoute('/skills/create')({
  component: SkillCreator,
})

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function SkillCreator() {
  const { isAuthenticated, me } = useAuthStatus()
  const navigate = useNavigate()

  const generateUploadUrl = useMutation(api.uploads.generateUploadUrl)
  const publishVersion = useAction(api.skills.publishVersion)

  // -- Metadata fields --
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [version, setVersion] = useState('1.0.0')
  const [tags, setTags] = useState('latest')
  const [homepage, setHomepage] = useState('')

  // -- Frontmatter fields --
  const [allowedTools, setAllowedTools] = useState<string[]>([])
  const [model, setModel] = useState('')
  const [customToolInput, setCustomToolInput] = useState('')

  // -- Content --
  const [skillContent, setSkillContent] = useState('')

  // -- Resource files --
  const [resourceFiles, setResourceFiles] = useState<ResourceFile[]>([])
  const [newResourceName, setNewResourceName] = useState('')

  // -- UI state --
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [acceptedLicenseTerms, setAcceptedLicenseTerms] = useState(false)
  const [changelog, setChangelog] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasAttempted, setHasAttempted] = useState(false)
  const validationRef = useRef<HTMLDivElement | null>(null)

  const isSubmitting = status !== null

  // -- Derived --
  const trimmedSlug = slug.trim().toLowerCase()
  const trimmedName = name.trim()
  const trimmedDescription = description.trim()
  const trimmedChangelog = changelog.trim()

  const parsedTags = useMemo(
    () =>
      tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [tags],
  )

  // -- Auto-generate slug from name --
  const handleNameChange = useCallback(
    (value: string) => {
      setName(value)
      if (!slug || slug === nameToSlug(name)) {
        setSlug(nameToSlug(value))
      }
    },
    [name, slug],
  )

  // -- Build SKILL.md frontmatter --
  const buildFrontmatter = useCallback(() => {
    const lines: string[] = ['---']

    if (trimmedName) lines.push(`name: ${trimmedName}`)
    if (trimmedDescription) lines.push(`description: "${trimmedDescription.replace(/"/g, '\\"')}"`)
    if (homepage.trim()) lines.push(`homepage: ${homepage.trim()}`)

    if (allowedTools.length > 0) {
      lines.push(`allowed-tools:`)
      for (const tool of allowedTools) {
        lines.push(`  - ${tool}`)
      }
    }

    if (model) {
      lines.push(`model: ${model}`)
    }

    lines.push('---')
    return lines.join('\n')
  }, [trimmedName, trimmedDescription, homepage, allowedTools, model])

  // -- Build full SKILL.md --
  const buildSkillMd = useCallback(() => {
    const frontmatter = buildFrontmatter()
    const content = skillContent.trim()
    return `${frontmatter}\n\n${content}\n`
  }, [buildFrontmatter, skillContent])

  // -- Validation (mirrors quick_validate.py logic) --
  const validation = useMemo(() => {
    const issues: string[] = []

    if (!trimmedName) {
      issues.push('Skill name is required.')
    }

    if (!trimmedSlug) {
      issues.push('Slug is required.')
    } else if (!SLUG_PATTERN.test(trimmedSlug)) {
      issues.push('Slug must be lowercase alphanumeric with dashes only (e.g. my-skill).')
    }

    if (!trimmedDescription) {
      issues.push('Description is required.')
    } else if (trimmedDescription.length < 10) {
      issues.push('Description should be at least 10 characters.')
    } else if (trimmedDescription.length > 500) {
      issues.push('Description should be under 500 characters.')
    }

    if (!semver.valid(version)) {
      issues.push('Version must be valid semver (e.g. 1.0.0).')
    }

    if (parsedTags.length === 0) {
      issues.push('At least one tag is required.')
    }

    if (!skillContent.trim()) {
      issues.push('Skill content/prompt is required.')
    }

    if (!acceptedLicenseTerms) {
      issues.push('Accept the MIT-0 license terms to publish.')
    }

    // Validate allowed-tools entries
    for (const tool of allowedTools) {
      if (!tool.trim()) {
        issues.push('Empty tool name in allowed-tools.')
      }
    }

    // Validate resource file names
    const resourceNames = new Set<string>()
    for (const rf of resourceFiles) {
      if (!rf.name.trim()) {
        issues.push('Resource file name cannot be empty.')
      } else if (rf.name.toLowerCase() === 'skill.md') {
        issues.push('Resource file cannot be named SKILL.md (it is auto-generated).')
      } else if (resourceNames.has(rf.name.toLowerCase())) {
        issues.push(`Duplicate resource file name: ${rf.name}`)
      }
      resourceNames.add(rf.name.toLowerCase())
    }

    return { issues, ready: issues.length === 0 }
  }, [
    trimmedName,
    trimmedSlug,
    trimmedDescription,
    version,
    parsedTags.length,
    skillContent,
    acceptedLicenseTerms,
    allowedTools,
    resourceFiles,
  ])

  // -- Download as zip --
  const handleDownload = useCallback(async () => {
    const { default: JSZip } = await import('jszip')
    const zip = new JSZip()
    zip.file('SKILL.md', buildSkillMd())

    for (const rf of resourceFiles) {
      if (rf.name.trim() && rf.content) {
        zip.file(rf.name.trim(), rf.content)
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${trimmedSlug || 'skill'}.zip`
    a.click()
    URL.revokeObjectURL(url)
  }, [buildSkillMd, resourceFiles, trimmedSlug])

  // -- Publish --
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setHasAttempted(true)

    if (!validation.ready) {
      validationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setError(null)
    setStatus('Preparing files...')

    try {
      const skillMdContent = buildSkillMd()
      const skillMdBlob = new Blob([skillMdContent], { type: 'text/markdown' })
      const skillMdFile = new File([skillMdBlob], 'SKILL.md', { type: 'text/markdown' })

      const allFiles: Array<{ file: File; path: string }> = [
        { file: skillMdFile, path: 'SKILL.md' },
      ]

      for (const rf of resourceFiles) {
        if (rf.name.trim() && rf.content) {
          const blob = new Blob([rf.content], { type: 'text/plain' })
          const file = new File([blob], rf.name.trim(), { type: 'text/plain' })
          allFiles.push({ file, path: rf.name.trim() })
        }
      }

      setStatus('Uploading files...')
      const uploaded: Array<{
        path: string
        size: number
        storageId: string
        sha256: string
        contentType?: string
      }> = []

      for (const { file, path } of allFiles) {
        const uploadUrl = await generateUploadUrl()
        const sha256 = await hashFile(file)
        const storageId = await uploadFile(uploadUrl, file)
        uploaded.push({
          path,
          size: file.size,
          storageId,
          sha256,
          contentType: file.type || undefined,
        })
      }

      setStatus('Publishing...')
      const result = await publishVersion({
        slug: trimmedSlug,
        displayName: trimmedName,
        version,
        changelog: trimmedChangelog,
        acceptLicenseTerms: acceptedLicenseTerms,
        tags: parsedTags,
        files: uploaded,
      })

      setStatus(null)
      setError(null)
      setHasAttempted(false)

      if (result) {
        const ownerParam = me?.handle ?? (me?._id ? String(me._id) : 'unknown')
        void navigate({
          to: '/$owner/$slug',
          params: { owner: ownerParam, slug: trimmedSlug },
        })
      }
    } catch (err) {
      setStatus(null)
      setError(formatPublishError(err))
    }
  }

  // -- Add tool --
  const addTool = useCallback(
    (tool: string) => {
      const t = tool.trim()
      if (t && !allowedTools.includes(t)) {
        setAllowedTools((prev) => [...prev, t])
      }
    },
    [allowedTools],
  )

  const removeTool = useCallback((tool: string) => {
    setAllowedTools((prev) => prev.filter((t) => t !== tool))
  }, [])

  // -- Resource file management --
  const addResourceFile = useCallback(() => {
    const trimmed = newResourceName.trim()
    if (!trimmed) return
    setResourceFiles((prev) => [...prev, { id: generateId(), name: trimmed, content: '' }])
    setNewResourceName('')
  }, [newResourceName])

  const removeResourceFile = useCallback((id: string) => {
    setResourceFiles((prev) => prev.filter((rf) => rf.id !== id))
  }, [])

  const updateResourceContent = useCallback((id: string, content: string) => {
    setResourceFiles((prev) => prev.map((rf) => (rf.id === id ? { ...rf, content } : rf)))
  }, [])

  const updateResourceName = useCallback((id: string, newName: string) => {
    setResourceFiles((prev) => prev.map((rf) => (rf.id === id ? { ...rf, name: newName } : rf)))
  }, [])

  // -- Total size estimate --
  const totalSize = useMemo(() => {
    let bytes = new Blob([buildSkillMd()]).size
    for (const rf of resourceFiles) {
      bytes += new Blob([rf.content]).size
    }
    return bytes
  }, [buildSkillMd, resourceFiles])

  if (!isAuthenticated) {
    return (
      <main className="section">
        <div className="card">Sign in to create a skill.</div>
      </main>
    )
  }

  return (
    <main className="section upload-page">
      <header className="upload-page-header">
        <div>
          <h1 className="upload-page-title">Create a Skill</h1>
          <p className="upload-page-subtitle">
            Build a SKILL.md from scratch with live validation and preview.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="upload-grid">
        {/* -- Metadata Panel -- */}
        <div className="card upload-panel">
          <h2 className="upload-panel-title">Skill Metadata</h2>

          <label className="form-label" htmlFor="sc-name">
            Name
          </label>
          <input
            className="form-input"
            id="sc-name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="My Awesome Skill"
          />

          <label className="form-label" htmlFor="sc-slug">
            Slug
          </label>
          <input
            className="form-input"
            id="sc-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-awesome-skill"
          />
          {trimmedSlug && !SLUG_PATTERN.test(trimmedSlug) && (
            <div className="stat" style={{ color: 'var(--color-warning, #e6a700)' }}>
              Slug must be lowercase alphanumeric with dashes only.
            </div>
          )}

          <label className="form-label" htmlFor="sc-description">
            Description
          </label>
          <textarea
            className="form-input"
            id="sc-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A concise description of what this skill does..."
          />
          <div className="stat">{trimmedDescription.length}/500 characters</div>

          <label className="form-label" htmlFor="sc-homepage">
            Homepage URL (optional)
          </label>
          <input
            className="form-input"
            id="sc-homepage"
            value={homepage}
            onChange={(e) => setHomepage(e.target.value)}
            placeholder="https://github.com/..."
          />

          <label className="form-label" htmlFor="sc-version">
            Version
          </label>
          <input
            className="form-input"
            id="sc-version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.0.0"
          />

          <label className="form-label" htmlFor="sc-tags">
            Tags
          </label>
          <input
            className="form-input"
            id="sc-tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="latest, stable"
          />
        </div>

        {/* -- Frontmatter Configuration -- */}
        <div className="card upload-panel">
          <h2 className="upload-panel-title">Frontmatter Configuration</h2>

          <label className="form-label">Model (optional)</label>
          <select
            className="form-input"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="">Default (no preference)</option>
            {KNOWN_MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <label className="form-label" style={{ marginTop: '1rem' }}>
            Allowed Tools
          </label>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '0.75rem',
            }}
          >
            {KNOWN_TOOLS.map((tool) => {
              const isSelected = allowedTools.includes(tool)
              return (
                <button
                  key={tool}
                  type="button"
                  className={`btn ${isSelected ? 'btn-primary' : ''}`}
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.3rem 0.6rem',
                  }}
                  onClick={() => (isSelected ? removeTool(tool) : addTool(tool))}
                >
                  {tool}
                  {isSelected ? ' x' : ''}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="form-input"
              value={customToolInput}
              onChange={(e) => setCustomToolInput(e.target.value)}
              placeholder="Custom tool name..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTool(customToolInput)
                  setCustomToolInput('')
                }
              }}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn"
              onClick={() => {
                addTool(customToolInput)
                setCustomToolInput('')
              }}
            >
              Add
            </button>
          </div>

          {allowedTools.length > 0 && (
            <div className="stat" style={{ marginTop: '0.5rem' }}>
              {allowedTools.length} tool{allowedTools.length !== 1 ? 's' : ''} selected:{' '}
              {allowedTools.join(', ')}
            </div>
          )}
        </div>

        {/* -- Skill Content Editor -- */}
        <div className="card upload-panel">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
            }}
          >
            <h2 className="upload-panel-title" style={{ margin: 0 }}>
              Skill Content
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn ${activeTab === 'edit' ? 'btn-primary' : ''}`}
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                onClick={() => setActiveTab('edit')}
              >
                Edit
              </button>
              <button
                type="button"
                className={`btn ${activeTab === 'preview' ? 'btn-primary' : ''}`}
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                onClick={() => setActiveTab('preview')}
              >
                Preview
              </button>
            </div>
          </div>

          {activeTab === 'edit' ? (
            <>
              <label className="form-label" htmlFor="sc-content">
                Markdown content (below the frontmatter)
              </label>
              <textarea
                className="form-input"
                id="sc-content"
                rows={16}
                value={skillContent}
                onChange={(e) => setSkillContent(e.target.value)}
                placeholder={`# My Skill\n\nDescribe what this skill does and how to use it.\n\n## Quick start\n\n\`\`\`bash\nmy-tool --help\n\`\`\`\n\n## Tips\n\n- Tip one\n- Tip two`}
                style={{ fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.5' }}
              />
            </>
          ) : (
            <div
              style={{
                background: 'var(--color-surface-alt, #1a1a2e)',
                borderRadius: '0.5rem',
                padding: '1rem',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                overflowX: 'auto',
                maxHeight: '500px',
                overflowY: 'auto',
                border: '1px solid var(--color-border, #333)',
              }}
            >
              {buildSkillMd()}
            </div>
          )}

          <div className="stat" style={{ marginTop: '0.5rem' }}>
            Estimated size: {formatBytes(totalSize)} -- {resourceFiles.length + 1} file
            {resourceFiles.length !== 0 ? 's' : ''}
          </div>
        </div>

        {/* -- Resource Files -- */}
        <div className="card upload-panel">
          <h2 className="upload-panel-title">Resource Files</h2>
          <p className="stat" style={{ marginBottom: '0.75rem' }}>
            Add reference files, configuration templates, or documentation that ship with your
            skill.
          </p>

          {resourceFiles.map((rf) => (
            <div
              key={rf.id}
              style={{
                marginBottom: '1rem',
                border: '1px solid var(--color-border, #333)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <input
                  className="form-input"
                  value={rf.name}
                  onChange={(e) => updateResourceName(rf.id, e.target.value)}
                  placeholder="filename.md"
                  style={{ flex: 1, margin: 0 }}
                />
                <button
                  type="button"
                  className="btn"
                  onClick={() => removeResourceFile(rf.id)}
                  style={{ color: 'var(--color-danger, #e53e3e)', whiteSpace: 'nowrap' }}
                >
                  Remove
                </button>
              </div>
              <textarea
                className="form-input"
                rows={6}
                value={rf.content}
                onChange={(e) => updateResourceContent(rf.id, e.target.value)}
                placeholder="File content..."
                style={{ fontFamily: 'monospace', fontSize: '0.8rem', marginTop: 0 }}
              />
            </div>
          ))}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="form-input"
              value={newResourceName}
              onChange={(e) => setNewResourceName(e.target.value)}
              placeholder="references/config-example.md"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addResourceFile()
                }
              }}
              style={{ flex: 1 }}
            />
            <button type="button" className="btn" onClick={addResourceFile}>
              Add File
            </button>
          </div>
        </div>

        {/* -- Validation -- */}
        <div className="card upload-panel" ref={validationRef}>
          <h2 className="upload-panel-title">Validation</h2>
          {validation.issues.length === 0 ? (
            <div className="stat" style={{ color: 'var(--color-success, #38a169)' }}>
              All checks passed. Ready to publish or download.
            </div>
          ) : (
            <ul className="validation-list">
              {validation.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}
        </div>

        {/* -- License & Changelog -- */}
        <div className="card upload-panel">
          <h2 className="upload-panel-title">License</h2>
          <div
            style={{
              background: 'var(--color-surface-alt, #1a1a2e)',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1rem',
              border: '1px solid var(--color-border, #333)',
            }}
          >
            <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
              {PLATFORM_SKILL_LICENSE} -- {PLATFORM_SKILL_LICENSE_NAME}
            </div>
            <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: '0 0 0.75rem' }}>
              All skills published on NanoClawd Hub are licensed under {PLATFORM_SKILL_LICENSE}.{' '}
              {PLATFORM_SKILL_LICENSE_SUMMARY}
            </p>
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={acceptedLicenseTerms}
                onChange={(e) => setAcceptedLicenseTerms(e.target.checked)}
                style={{ marginTop: '0.2rem' }}
              />
              <span>
                I have the rights to this skill and agree to publish it under{' '}
                {PLATFORM_SKILL_LICENSE}.
              </span>
            </label>
          </div>

          <label className="form-label" htmlFor="sc-changelog">
            Changelog
          </label>
          <textarea
            className="form-input"
            id="sc-changelog"
            rows={4}
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
            placeholder="Describe what changed in this version..."
          />
        </div>

        {/* -- Actions -- */}
        <div className="upload-submit-row">
          <div className="upload-submit-notes">
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            {status && <div className="stat">{status}</div>}
            {hasAttempted && !validation.ready && (
              <div className="stat">Fix validation issues to continue.</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn"
              onClick={handleDownload}
              disabled={!skillContent.trim() || !trimmedSlug}
            >
              Download ZIP
            </button>
            <button
              className="btn btn-primary upload-submit-btn"
              type="submit"
              disabled={!validation.ready || isSubmitting}
            >
              Publish Skill
            </button>
          </div>
        </div>
      </form>
    </main>
  )
}

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
