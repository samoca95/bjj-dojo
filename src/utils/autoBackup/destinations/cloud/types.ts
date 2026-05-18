/**
 * Shared types for OAuth-based cloud backup destinations (Google Drive,
 * Dropbox). Both providers expose the same `BackupDestination` contract — the
 * helpers here keep the per-provider implementations small.
 */
import type { BackupDestination, DestinationId } from '../../types'
import {
  type CloudTokens,
  getCloudAccountLabel,
  getCloudLastError,
  getCloudLastRun,
  getCloudNeedsReconnect,
  getCloudRemoteRootId,
  getCloudTokens,
  isCloudBackupEnabled,
  setCloudAccountLabel,
  setCloudLastError,
  setCloudNeedsReconnect,
  setCloudRemoteRootId,
  setCloudTokens,
} from '../../settings'

export type CloudProviderId = Extract<DestinationId, 'googleDrive' | 'dropbox'>

export interface CloudProvider extends BackupDestination {
  id: CloudProviderId
  /** Launches PKCE OAuth, persists tokens, returns the authenticated account label. */
  connect(): Promise<{ accountLabel: string }>
  /** Revokes the access token (best effort) and clears local state. */
  disconnect(): Promise<void>
  isConnected(): boolean
}

// Re-export so providers don't need to import from settings directly.
export {
  type CloudTokens,
  getCloudAccountLabel,
  getCloudLastError,
  getCloudLastRun,
  getCloudNeedsReconnect,
  getCloudRemoteRootId,
  getCloudTokens,
  isCloudBackupEnabled,
  setCloudAccountLabel,
  setCloudLastError,
  setCloudNeedsReconnect,
  setCloudRemoteRootId,
  setCloudTokens,
}
