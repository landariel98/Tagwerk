// Zentrale Datentypen. Jeder Datensatz trägt id, updatedAt und deletedAt,
// damit sich später eine Synchronisierung ohne Umbau nachrüsten lässt.

export type AreaId = 'koerper' | 'vitalitaet' | 'seele' | 'ruhe'

export type HabitType =
  | 'check' // Abhaken (ja/nein)
  | 'counter' // Zähler mit Ziel
  | 'duration' // Dauer mit Timer (Ziel in Minuten, Wert in Sekunden)
  | 'avoid' // „Nicht getan“, wird am Abend bestätigt

export type Frequency =
  | { kind: 'daily' }
  | { kind: 'weekly'; times: number } // X-mal pro Woche, Tage frei wählbar
  | { kind: 'weekdays'; days: number[] } // feste Wochentage, 0 = Montag … 6 = Sonntag

export type TimeOfDay = 'morning' | 'day' | 'evening' | null
export type Difficulty = 'easy' | 'medium' | 'hard'
export type HabitStatus = 'active' | 'paused' | 'archived'

/** Kalendertag als 'JJJJ-MM-TT' (lokale Zeit, bereits um den Tageswechsel verschoben). */
export type DayKey = string

export interface SyncMeta {
  id: string
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface Habit extends SyncMeta {
  name: string
  emoji: string
  area: AreaId
  type: HabitType
  /** Zähler: Anzahl. Dauer: Minuten. Sonst 1. */
  target: number
  /** Einheit für Zähler, z. B. „Gläser“. */
  unit: string
  frequency: Frequency
  timeOfDay: TimeOfDay
  difficulty: Difficulty
  /** Beschreibung der 2-Minuten-Version, leer = keine. */
  miniVersion: string
  /** Habit Stacking: wird direkt nach dieser Gewohnheit angezeigt (Etappe 5). */
  afterHabitId: string | null
  status: HabitStatus
  sortOrder: number
}

export type EntryState = 'open' | 'done' | 'mini'

/** Ein Eintrag pro Gewohnheit und Tag. id = `${habitId}_${day}`. */
export interface Entry extends SyncMeta {
  habitId: string
  day: DayKey
  /** Zähler: Anzahl. Dauer: Sekunden. Abhaken/Nicht getan: 0 oder 1. */
  value: number
  state: EntryState
  completedAt: number | null
}

/**
 * Eine Buchung von XP und Münzen. Level und Kontostand ergeben sich aus der Summe aller Buchungen.
 * Weitere Arten (Boni, Einkäufe) kommen in Etappe 3 dazu.
 */
export interface LedgerRow extends SyncMeta {
  day: DayKey
  kind: 'habit' | 'bonus'
  /** Anzeigetext, z. B. der Name der Gewohnheit. */
  reason: string
  habitId: string | null
  /** Attribut, dem die XP gutgeschrieben werden. null = nur Gesamtlevel. */
  area: AreaId | null
  /** Bei Gewohnheiten: der Zustand, für den gebucht wurde (erledigt oder Mini). */
  state?: EntryState
  xp: number
  coins: number
}

export interface PointSettings {
  xp: Record<Difficulty, number>
  coins: Record<Difficulty, number>
  /** Anteil der Punkte für die Mini-Version in Prozent. */
  miniPercent: number
}

export interface Settings {
  /** Stunde, zu der ein neuer Tag beginnt (0–6). */
  dayStartHour: number
  firstUseAt: number
  lastBackupAt: number | null
  backupReminderDays: number
  points: PointSettings
}
