/**
 * Single entry point that every mutation site calls after a successful write.
 * Marks the DB dirty (drives the sync indicator's "is up to date" state) and
 * schedules a debounced backup run.
 */
import { scheduleAfterMutation } from './index'
import { setLastMutationTime } from './settings'
import type { BJJDatabase } from '../../db/database'
import type { BackupComponent } from './types'

interface MutationOptions {
  components?: BackupComponent[]
  showSyncIndicator?: boolean
}

export function notifyDbMutation(
  database?: BJJDatabase,
  options: MutationOptions = {},
): void {
  setLastMutationTime(Date.now())
  scheduleAfterMutation(database, options)
}

export function notifyPreferenceMutation(): void {
  notifyDbMutation(undefined, {
    components: ['preferences'],
    showSyncIndicator: false,
  })
}
