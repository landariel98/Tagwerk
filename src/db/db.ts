import Dexie, { type EntityTable } from 'dexie'
import type { Entry, Habit } from '../domain/types'

export interface SettingRow {
  key: string
  value: unknown
  updatedAt: number
}

export class TagwerkDB extends Dexie {
  habits!: EntityTable<Habit, 'id'>
  entries!: EntityTable<Entry, 'id'>
  settings!: EntityTable<SettingRow, 'key'>

  constructor() {
    super('tagwerk')
    // Neue Tabellen oder Indizes kommen als weitere version(n) dazu, nie durch Ändern einer alten.
    this.version(1).stores({
      habits: 'id, status, updatedAt',
      entries: 'id, habitId, day, updatedAt',
      settings: 'key',
    })
  }
}

export const db = new TagwerkDB()

export const newId = (): string =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
