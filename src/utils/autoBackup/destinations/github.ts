/**
 * GitHub gist/repo destination.
 *
 * Repos: commits to `backups/<component>/bjj-dojo-backup-<component>-<ts>.json`.
 * Legacy flat files at `backups/*.json` are still read for restore but never
 * written. Gists: rewrites the single `bjj-dojo-backup.json` file in place.
 *
 * The PAT lives in localStorage. Document scopes in the UI helper text:
 *   - Repo: fine-grained PAT with Contents: Read and write on the chosen repo
 *   - Gist: classic PAT with `gist` scope
 *
 * SHA conflict handling: `repoWrite()` runs a small retry loop (up to 3
 * attempts) when the PUT returns 409 / 422-with-sha, re-fetching the SHA each
 * time. After that, the orchestrator persists the failed write to the retry
 * queue so it gets replayed on the next mutation.
 */
import type { DatabaseBackup } from '../../../db/database'
import type {
  BackupDestination,
  BackupResult,
  DiscoveredBackup,
} from '../types'
import {
  getBackupRetentionCount,
  getGithubTarget,
  getGithubToken,
  isGithubBackupEnabled,
} from '../settings'
import {
  BACKUP_SUBDIR_FOR_COMPONENT,
  backupSubdirForComponent,
  isRecognizedBackupFilename,
  parseBackupComponentFromFilename,
} from '../files'

const API_BASE = 'https://api.github.com'
const GIST_FILENAME = 'bjj-dojo-backup.json'
const REPO_BACKUPS_DIR = 'backups'
const BACKUP_JSON_INDENT = 2
const SHA_RETRY_DELAYS_MS = [150, 450]
let writeQueue: Promise<void> = Promise.resolve()

function serializeBackup(payload: DatabaseBackup): string {
  return `${JSON.stringify(payload, null, BACKUP_JSON_INDENT)}\n`
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function ghError(res: Response, fallback: string): Promise<never> {
  let detail = ''
  try {
    const body = (await res.json()) as { message?: string }
    if (body?.message) detail = `: ${body.message}`
  } catch {
    // ignore
  }
  if (res.status === 401)
    throw new Error(`GitHub authentication failed${detail}`)
  if (res.status === 403) throw new Error(`GitHub permission denied${detail}`)
  if (res.status === 404) throw new Error(`GitHub target not found${detail}`)
  throw new Error(`${fallback} (${res.status})${detail}`)
}

interface ParsedGhError {
  status: number
  message: string
}

async function parseGhErrorBody(res: Response): Promise<ParsedGhError> {
  let message = ''
  try {
    const body = (await res.json()) as { message?: string }
    if (body?.message) message = body.message
  } catch {
    // ignore
  }
  return { status: res.status, message }
}

function isShaConflict(err: ParsedGhError): boolean {
  if (err.status === 409) return true
  if (err.status === 422) {
    const m = err.message.toLowerCase()
    return m.includes('sha') || m.includes('does not match')
  }
  return false
}

function shaErrorMessage(fallback: string, err: ParsedGhError): string {
  const detail = err.message ? `: ${err.message}` : ''
  return `${fallback} (${err.status})${detail}`
}

export async function verifyGithubToken(
  token: string,
): Promise<{ login: string }> {
  const res = await fetch(`${API_BASE}/user`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await ghError(res, 'GitHub /user request failed')
  return (await res.json()) as { login: string }
}

export interface GithubRepoSummary {
  owner: string
  name: string
  fullName: string
  private: boolean
  defaultBranch: string
}

/**
 * Lists repos the user has push access to. Paginates the user's affiliated
 * repos until exhausted (capped at 5 pages = 500 repos to keep memory bounded).
 */
export async function listWritableRepos(
  token: string,
): Promise<GithubRepoSummary[]> {
  const results: GithubRepoSummary[] = []
  const MAX_PAGES = 5
  const PER_PAGE = 100
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${API_BASE}/user/repos?per_page=${PER_PAGE}&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`
    const res = await fetch(url, { headers: authHeaders(token) })
    if (!res.ok) await ghError(res, 'GitHub repo list failed')
    const body = (await res.json()) as Array<{
      name: string
      full_name: string
      private: boolean
      default_branch: string
      owner: { login: string }
      permissions?: { push?: boolean }
    }>
    for (const r of body) {
      if (r.permissions?.push !== false) {
        results.push({
          owner: r.owner.login,
          name: r.name,
          fullName: r.full_name,
          private: r.private,
          defaultBranch: r.default_branch,
        })
      }
    }
    if (body.length < PER_PAGE) break
  }
  return results
}

export interface CreateRepoOptions {
  name: string
  private: boolean
  description?: string
}

export async function createBackupRepo(
  token: string,
  options: CreateRepoOptions,
): Promise<GithubRepoSummary> {
  const res = await fetch(`${API_BASE}/user/repos`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: options.name,
      description: options.description,
      private: options.private,
      auto_init: true,
    }),
  })
  if (!res.ok) await ghError(res, 'GitHub repo creation failed')
  const body = (await res.json()) as {
    name: string
    full_name: string
    private: boolean
    default_branch: string
    owner: { login: string }
  }
  return {
    owner: body.owner.login,
    name: body.name,
    fullName: body.full_name,
    private: body.private,
    defaultBranch: body.default_branch,
  }
}

async function gistWrite(
  token: string,
  gistId: string,
  filename: string,
  payload: DatabaseBackup,
): Promise<BackupResult> {
  const content = serializeBackup(payload)
  const body = JSON.stringify({
    files: { [filename]: { content } },
  })
  const res = await fetch(`${API_BASE}/gists/${gistId}`, {
    method: 'PATCH',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body,
  })
  if (!res.ok) await ghError(res, 'GitHub gist write failed')
  return { filename, bytesWritten: content.length }
}

async function repoGetFileSha(
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch?: string,
): Promise<string | undefined> {
  const url = `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}${
    branch ? `?ref=${encodeURIComponent(branch)}` : ''
  }`
  const res = await fetch(url, { headers: authHeaders(token) })
  if (res.status === 404) return undefined
  if (!res.ok) await ghError(res, 'GitHub repo lookup failed')
  const body = (await res.json()) as { sha?: string }
  return body.sha
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function repoWrite(
  token: string,
  owner: string,
  repo: string,
  filename: string,
  payload: DatabaseBackup,
  branch?: string,
): Promise<BackupResult> {
  const component = parseBackupComponentFromFilename(filename)
  const subdir = component ? backupSubdirForComponent(component) : null
  const path = subdir
    ? `${REPO_BACKUPS_DIR}/${subdir}/${filename}`
    : `${REPO_BACKUPS_DIR}/${filename}`
  const content = serializeBackup(payload)
  const encodedContent = btoa(unescape(encodeURIComponent(content)))

  const maxAttempts = SHA_RETRY_DELAYS_MS.length + 1
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const sha = await repoGetFileSha(token, owner, repo, path, branch)
    const body = JSON.stringify({
      message: `auto-backup: ${filename}`,
      content: encodedContent,
      ...(sha ? { sha } : {}),
      ...(branch ? { branch } : {}),
    })
    const res = await fetch(
      `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
      {
        method: 'PUT',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body,
      },
    )
    if (res.ok) {
      await repoRotateOldBackups(token, owner, repo, path, branch)
      return { filename: path, bytesWritten: content.length }
    }
    const parsed = await parseGhErrorBody(res)
    if (isShaConflict(parsed) && attempt < maxAttempts - 1) {
      await delay(SHA_RETRY_DELAYS_MS[attempt])
      continue
    }
    throw new Error(shaErrorMessage('GitHub repo write failed', parsed))
  }
  // Unreachable — loop either returns or throws — but keep TS happy.
  throw new Error('GitHub repo write failed')
}

