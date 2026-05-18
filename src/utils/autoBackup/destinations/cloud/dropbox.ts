/**
 * Dropbox auto-backup destination.
 *
 * OAuth: Authorization Code + PKCE in-browser. The Dropbox App Console app
 * should be configured with "App folder" access — files land under
 * `/Apps/BJJ Dojo/` in the user's Dropbox and are sandboxed from the rest of
 * their storage. Use `token_access_type=offline` so we get a refresh token.
 *
 * API surface: `/2/files/upload`, `/2/files/list_folder`, `/2/files/download`,
 * `/2/files/delete_v2`, plus `/2/users/get_current_account` for the display
 * label. Paths are relative to the App folder root (empty path means root).
 */
import type {
  BackupResult,
  DiscoveredBackup,
  BackupDestination,
} from '../../types'
import type { DatabaseBackup } from '../../../../db/database'
import {
  authorizeWithPopup,
  generatePkcePair,
  getCallbackUrl,
} from '../../oauth/pkce'
import {
  getBackupRetentionCount,
  setCloudLastError,
  setCloudNeedsReconnect,
} from '../../settings'
import {
  type CloudProvider,
  type CloudTokens,
  getCloudAccountLabel,
  getCloudTokens,
  isCloudBackupEnabled,
  setCloudAccountLabel,
  setCloudRemoteRootId,
  setCloudTokens,
} from './types'
import {
  isRecognizedBackupFilename,
  parseBackupComponentFromFilename,
} from '../../files'

const PROVIDER_ID = 'dropbox' as const
const AUTH_URL = 'https://www.dropbox.com/oauth2/authorize'
const TOKEN_URL = 'https://api.dropboxapi.com/oauth2/token'
const REVOKE_URL = 'https://api.dropboxapi.com/2/auth/token/revoke'
const API_BASE = 'https://api.dropboxapi.com/2'
const CONTENT_BASE = 'https://content.dropboxapi.com/2'
const BACKUP_JSON_INDENT = 2

let writeQueue: Promise<void> = Promise.resolve()

function appKey(): string | null {
  const raw = import.meta.env.VITE_DROPBOX_APP_KEY
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function isDropboxConfigured(): boolean {
  return appKey() !== null
}

function serializeBackup(payload: DatabaseBackup): string {
  return `${JSON.stringify(payload, null, BACKUP_JSON_INDENT)}\n`
}

function requireAppKey(): string {
  const k = appKey()
  if (!k) throw new Error('Dropbox login is not configured in this build.')
  return k
}

async function exchangeCodeForTokens(
  code: string,
  verifier: string,
): Promise<CloudTokens & { accountLabel: string }> {
  const body = new URLSearchParams({
    client_id: requireAppKey(),
    code,
    code_verifier: verifier,
    grant_type: 'authorization_code',
    redirect_uri: getCallbackUrl(),
  })
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Dropbox token exchange failed (${res.status}) ${text}`)
  }
  const parsed = (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in?: number
  }
  const tokens: CloudTokens = {
    accessToken: parsed.access_token,
    refreshToken: parsed.refresh_token,
    expiresAt:
      typeof parsed.expires_in === 'number'
        ? Date.now() + parsed.expires_in * 1000
        : undefined,
  }
  const accountLabel = await fetchAccountLabel(tokens.accessToken)
  return { ...tokens, accountLabel }
}

async function refreshAccessToken(refreshToken: string): Promise<CloudTokens> {
  const body = new URLSearchParams({
    client_id: requireAppKey(),
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Dropbox token refresh failed (${res.status}) ${text}`)
  }
  const parsed = (await res.json()) as {
    access_token: string
    expires_in?: number
    refresh_token?: string
  }
  return {
    accessToken: parsed.access_token,
    refreshToken: parsed.refresh_token ?? refreshToken,
    expiresAt:
      typeof parsed.expires_in === 'number'
        ? Date.now() + parsed.expires_in * 1000
        : undefined,
  }
}

