import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { db } from '../db/db'
import { loadSettings } from '../db/repo'
import { addDays, logicalDay, weekDays } from '../domain/dates'
import type { DayKey, Entry, Habit, Settings } from '../domain/types'

/** Aktuelle Uhrzeit, die sich regelmäßig und beim Zurückkehren in die App aktualisiert. */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const timer = setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('focus', tick)
    }
  }, [intervalMs])
  return now
}

export function useSettings(): Settings | undefined {
  return useLiveQuery(loadSettings, [])
}

/** Heutiger und gestriger Tag unter Berücksichtigung des Tageswechsels. */
export function useToday(settings: Settings | undefined): { today: DayKey; yesterday: DayKey } | undefined {
  const now = useNow(30_000)
  if (!settings) return undefined
  const today = logicalDay(new Date(now), settings.dayStartHour)
  return { today, yesterday: addDays(today, -1) }
}

/** Alle nicht gelöschten Gewohnheiten, sortiert. */
export function useHabits(): Habit[] | undefined {
  return useLiveQuery(async () => {
    const all = await db.habits.toArray()
    return all.filter((h) => !h.deletedAt).sort((a, b) => a.sortOrder - b.sortOrder)
  }, [])
}

/** Einträge der Woche, in der der Tag liegt. */
export function useWeekEntries(day: DayKey | undefined): Entry[] | undefined {
  return useLiveQuery(async () => {
    if (!day) return []
    const days = weekDays(day)
    return db.entries.where('day').between(days[0], days[6], true, true).toArray()
  }, [day])
}
