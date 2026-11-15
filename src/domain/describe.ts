// Kurze deutsche Beschreibungen für die Anzeige.
import { WEEKDAY_SHORT } from './areas'
import type { Entry, Habit } from './types'

type Describable = Pick<Habit, 'type' | 'target' | 'unit' | 'frequency'>

const nf = new Intl.NumberFormat('de-DE')

export function describeFrequency(h: Describable): string {
  const goal =
    h.type === 'counter' ? `${nf.format(h.target)} ${h.unit}`.trim() + ' · ' : h.type === 'duration' ? `${h.target} min · ` : ''
  switch (h.frequency.kind) {
    case 'daily':
      return `${goal}täglich`
    case 'weekly':
      return `${goal}${h.frequency.times}× pro Woche`
    case 'weekdays':
      return `${goal}${h.frequency.days.map((d) => WEEKDAY_SHORT[d]).join(', ')}`
  }
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

/** Fortschrittstext unter dem Namen in der Tagesansicht. */
export function describeProgress(habit: Habit, entry: Entry | undefined, liveSeconds = 0): string {
  const value = entry?.value ?? 0
  if (entry?.state === 'mini') return habit.miniVersion ? `Mini-Version: ${habit.miniVersion}` : 'Mini-Version gemacht'
  switch (habit.type) {
    case 'counter':
      return `${nf.format(value)} / ${nf.format(habit.target)} ${habit.unit}`.trim()
    case 'duration': {
      const total = value + liveSeconds
      if (liveSeconds > 0) return `${formatClock(total)} / ${habit.target} min · läuft`
      return `${Math.floor(total / 60)} / ${habit.target} min`
    }
    case 'avoid':
      return entry?.state === 'done' ? 'Durchgehalten' : 'Am Abend bestätigen'
    case 'check':
      return ''
  }
}