async function fetchAccountLabel(accessToken: string): Promise<string> {
  const res = await fetch(`${API_BASE}/users/get_current_account`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return 'Dropbox'
  const body = (await res.json()) as {
    email?: string
    name?: { display_name?: string }
  }
  return body.email ?? body.name?.display_name ?? 'Dropbox'
}

async function getValidAccessToken(): Promise<string> {
  const tokens = getCloudTokens(PROVIDER_ID)
  if (!tokens) throw new Error('Dropbox is not connected.')
  const expired =
    tokens.expiresAt != null && Date.now() >= tokens.expiresAt - 60_000
  if (!expired) return tokens.accessToken
  if (!tokens.refreshToken) {
    setCloudNeedsReconnect(PROVIDER_ID, true)
    throw new Error('Dropbox session expired — reconnect required.')
  }
  try {
    const refreshed = await refreshAccessToken(tokens.refreshToken)
    setCloudTokens(PROVIDER_ID, refreshed)
    return refreshed.accessToken
  } catch (err) {
    setCloudNeedsReconnect(PROVIDER_ID, true)
    throw err
  }
}

interface RetryableRequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: BodyInit
}

async function authedFetch(
  url: string,
  options: RetryableRequestOptions = {},
): Promise<Response> {
  let token = await getValidAccessToken()
  let res = await fetch(url, {
    ...options,
    headers: { ...(options.headers ?? {}), Authorization: `Bearer ${token}` },
  })
  if (res.status !== 401) return res
  const tokens = getCloudTokens(PROVIDER_ID)
  if (!tokens?.refreshToken) {
    setCloudNeedsReconnect(PROVIDER_ID, true)
    throw new Error('Dropbox session expired — reconnect required.')
  }
  try {
    const refreshed = await refreshAccessToken(tokens.refreshToken)
    setCloudTokens(PROVIDER_ID, refreshed)
    token = refreshed.accessToken
  } catch (err) {
    setCloudNeedsReconnect(PROVIDER_ID, true)
    throw err
  }
  res = await fetch(url, {
    ...options,
    headers: { ...(options.headers ?? {}), Authorization: `Bearer ${token}` },
  })
  return res
}

interface DropboxEntry {
  '.tag': string
  name: string
  path_lower?: string
  id: string
  server_modified?: string
}

async function listAppFolder(): Promise<DropboxEntry[]> {
  const res = await authedFetch(`${API_BASE}/files/list_folder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: '', recursive: false }),
  })
  if (res.status === 409) return [] // path/not_found — empty App folder
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Dropbox list failed (${res.status}) ${text}`)
  }
  const body = (await res.json()) as { entries?: DropboxEntry[] }
  return (body.entries ?? []).filter((e) => e['.tag'] === 'file')
}

async function uploadFile(
  filename: string,
  content: string,
): Promise<DropboxEntry> {
  const apiArg = {
    path: `/${filename}`,
    mode: 'overwrite',
    autorename: false,
    mute: true,
  }
  const res = await authedFetch(`${CONTENT_BASE}/files/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify(apiArg),
    },
    body: content,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Dropbox upload failed (${res.status}) ${text}`)
  }
  return (await res.json()) as DropboxEntry
}

async function downloadFile(path: string): Promise<string> {
  const res = await authedFetch(`${CONTENT_BASE}/files/download`, {
    method: 'POST',
    headers: { 'Dropbox-API-Arg': JSON.stringify({ path }) },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Dropbox download failed (${res.status}) ${text}`)
  }
  return await res.text()
}

async function deleteFile(path: string): Promise<void> {
  await authedFetch(`${API_BASE}/files/delete_v2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  })
}

