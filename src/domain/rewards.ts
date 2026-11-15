// Punktwerte und Buchungen: Wie viel XP und Münzen gibt es wofür?
import type { AreaId, DayKey, Difficulty, Entry, EntryState, Habit, LedgerRow, PointSettings } from './types'

export const DEFAULT_POINTS: PointSettings = {
  xp: { easy: 10, medium: 20, hard: 35 },
  coins: { easy: 5, medium: 10, hard: 15 },
  miniPercent: 40,
}

export interface Reward {
  xp: number
  coins: number
}

/** Belohnung für einen Eintrag. Die Mini-Version gibt einen Teil, mindestens aber 1. */
export function rewardFor(difficulty: Difficulty, state: EntryState, points: PointSettings): Reward {
  if (state === 'open') return { xp: 0, coins: 0 }
  const xp = points.xp[difficulty]
  const coins = points.coins[difficulty]
  if (state === 'done') return { xp, coins }
  const part = (value: number) => (value > 0 ? Math.max(1, Math.round((value * points.miniPercent) / 100)) : 0)
  return { xp: part(xp), coins: part(coins) }
}

/** Feste id: pro Gewohnheit und Tag gibt es genau eine Buchung. */
export const habitLedgerId = (habitId: string, day: DayKey): string => `habit_${habitId}_${day}`

export function habitLedgerRow(habit: Habit, entry: Entry, points: PointSettings, now: number): LedgerRow | null {
  const reward = rewardFor(habit.difficulty, entry.state, points)
  if (reward.xp === 0 && reward.coins === 0) return null
  return {
    id: habitLedgerId(habit.id, entry.day),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    day: entry.day,
    kind: 'habit',
    reason: habit.name,
    habitId: habit.id,
    area: habit.area,
    state: entry.state,
    xp: reward.xp,
    coins: reward.coins,
  }
}

/** Baut die Buchungen aus vorhandenen Einträgen nach (für Daten aus Etappe 1 und alte Backups). */
export function ledgerRowsFromEntries(habits: Habit[], entries: Entry[], points: PointSettings, now: number): LedgerRow[] {
  const byId = new Map(habits.map((h) => [h.id, h]))
  const rows: LedgerRow[] = []
  for (const entry of entries) {
    const habit = byId.get(entry.habitId)
    if (!habit || entry.deletedAt) continue
    const row = habitLedgerRow(habit, entry, points, now)
    if (row) rows.push(row)
  }
  return rows
}

export interface LedgerSummary {
  totalXp: number
  coins: number
  xpByArea: Record<AreaId, number>
}

/** Summiert alle gültigen Buchungen. XP ohne Bereich (Boni) zählen nur zum Gesamtlevel. */
export function summarizeLedger(rows: LedgerRow[]): LedgerSummary {
  const summary: LedgerSummary = { totalXp: 0, coins: 0, xpByArea: { koerper: 0, vitalitaet: 0, seele: 0, ruhe: 0 } }
  for (const row of rows) {
    if (row.deletedAt) continue
    summary.totalXp += row.xp
    summary.coins += row.coins
    if (row.area) summary.xpByArea[row.area] += row.xp
  }
  return summary
}
