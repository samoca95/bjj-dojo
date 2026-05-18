/**
 * Google Drive auto-backup destination.
 *
 * OAuth: Authorization Code + PKCE entirely in-browser — no client secret,
 * no proxy. Configure the OAuth client in Google Cloud Console as a "Web
 * application" with the app's origin in JS origins and the OAuth callback
 * URL in authorized redirect URIs.
 *
 * Scope: `drive.file` — the app can only see files it created. The first
 * connect creates a "BJJ Dojo" folder at Drive root and persists its ID;
 * each component file lives directly under that folder. Files are full
 * snapshots — replace-in-place rather than append. Older snapshots are
 * pruned by `getBackupRetentionCount()`.
 *
 * Token refresh: Google's token endpoint accepts `grant_type=refresh_token`
 * with the same client_id (PKCE — no client secret). We refresh on demand
 * whenever the cached expiry has passed or a request returns 401.
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
  getCloudNeedsReconnect,
  getCloudRemoteRootId,
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

const PROVIDER_ID = 'googleDrive' as const
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke'
const API_BASE = 'https://www.googleapis.com/drive/v3'
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3'
const SCOPE = 'https://www.googleapis.com/auth/drive.file'
const APP_FOLDER_NAME = 'BJJ Dojo'
const FOLDER_MIME = 'application/vnd.google-apps.folder'
const BACKUP_JSON_INDENT = 2

let writeQueue: Promise<void> = Promise.resolve()

function clientId(): string | null {
  const raw = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function isGoogleDriveConfigured(): boolean {
  return clientId() !== null
}

function serializeBackup(payload: DatabaseBackup): string {
  return `${JSON.stringify(payload, null, BACKUP_JSON_INDENT)}\n`
}

function requireClientId(): string {
  const id = clientId()
  if (!id) {
    throw new Error('Google Drive login is not configured in this build.')
  }
  return id
}

async function exchangeCodeForTokens(
  code: string,
  verifier: string,
): Promise<CloudTokens & { accountLabel: string }> {
  const body = new URLSearchParams({
    client_id: requireClientId(),
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
    throw new Error(`Google token exchange failed (${res.status}) ${text}`)
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
    client_id: requireClientId(),
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
    throw new Error(`Google token refresh failed (${res.status}) ${text}`)
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
  const res = await fetch(
    `${API_BASE}/about?fields=user(emailAddress,displayName)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )
  if (!res.ok) return 'Google Drive'
  const body = (await res.json()) as {
    user?: { emailAddress?: string; displayName?: string }
  }
  return body.user?.emailAddress ?? body.user?.displayName ?? 'Google Drive'
}

/**
 * Get a valid access token, refreshing if needed. Marks the destination as
 * needing reconnection if the refresh fails (typically because the refresh
 * token was revoked).
 */
