// Laufender Timer für Dauer-Gewohnheiten.
// Gespeichert wird nur der Startzeitpunkt. Die verstrichene Zeit ergibt sich aus der Uhr,
// deshalb läuft der Timer auch weiter, wenn die App geschlossen oder das Handy gesperrt ist.
import { useSyncExternalStore } from 'react'
import { db } from '../db/db'
import { addValue } from '../db/repo'
import type { DayKey } from '../domain/types'

export interface RunningTimer {
  habitId: string
  day: DayKey
  startedAt: number
}

const STORAGE_KEY = 'tagwerk.timer'
const listeners = new Set<() => void>()
let current: RunningTimer | null = read()

function read(): RunningTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as RunningTimer) : null
  } catch {
    return null
  }
}

function write(timer: RunningTimer | null): void {
  current = timer
  try {
    if (timer) localStorage.setItem(STORAGE_KEY, JSON.stringify(timer))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ohne localStorage läuft der Timer nur, solange die App offen ist.
  }
  listeners.forEach((l) => l())
}

export function useRunningTimer(): RunningTimer | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => current,
  )
}

export const elapsedSeconds = (timer: RunningTimer, now: number): number =>
  Math.max(0, Math.floor((now - timer.startedAt) / 1000))

/** Hält den laufenden Timer an und schreibt die Zeit dem Eintrag gut. */
export async function stopTimer(): Promise<void> {
  const timer = current
  if (!timer) return
  write(null)
  const habit = await db.habits.get(timer.habitId)
  const seconds = elapsedSeconds(timer, Date.now())
  if (habit && seconds > 0) await addValue(habit, timer.day, seconds)
}

/** Startet einen Timer. Ein anderer laufender Timer wird vorher angehalten und gutgeschrieben. */
export async function startTimer(habitId: string, day: DayKey): Promise<void> {
  await stopTimer()
  write({ habitId, day, startedAt: Date.now() })
}

/** Verwirft den laufenden Timer, ohne Zeit gutzuschreiben. */
export function discardTimer(): void {
  write(null)
}