async function rotateOldBackups(justWritten: string): Promise<void> {
  const keep = getBackupRetentionCount()
  const writtenComponent = parseBackupComponentFromFilename(justWritten)
  if (!writtenComponent) return
  const files = await listAppFolder()
  const sameComponent = files
    .filter(
      (f) =>
        f.name !== justWritten &&
        parseBackupComponentFromFilename(f.name) === writtenComponent,
    )
    .sort((a, b) => (a.name < b.name ? 1 : -1))
  const toDelete = sameComponent.slice(Math.max(0, keep - 1))
  for (const f of toDelete) {
    try {
      if (f.path_lower) await deleteFile(f.path_lower)
    } catch {
      // best effort
    }
  }
}

async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(REVOKE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    // best effort
  }
}

export const dropboxDestination: CloudProvider = {
  id: PROVIDER_ID,

  async isEnabled() {
    if (!isCloudBackupEnabled(PROVIDER_ID)) return false
    if (
      typeof window !== 'undefined' &&
      // navigator.onLine is best-effort; treat false-positives as enabled.
      navigator &&
      navigator.onLine === false
    ) {
      return false
    }
    return getCloudTokens(PROVIDER_ID) !== null
  },

  isConnected() {
    return getCloudTokens(PROVIDER_ID) !== null
  },

  async connect() {
    const k = requireAppKey()
    const pkce = await generatePkcePair()
    const params = new URLSearchParams({
      client_id: k,
      redirect_uri: getCallbackUrl(),
      response_type: 'code',
      token_access_type: 'offline',
      code_challenge: pkce.challenge,
      code_challenge_method: 'S256',
      state: pkce.state,
    })
    const authorizeUrl = `${AUTH_URL}?${params}`
    const { code } = await authorizeWithPopup(authorizeUrl, pkce.state, {
      popupTitle: 'dropbox-oauth',
    })
    const result = await exchangeCodeForTokens(code, pkce.verifier)
    setCloudTokens(PROVIDER_ID, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
    })
    setCloudAccountLabel(PROVIDER_ID, result.accountLabel)
    setCloudNeedsReconnect(PROVIDER_ID, false)
    setCloudLastError(PROVIDER_ID, null)
    setCloudRemoteRootId(PROVIDER_ID, '/')
    return { accountLabel: result.accountLabel }
  },

  async disconnect() {
    const tokens = getCloudTokens(PROVIDER_ID)
    if (tokens?.accessToken) await revokeToken(tokens.accessToken)
    setCloudTokens(PROVIDER_ID, null)
    setCloudAccountLabel(PROVIDER_ID, null)
    setCloudRemoteRootId(PROVIDER_ID, null)
    setCloudNeedsReconnect(PROVIDER_ID, false)
    setCloudLastError(PROVIDER_ID, null)
  },

  async write(payload, filename): Promise<BackupResult> {
    const run = async () => {
      const content = serializeBackup(payload)
      await uploadFile(filename, content)
      await rotateOldBackups(filename)
      return { filename, bytesWritten: content.length }
    }
    const queued = writeQueue.then(run, run)
    writeQueue = queued.then(
      () => undefined,
      () => undefined,
    )
    return await queued
  },

  async discoverExistingBackups(): Promise<DiscoveredBackup[]> {
    const tokens = getCloudTokens(PROVIDER_ID)
    if (!tokens) return []
    const entries = await listAppFolder()
    return entries
      .filter((e) => isRecognizedBackupFilename(e.name))
      .map((e) => ({
        id: e.path_lower ?? `/${e.name}`,
        filename: e.name,
        label: e.server_modified
          ? `${e.name} (${new Date(e.server_modified).toLocaleString()})`
          : e.name,
        modifiedAt: e.server_modified
          ? Date.parse(e.server_modified)
          : undefined,
      }))
      .sort((a, b) => (b.modifiedAt ?? 0) - (a.modifiedAt ?? 0))
  },

  async readBackup(id: string) {
    const text = await downloadFile(id)
    return JSON.parse(text) as DatabaseBackup
  },
}

export const dropboxBackupDestination: BackupDestination = dropboxDestination

export function getDropboxAccountLabel(): string | null {
  return getCloudAccountLabel(PROVIDER_ID)
}