async function getValidAccessToken(): Promise<string> {
  const tokens = getCloudTokens(PROVIDER_ID)
  if (!tokens) throw new Error('Google Drive is not connected.')
  const expired =
    tokens.expiresAt != null && Date.now() >= tokens.expiresAt - 60_000
  if (!expired) return tokens.accessToken
  if (!tokens.refreshToken) {
    setCloudNeedsReconnect(PROVIDER_ID, true)
    throw new Error('Google Drive session expired — reconnect required.')
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

/**
 * fetch with one transparent refresh-and-retry on 401, so callers don't have
 * to special-case token expiry on every request.
 */
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
    throw new Error('Google Drive session expired — reconnect required.')
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

async function ensureAppFolder(): Promise<string> {
  const cached = getCloudRemoteRootId(PROVIDER_ID)
  if (cached) return cached
  // Search for an existing folder named "BJJ Dojo" at root that we created.
  const search = new URLSearchParams({
    q: `name='${APP_FOLDER_NAME}' and mimeType='${FOLDER_MIME}' and trashed=false`,
    fields: 'files(id,name)',
    spaces: 'drive',
  })
  const findRes = await authedFetch(`${API_BASE}/files?${search}`)
  if (findRes.ok) {
    const body = (await findRes.json()) as { files?: Array<{ id: string }> }
    if (body.files && body.files.length > 0) {
      const id = body.files[0].id
      setCloudRemoteRootId(PROVIDER_ID, id)
      return id
    }
  }
  // Create.
  const createRes = await authedFetch(`${API_BASE}/files?fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: APP_FOLDER_NAME, mimeType: FOLDER_MIME }),
  })
  if (!createRes.ok) {
    const text = await createRes.text().catch(() => '')
    throw new Error(
      `Could not create Google Drive folder (${createRes.status}) ${text}`,
    )
  }
  const created = (await createRes.json()) as { id: string }
  setCloudRemoteRootId(PROVIDER_ID, created.id)
  return created.id
}

interface DriveFile {
  id: string
  name: string
  modifiedTime?: string
}

async function listFolderFiles(folderId: string): Promise<DriveFile[]> {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id,name,modifiedTime)',
    pageSize: '1000',
  })
  const res = await authedFetch(`${API_BASE}/files?${params}`)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Google Drive list failed (${res.status}) ${text}`)
  }
  const body = (await res.json()) as { files?: DriveFile[] }
  return body.files ?? []
}

async function uploadFile(
  folderId: string,
  filename: string,
  content: string,
  existingId?: string,
): Promise<DriveFile> {
  // Multipart upload — wraps metadata + content in one request.
  const boundary = `bjjdojo-${crypto.randomUUID()}`
  const metadata = existingId ? {} : { name: filename, parents: [folderId] }
  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    'Content-Type: application/json\r\n\r\n' +
    `${content}\r\n` +
    `--${boundary}--`
  const url = existingId
    ? `${UPLOAD_BASE}/files/${encodeURIComponent(existingId)}?uploadType=multipart&fields=id,name,modifiedTime`
    : `${UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,modifiedTime`
  const res = await authedFetch(url, {
    method: existingId ? 'PATCH' : 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Google Drive upload failed (${res.status}) ${text}`)
  }
  return (await res.json()) as DriveFile
}

async function downloadFile(fileId: string): Promise<string> {
  const res = await authedFetch(
    `${API_BASE}/files/${encodeURIComponent(fileId)}?alt=media`,
  )
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Google Drive download failed (${res.status}) ${text}`)
  }
  return await res.text()
}

async function deleteFile(fileId: string): Promise<void> {
  await authedFetch(`${API_BASE}/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
  })
}

async function rotateOldBackups(
  folderId: string,
  justWritten: string,
): Promise<void> {
  const keep = getBackupRetentionCount()
  const writtenComponent = parseBackupComponentFromFilename(justWritten)
  if (!writtenComponent) return
  const files = await listFolderFiles(folderId)
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
      await deleteFile(f.id)
    } catch {
      // best effort
    }
  }
}

async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, {
      method: 'POST',
    })
  } catch {
    // best effort
  }
}

export const googleDriveDestination: CloudProvider = {
  id: PROVIDER_ID,

  async isEnabled() {
    if (!isCloudBackupEnabled(PROVIDER_ID)) return false
    if (getCloudNeedsReconnect(PROVIDER_ID)) return false
    return getCloudTokens(PROVIDER_ID) !== null
  },

  isConnected() {
    return getCloudTokens(PROVIDER_ID) !== null
  },

  async connect() {
    const id = requireClientId()
    const pkce = await generatePkcePair()
    const params = new URLSearchParams({
      client_id: id,
      redirect_uri: getCallbackUrl(),
      response_type: 'code',
      scope: SCOPE,
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state: pkce.state,
      code_challenge: pkce.challenge,
      code_challenge_method: 'S256',
    })
    const authorizeUrl = `${AUTH_URL}?${params}`
    const { code } = await authorizeWithPopup(authorizeUrl, pkce.state, {
      popupTitle: 'google-drive-oauth',
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
    // Pre-create the folder so a write doesn't have to do it later.
    setCloudRemoteRootId(PROVIDER_ID, null)
    await ensureAppFolder()
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
      const folderId = await ensureAppFolder()
      const content = serializeBackup(payload)
      // If a file with this exact name already exists, replace it in place
      // so we don't rack up duplicate IDs when filenames collide.
      const existing = await listFolderFiles(folderId)
      const match = existing.find((f) => f.name === filename)
      await uploadFile(folderId, filename, content, match?.id)
      await rotateOldBackups(folderId, filename)
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
    let folderId: string
    try {
      folderId = await ensureAppFolder()
    } catch {
      return []
    }
    const files = await listFolderFiles(folderId)
    return files
      .filter((f) => isRecognizedBackupFilename(f.name))
      .map((f) => ({
        id: f.id,
        filename: f.name,
        label: f.modifiedTime
          ? `${f.name} (${new Date(f.modifiedTime).toLocaleString()})`
          : f.name,
        modifiedAt: f.modifiedTime ? Date.parse(f.modifiedTime) : undefined,
      }))
      .sort((a, b) => (b.modifiedAt ?? 0) - (a.modifiedAt ?? 0))
  },

  async readBackup(id: string) {
    const text = await downloadFile(id)
    return JSON.parse(text) as DatabaseBackup
  },
}

// Convenience alias for callers that don't need the cloud-specific helpers.
export const googleDriveBackupDestination: BackupDestination =
  googleDriveDestination

export function getGoogleDriveAccountLabel(): string | null {
  return getCloudAccountLabel(PROVIDER_ID)
}
