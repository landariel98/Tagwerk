import type { AreaId, Difficulty, HabitType, TimeOfDay } from './types'

export interface Area {
  id: AreaId
  /** Name des Bereichs. */
  label: string
  /** Name des Attributs, in dem man auflevelt. */
  attribute: string
  color: string
}

export const AREAS: Area[] = [
  { id: 'koerper', label: 'Sport & Bewegung', attribute: 'Körper', color: 'var(--koerper)' },
  { id: 'vitalitaet', label: 'Ernährung & Trinken', attribute: 'Vitalität', color: 'var(--vitalitaet)' },
  { id: 'seele', label: 'Me-Time', attribute: 'Seele', color: 'var(--seele)' },
  { id: 'ruhe', label: 'Schlaf & Handy-Detox', attribute: 'Ruhe', color: 'var(--ruhe)' },
]

export const areaById = (id: AreaId): Area => AREAS.find((a) => a.id === id) ?? AREAS[0]

export const TYPE_LABELS: Record<HabitType, string> = {
  check: 'Abhaken',
  counter: 'Zähler',
  duration: 'Dauer',
  avoid: 'Nicht getan',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Leicht',
  medium: 'Mittel',
  hard: 'Schwer',
}

export const TIME_OF_DAY_LABELS: Record<Exclude<TimeOfDay, null>, string> = {
  morning: 'Morgen',
  day: 'Tagsüber',
  evening: 'Abend',
}

export const WEEKDAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