/**
 * Keep the N most recent dated backups in the just-written file's directory.
 * The date lives in the filename, so a descending name sort is equivalent to
 * mtime sort and avoids an extra commit lookup per file. Per-file deletes are
 * best-effort.
 */
async function repoRotateOldBackups(
  token: string,
  owner: string,
  repo: string,
  justWrittenPath: string,
  branch?: string,
): Promise<void> {
  const keep = getBackupRetentionCount()
  const writtenComponent = parseBackupComponentFromFilename(
    justWrittenPath.split('/').pop() ?? '',
  )
  // Rotate inside the directory the file was just written to (either the
  // per-component subdir or the legacy flat `backups/` dir).
  const dirPath = justWrittenPath.slice(0, justWrittenPath.lastIndexOf('/'))
  const dirUrl = `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURI(dirPath)}${
    branch ? `?ref=${encodeURIComponent(branch)}` : ''
  }`
  const res = await fetch(dirUrl, { headers: authHeaders(token) })
  if (!res.ok) return
  const entries = (await res.json()) as Array<{
    name: string
    type: string
    path: string
    sha: string
  }>
  const dated = entries
    .filter((e) => e.type === 'file' && isRecognizedBackupFilename(e.name))
    .filter((e) => e.path !== justWrittenPath)
    .filter((e) => {
      if (!writtenComponent) return true
      return parseBackupComponentFromFilename(e.name) === writtenComponent
    })
    .sort((a, b) => (a.name < b.name ? 1 : -1))
  const toDelete = dated.slice(Math.max(0, keep - 1))
  for (const entry of toDelete) {
    try {
      const body = JSON.stringify({
        message: `auto-backup: prune ${entry.name}`,
        sha: entry.sha,
        ...(branch ? { branch } : {}),
      })
      await fetch(
        `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(entry.path)}`,
        {
          method: 'DELETE',
          headers: {
            ...authHeaders(token),
            'Content-Type': 'application/json',
          },
          body,
        },
      )
    } catch {
      // best effort — one failure must not abort the run
    }
  }
}

