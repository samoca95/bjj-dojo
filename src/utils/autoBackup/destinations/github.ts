/**
 * GitHub gist/repo destination.
 *
 * Repos: commits to `backups/bjj-dojo-backup-YYYY-MM-DD.json` (or a single
 * file at the root if it already exists). Gists: rewrites the single
 * `bjj-dojo-backup.json` file in place.
 *
 * The PAT lives in localStorage. Document scopes in the UI helper text:
 *   - Repo: fine-grained PAT with Contents: Read and write on the chosen repo
 *   - Gist: classic PAT with `gist` scope
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

const API_BASE = 'https://api.github.com'
const GIST_FILENAME = 'bjj-dojo-backup.json'
const REPO_BACKUPS_DIR = 'backups'

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

export async function verifyGithubToken(
  token: string,
): Promise<{ login: string }> {
  const res = await fetch(`${API_BASE}/user`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await ghError(res, 'GitHub /user request failed')
  return (await res.json()) as { login: string }
}

async function gistWrite(
  token: string,
  gistId: string,
  payload: DatabaseBackup,
): Promise<BackupResult> {
  const body = JSON.stringify({
    files: { [GIST_FILENAME]: { content: JSON.stringify(payload) } },
  })
  const res = await fetch(`${API_BASE}/gists/${gistId}`, {
    method: 'PATCH',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body,
  })
  if (!res.ok) await ghError(res, 'GitHub gist write failed')
  return { filename: GIST_FILENAME, bytesWritten: body.length }
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

async function repoWrite(
  token: string,
  owner: string,
  repo: string,
  filename: string,
  payload: DatabaseBackup,
  branch?: string,
): Promise<BackupResult> {
  const path = `${REPO_BACKUPS_DIR}/${filename}`
  const sha = await repoGetFileSha(token, owner, repo, path, branch)
  const content = JSON.stringify(payload)
  const body = JSON.stringify({
    message: `auto-backup: ${filename}`,
    content: btoa(unescape(encodeURIComponent(content))),
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
  if (!res.ok) await ghError(res, 'GitHub repo write failed')
  await repoRotateOldBackups(token, owner, repo, path, branch)
  return { filename: path, bytesWritten: content.length }
}

const DATED_BACKUP_PATTERN = /^bjj-dojo-backup-\d{4}-\d{2}-\d{2}\.json$/

/**
 * Keep the N most recent dated backups in the repo's backups/ dir. The date
 * lives in the filename, so a descending name sort is equivalent to mtime sort
 * and avoids an extra commit lookup per file. Per-file deletes are best-effort.
 */
async function repoRotateOldBackups(
  token: string,
  owner: string,
  repo: string,
  justWrittenPath: string,
  branch?: string,
): Promise<void> {
  const keep = getBackupRetentionCount()
  const dirUrl = `${API_BASE}/repos/${owner}/${repo}/contents/${REPO_BACKUPS_DIR}${
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
    .filter((e) => e.type === 'file' && DATED_BACKUP_PATTERN.test(e.name))
    .filter((e) => e.path !== justWrittenPath)
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

async function repoListBackups(
  token: string,
  owner: string,
  repo: string,
  branch?: string,
): Promise<DiscoveredBackup[]> {
  // Try the conventional `backups/` directory first.
  const dirUrl = `${API_BASE}/repos/${owner}/${repo}/contents/${REPO_BACKUPS_DIR}${
    branch ? `?ref=${encodeURIComponent(branch)}` : ''
  }`
  const dirRes = await fetch(dirUrl, { headers: authHeaders(token) })
  if (dirRes.ok) {
    const entries = (await dirRes.json()) as Array<{
      name: string
      type: string
      path: string
    }>
    return entries
      .filter(
        (e) =>
          e.type === 'file' &&
          /^bjj-dojo-backup(?:-\d{4}-\d{2}-\d{2})?\.json$/.test(e.name),
      )
      .map((e) => ({
        id: e.path,
        filename: e.name,
        label: e.name,
      }))
      .sort((a, b) => (a.filename < b.filename ? 1 : -1))
  }
  // Fallback: single root-level file
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
  const file = body.files?.[GIST_FILENAME]
  if (!file) return []
  return [
    {
      id: GIST_FILENAME,
      filename: GIST_FILENAME,
      label: GIST_FILENAME,
      modifiedAt: body.updated_at ? Date.parse(body.updated_at) : undefined,
    },
  ]
}

async function gistRead(
  token: string,
  gistId: string,
): Promise<DatabaseBackup> {
  const res = await fetch(`${API_BASE}/gists/${gistId}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) await ghError(res, 'GitHub gist read failed')
  const body = (await res.json()) as {
    files?: Record<string, { content?: string }>
  }
  const content = body.files?.[GIST_FILENAME]?.content
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
  const url = `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}${
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
    if (target.kind === 'gist') {
      return await gistWrite(token, target.gistId, payload)
    }
    return await repoWrite(
      token,
      target.owner,
      target.repo,
      filename,
      payload,
      target.branch,
    )
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
    if (target.kind === 'gist') return await gistRead(token, target.gistId)
    return await repoRead(token, target.owner, target.repo, id, target.branch)
  },
}
