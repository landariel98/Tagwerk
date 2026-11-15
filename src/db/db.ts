import Dexie, { type EntityTable } from 'dexie'
import { DEFAULT_POINTS, ledgerRowsFromEntries } from '../domain/rewards'
import type { Entry, Habit, LedgerRow } from '../domain/types'

export interface SettingRow {
  key: string
  value: unknown
  updatedAt: number
}

export class TagwerkDB extends Dexie {
  habits!: EntityTable<Habit, 'id'>
  entries!: EntityTable<Entry, 'id'>
  settings!: EntityTable<SettingRow, 'key'>
  ledger!: EntityTable<LedgerRow, 'id'>

  constructor() {
    super('tagwerk')
    // Neue Tabellen oder Indizes kommen als weitere version(n) dazu, nie durch Ändern einer alten.
    this.version(1).stores({
      habits: 'id, status, updatedAt',
      entries: 'id, habitId, day, updatedAt',
      settings: 'key',
    })
    // Etappe 2: Buchungen für XP und Münzen. Bereits Erledigtes wird nachträglich gutgeschrieben.
    this.version(2)
      .stores({ ledger: 'id, day, kind, updatedAt' })
      .upgrade(async (tx) => {
        const habits = (await tx.table('habits').toArray()) as Habit[]
        const entries = (await tx.table('entries').toArray()) as Entry[]
        await tx.table('ledger').bulkPut(ledgerRowsFromEntries(habits, entries, DEFAULT_POINTS, Date.now()))
      })
  }
}

export const db = new TagwerkDB()

export const newId = (): string =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
