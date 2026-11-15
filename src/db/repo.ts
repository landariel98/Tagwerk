// Alle Schreibzugriffe auf die Datenbank laufen über diese Datei.
import { stateForValue } from '../domain/frequency'
import type { HabitTemplate } from '../domain/templates'
import { DEFAULT_SETTINGS, type DayKey, type Entry, type EntryState, type Habit, type HabitStatus, type Settings } from '../domain/types'
import { db, newId } from './db'

// ---------- Einstellungen ----------

export async function loadSettings(): Promise<Settings> {
  const rows = await db.settings.toArray()
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return { ...DEFAULT_SETTINGS, ...stored } as Settings
}

export async function saveSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
  await db.settings.put({ key, value, updatedAt: Date.now() })
}

/** Merkt sich beim allerersten Start den Zeitpunkt (Grundlage der Backup-Erinnerung). */
export async function ensureFirstUse(): Promise<void> {
  const existing = await db.settings.get('firstUseAt')
  if (!existing) await saveSetting('firstUseAt', Date.now())
}

// ---------- Gewohnheiten ----------

export type HabitDraft = Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'sortOrder' | 'status' | 'afterHabitId'>

async function nextSortOrder(): Promise<number> {
  const all = await db.habits.toArray()
  return all.reduce((max, h) => Math.max(max, h.sortOrder), 0) + 1
}

export async function createHabit(draft: HabitDraft): Promise<Habit> {
  const now = Date.now()
  const habit: Habit = {
    ...draft,
    id: newId(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    afterHabitId: null,
    status: 'active',
    sortOrder: await nextSortOrder(),
  }
  await db.habits.add(habit)
  return habit
}

export async function createHabitsFromTemplates(templates: HabitTemplate[]): Promise<void> {
  for (const { key: _key, preselected: _pre, ...draft } of templates) {
    await createHabit(draft)
  }
}

export async function updateHabit(id: string, changes: Partial<HabitDraft>): Promise<void> {
  await db.habits.update(id, { ...changes, updatedAt: Date.now() })
}

export async function setHabitStatus(id: string, status: HabitStatus): Promise<void> {
  await db.habits.update(id, { status, updatedAt: Date.now() })
}

/** Löscht „weich“: Der Datensatz bleibt mit Löschmarkierung erhalten (wichtig für späteren Sync). */
export async function deleteHabit(id: string): Promise<void> {
  const now = Date.now()
  await db.habits.update(id, { deletedAt: now, updatedAt: now })
}

// ---------- Einträge ----------

const entryId = (habitId: string, day: DayKey) => `${habitId}_${day}`

async function writeEntry(habit: Habit, day: DayKey, value: number, state: EntryState): Promise<void> {
  const id = entryId(habit.id, day)
  const now = Date.now()
  const existing = await db.entries.get(id)
  const completed = state !== 'open'
  const entry: Entry = {
    id,
    habitId: habit.id,
    day,
    value,
    state,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    deletedAt: null,
    completedAt: completed ? (existing?.completedAt ?? now) : null,
  }
  await db.entries.put(entry)
}

/** Abhaken und „Nicht getan“: schaltet zwischen offen und erledigt um. */
export async function toggleDone(habit: Habit, day: DayKey): Promise<void> {
  const existing = await db.entries.get(entryId(habit.id, day))
  const isDone = existing?.state === 'done'
  await writeEntry(habit, day, isDone ? 0 : 1, isDone ? 'open' : 'done')
}

/** Zähler und Dauer: setzt den Wert, der Zustand ergibt sich aus dem Ziel. */
export async function setValue(habit: Habit, day: DayKey, value: number): Promise<void> {
  const existing = await db.entries.get(entryId(habit.id, day))
  const clamped = Math.max(0, value)
  await writeEntry(habit, day, clamped, stateForValue(habit, clamped, existing?.state))
}

export async function addValue(habit: Habit, day: DayKey, delta: number): Promise<void> {
  const existing = await db.entries.get(entryId(habit.id, day))
  await setValue(habit, day, (existing?.value ?? 0) + delta)
}

/** Markiert die 2-Minuten-Version als gemacht. Ein bereits erreichtes Ziel bleibt „erledigt“. */
export async function markMini(habit: Habit, day: DayKey): Promise<void> {
  const existing = await db.entries.get(entryId(habit.id, day))
  if (existing?.state === 'done') return
  await writeEntry(habit, day, existing?.value ?? 0, 'mini')
}

export async function resetEntry(habit: Habit, day: DayKey): Promise<void> {
  await writeEntry(habit, day, 0, 'open')
}
