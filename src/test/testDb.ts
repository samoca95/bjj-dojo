import Dexie from 'dexie'
import { BJJDatabase } from '../db/database'

let counter = 0

/** Creates an isolated in-memory BJJDatabase for each test. */
export function makeTestDb(): BJJDatabase {
  counter++
  return new BJJDatabase(`bjj-dojo-test-${counter}`)
}

/** Opens the DB and waits for populate to complete. */
export async function openDb(db: BJJDatabase): Promise<BJJDatabase> {
  await db.open()
  return db
}

export async function closeDb(db: BJJDatabase) {
  db.close()
  await Dexie.delete(db.name)
}