async function repoListSubdir(
  token: string,
  owner: string,
  repo: string,
  subdirPath: string,
  branch?: string,
): Promise<DiscoveredBackup[]> {
  const url = `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURI(subdirPath)}${
    branch ? `?ref=${encodeURIComponent(branch)}` : ''
  }`
  const res = await fetch(url, { headers: authHeaders(token) })
  if (!res.ok) return []
  const entries = (await res.json()) as Array<{
    name: string
    type: string
    path: string
  }>
  return entries
    .filter((e) => e.type === 'file' && isRecognizedBackupFilename(e.name))
    .map((e) => ({
      id: e.path,
      filename: e.name,
      label: e.path,
    }))
}

async function repoListBackups(
  token: string,
  owner: string,
  repo: string,
  branch?: string,
): Promise<DiscoveredBackup[]> {
  // Aggregate per-component subdirs + the legacy flat `backups/` dir.
  const collected: DiscoveredBackup[] = []
  for (const subdir of Object.values(BACKUP_SUBDIR_FOR_COMPONENT)) {
    collected.push(
      ...(await repoListSubdir(
        token,
        owner,
        repo,
        `${REPO_BACKUPS_DIR}/${subdir}`,
        branch,
      )),
    )
  }
  collected.push(
    ...(await repoListSubdir(token, owner, repo, REPO_BACKUPS_DIR, branch)),
  )
  if (collected.length > 0) {
    return collected.sort((a, b) => (a.filename < b.filename ? 1 : -1))
  }
  // Fallback: single root-level file (oldest layout, predates `backups/`).
  const rootRes = await fetch(
    `${API_BASE}/repos/${owner}/${repo}/contents/${GIST_FILENAME}${
      branch ? `?ref=${encodeURIComponent(branch)}` : ''
    }`,
    { headers: authHeaders(token) },
  )
  if (!rootRes.ok) return []
  const body = (await rootRes.json()) as { name?: string; path?: string }
  if (!body.path) return []
  return [
    {
      id: body.path,
      filename: body.name ?? GIST_FILENAME,
      label: body.name ?? GIST_FILENAME,
    },
  ]
}

async function gistList(
  token: string,
  gistId: string,
): Promise<DiscoveredBackup[]> {
  const res = await fetch(`${API_BASE}/gists/${gistId}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) {
    if (res.status === 404) return []
    await ghError(res, 'GitHub gist lookup failed')
  }
  const body = (await res.json()) as {
    files?: Record<string, { content?: string; raw_url?: string }>
    updated_at?: string
  }
  const modifiedAt = body.updated_at ? Date.parse(body.updated_at) : undefined
  return Object.keys(body.files ?? {})
    .filter((name) => isRecognizedBackupFilename(name))
    .map((name) => ({
      id: name,
      filename: name,
      label: name,
      modifiedAt,
    }))
    .sort((a, b) => (a.filename < b.filename ? 1 : -1))
}

async function gistRead(
  token: string,
  gistId: string,
  filename: string,
): Promise<DatabaseBackup> {
  const res = await fetch(`${API_BASE}/gists/${gistId}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await ghError(res, 'GitHub gist read failed')
  const body = (await res.json()) as {
    files?: Record<string, { content?: string }>
  }
  const content = body.files?.[filename]?.content
  if (!content) throw new Error('Backup file not found in gist.')
  return JSON.parse(content) as DatabaseBackup
}

async function repoRead(
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch?: string,
): Promise<DatabaseBackup> {
  const url = `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURI(path)}${
    branch ? `?ref=${encodeURIComponent(branch)}` : ''
  }`
  const res = await fetch(url, {
    headers: { ...authHeaders(token), Accept: 'application/vnd.github.raw' },
  })
  if (!res.ok) await ghError(res, 'GitHub repo read failed')
  const text = await res.text()
  return JSON.parse(text) as DatabaseBackup
}

export const githubDestination: BackupDestination = {
  id: 'github',

  isEnabled() {
    if (!isGithubBackupEnabled()) return false
    return Boolean(getGithubToken()) && Boolean(getGithubTarget())
  },

  async write(payload, filename) {
    const token = getGithubToken()
    const target = getGithubTarget()
    if (!token) throw new Error('GitHub token missing.')
    if (!target) throw new Error('GitHub target missing.')
    const run = async () => {
      if (target.kind === 'gist') {
        return await gistWrite(token, target.gistId, filename, payload)
      }
      return await repoWrite(
        token,
        target.owner,
        target.repo,
        filename,
        payload,
        target.branch,
      )
    }
    const queued = writeQueue.then(run, run)
    writeQueue = queued.then(
      () => undefined,
      () => undefined,
    )
    return await queued
  },

  async discoverExistingBackups() {
    const token = getGithubToken()
    const target = getGithubTarget()
    if (!token || !target) return []
    if (target.kind === 'gist') return await gistList(token, target.gistId)
    return await repoListBackups(
      token,
      target.owner,
      target.repo,
      target.branch,
    )
  },

  async readBackup(id: string) {
    const token = getGithubToken()
    const target = getGithubTarget()
    if (!token) throw new Error('GitHub token missing.')
    if (!target) throw new Error('GitHub target missing.')
    if (target.kind === 'gist') return await gistRead(token, target.gistId, id)
    return await repoRead(token, target.owner, target.repo, id, target.branch)
  },
}
