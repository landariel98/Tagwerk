import { logicalDay, weekDays, weekdayIndex } from './dates'
import type { DayKey, Entry, EntryState, Habit, TimeOfDay } from './types'

export const isCompleted = (entry: Entry | undefined): boolean =>
  !!entry && !entry.deletedAt && (entry.state === 'done' || entry.state === 'mini')

/** Zielwert in der Einheit, in der Einträge gespeichert werden (Dauer: Sekunden). */
export function targetValue(habit: Habit): number {
  if (habit.type === 'duration') return habit.target * 60
  if (habit.type === 'counter') return habit.target
  return 1
}

/** Zustand, der sich allein aus dem Wert ergibt. Eine Mini-Version bleibt erhalten, bis das Ziel erreicht ist. */
export function stateForValue(habit: Habit, value: number, previous: EntryState = 'open'): EntryState {
  if (value >= targetValue(habit)) return 'done'
  return previous === 'mini' ? 'mini' : 'open'
}

/** Gab es die Gewohnheit an diesem Tag schon? Verhindert „verpasste“ Tage vor dem Anlegen. */
export function existedOn(habit: Habit, day: DayKey, dayStartHour: number): boolean {
  return logicalDay(new Date(habit.createdAt), dayStartHour) <= day
}

/** Fest für diesen Tag geplant (zählt für den Tagesbonus). X-mal-pro-Woche ist nie fest geplant. */
export function isScheduledOn(habit: Habit, day: DayKey): boolean {
  switch (habit.frequency.kind) {
    case 'daily':
      return true
    case 'weekdays':
      return habit.frequency.days.includes(weekdayIndex(day))
    case 'weekly':
      return false
  }
}

/** Wie oft die Gewohnheit in der Woche des Tages schon erledigt wurde. */
export function weeklyCount(habit: Habit, entries: Entry[], day: DayKey): number {
  const days = new Set(weekDays(day))
  return entries.filter((e) => e.habitId === habit.id && days.has(e.day) && isCompleted(e)).length
}

export interface PlannedHabit {
  habit: Habit
  entry: Entry | undefined
  completed: boolean
}

export interface WeeklyHabit extends PlannedHabit {
  doneThisWeek: number
  times: number
}

export interface DayPlan {
  /** Fest für den Tag geplante Gewohnheiten. */
  scheduled: PlannedHabit[]
  /** X-mal-pro-Woche-Gewohnheiten, deren Wochenziel noch offen ist oder die heute erledigt wurden. */
  weekly: WeeklyHabit[]
}

/**
 * Stellt zusammen, was an einem Tag angezeigt wird.
 * `entries` muss mindestens alle Einträge der Woche des Tages enthalten.
 */
export function planDay(habits: Habit[], entries: Entry[], day: DayKey, dayStartHour: number): DayPlan {
  const scheduled: PlannedHabit[] = []
  const weekly: WeeklyHabit[] = []
  const active = habits
    .filter((h) => !h.deletedAt && h.status === 'active' && existedOn(h, day, dayStartHour))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  for (const habit of active) {
    const entry = entries.find((e) => e.habitId === habit.id && e.day === day && !e.deletedAt)
    const completed = isCompleted(entry)
    if (habit.frequency.kind === 'weekly') {
      const doneThisWeek = weeklyCount(habit, entries, day)
      const times = habit.frequency.times
      // Ist das Wochenziel an einem anderen Tag erreicht worden, verschwindet die Gewohnheit für den Rest der Woche.
      if (doneThisWeek < times || completed) weekly.push({ habit, entry, completed, doneThisWeek, times })
    } else if (isScheduledOn(habit, day)) {
      scheduled.push({ habit, entry, completed })
    }
  }
  return { scheduled, weekly }
}

export const TIME_OF_DAY_ORDER: TimeOfDay[] = ['morning', 'day', 'evening', null]

/** Gruppiert nach Tageszeit in der Reihenfolge Morgen, Tagsüber, Abend, ohne Tageszeit. */
export function groupByTimeOfDay<T extends { habit: Habit }>(items: T[]): { timeOfDay: TimeOfDay; items: T[] }[] {
  return TIME_OF_DAY_ORDER.map((timeOfDay) => ({
    timeOfDay,
    items: items.filter((i) => i.habit.timeOfDay === timeOfDay),
  })).filter((g) => g.items.length > 0)
}
