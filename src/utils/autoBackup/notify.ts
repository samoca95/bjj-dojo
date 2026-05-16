/**
 * Single entry point that every mutation site calls after a successful write.
 * Marks the DB dirty (drives the sync indicator's "is up to date" state) and
 * schedules a debounced backup run.
 */
import { scheduleAfterMutation } from './index'
import { setLastMutationTime } from './settings'
import type { BJJDatabase } from '../../db/database'

export function notifyDbMutation(database?: BJJDatabase): void {
  setLastMutationTime(Date.now())
  scheduleAfterMutation(database)
}
