// Alle Schreibzugriffe auf die Datenbank laufen über diese Datei.
import { stateForValue } from '../domain/frequency'
import { habitLedgerId, habitLedgerRow } from '../domain/rewards'
import { mergeSettings } from '../domain/settings'
import type { HabitTemplate } from '../domain/templates'
import type { DayKey, Entry, EntryState, Habit, HabitStatus, Settings } from '../domain/types'
import { db, newId } from './db'

// ---------- Einstellungen ----------

export async function loadSettings(): Promise<Settings> {
  const rows = await db.settings.toArray()
  return mergeSettings(Object.fromEntries(rows.map((r) => [r.key, r.value])))
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

type Change = { value: number; state: EntryState }

/**
 * Ändert den Eintrag einer Gewohnheit für einen Tag und hält die zugehörige XP-/Münz-Buchung aktuell.
 * Lesen und Schreiben laufen in einer Transaktion: Schnelle Taps hintereinander gehen so nicht verloren.
 * Gibt `change` null zurück, bleibt alles unverändert.
 */
async function mutateEntry(habit: Habit, day: DayKey, change: (existing: Entry | undefined) => Change | null): Promise<void> {
  await db.transaction('rw', db.entries, db.ledger, db.settings, async () => {
    const id = entryId(habit.id, day)
    const now = Date.now()
    const existing = await db.entries.get(id)
    const next = change(existing)
    if (!next) return
    const entry: Entry = {
      id,
      habitId: habit.id,
      day,
      value: next.value,
      state: next.state,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      deletedAt: null,
      completedAt: next.state !== 'open' ? (existing?.completedAt ?? now) : null,
    }
    await db.entries.put(entry)
    await syncHabitLedger(habit, entry, now)
  })
}

/**
 * Bucht die Belohnung für einen Eintrag oder nimmt sie zurück, wenn er wieder offen ist.
 * Bleibt der Zustand gleich, bleibt die Buchung unverändert (auch wenn sich Punktwerte inzwischen geändert haben).
 */
async function syncHabitLedger(habit: Habit, entry: Entry, now: number): Promise<void> {
  const id = habitLedgerId(habit.id, entry.day)
  const existing = await db.ledger.get(id)
  const active = existing && !existing.deletedAt ? existing : undefined
  if (active && active.state === entry.state) return

  const { points } = await loadSettings()
  const row = habitLedgerRow(habit, entry, points, now)
  if (row) {
    await db.ledger.put({ ...row, createdAt: existing?.createdAt ?? now })
  } else if (active) {
    await db.ledger.update(id, { deletedAt: now, updatedAt: now })
  }
}

const valueChange = (habit: Habit, value: number, existing: Entry | undefined): Change => {
  const clamped = Math.max(0, value)
  return { value: clamped, state: stateForValue(habit, clamped, existing?.state) }
}

/** Abhaken und „Nicht getan“: schaltet zwischen offen und erledigt um. */
export async function toggleDone(habit: Habit, day: DayKey): Promise<void> {
  await mutateEntry(habit, day, (existing) => (existing?.state === 'done' ? { value: 0, state: 'open' } : { value: 1, state: 'done' }))
}

/** Zähler und Dauer: setzt den Wert, der Zustand ergibt sich aus dem Ziel. */
export async function setValue(habit: Habit, day: DayKey, value: number): Promise<void> {
  await mutateEntry(habit, day, (existing) => valueChange(habit, value, existing))
}

export async function addValue(habit: Habit, day: DayKey, delta: number): Promise<void> {
  await mutateEntry(habit, day, (existing) => valueChange(habit, (existing?.value ?? 0) + delta, existing))
}

/** Markiert die 2-Minuten-Version als gemacht. Ein bereits erreichtes Ziel bleibt „erledigt“. */
export async function markMini(habit: Habit, day: DayKey): Promise<void> {
  await mutateEntry(habit, day, (existing) => (existing?.state === 'done' ? null : { value: existing?.value ?? 0, state: 'mini' }))
}

export async function resetEntry(habit: Habit, day: DayKey): Promise<void> {
  await mutateEntry(habit, day, () => ({ value: 0, state: 'open' }))
}

export async function savePoints(points: Settings['points']): Promise<void> {
  await saveSetting('points', points)
}
