import type { DayKey } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

export function toDayKey(d: Date): DayKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Liefert den Tag als Datum um 12 Uhr mittags, damit Zeitumstellungen nichts verschieben. */
export function fromDayKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

/**
 * Der „gefühlte“ Tag: Vor der Tageswechsel-Stunde zählt die Uhrzeit noch zum Vortag.
 * Beispiel: Tageswechsel 4 Uhr, es ist 01:30 am 16. → Tag ist der 15.
 */
export function logicalDay(now: Date, dayStartHour: number): DayKey {
  const shifted = new Date(now.getTime())
  shifted.setHours(shifted.getHours() - dayStartHour)
  return toDayKey(shifted)
}

export function addDays(key: DayKey, n: number): DayKey {
  const d = fromDayKey(key)
  d.setDate(d.getDate() + n)
  return toDayKey(d)
}

/** Wochentag mit 0 = Montag … 6 = Sonntag. */
export function weekdayIndex(key: DayKey): number {
  return (fromDayKey(key).getDay() + 6) % 7
}

/** Montag der Woche, in der der Tag liegt. */
export function weekStart(key: DayKey): DayKey {
  return addDays(key, -weekdayIndex(key))
}

/** Alle sieben Tage (Mo–So) der Woche, in der der Tag liegt. */
export function weekDays(key: DayKey): DayKey[] {
  const start = weekStart(key)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function formatDayLong(key: DayKey): string {
  return new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }).format(fromDayKey(key))
}

export function formatDateTime(ts: number): string {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ts))
}
