import { describe, expect, it } from 'vitest'
import { DEFAULT_POINTS, habitLedgerRow, ledgerRowsFromEntries, rewardFor, summarizeLedger } from './rewards'
import { mergePoints, mergeSettings } from './settings'
import type { Entry, EntryState, Habit, LedgerRow } from './types'

const habit = (over: Partial<Habit> = {}): Habit => ({
  id: 'h1',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
  name: 'Lesen',
  emoji: '📖',
  area: 'seele',
  type: 'check',
  target: 1,
  unit: '',
  frequency: { kind: 'daily' },
  timeOfDay: null,
  difficulty: 'medium',
  miniVersion: '',
  afterHabitId: null,
  status: 'active',
  sortOrder: 0,
  ...over,
})

const entry = (habitId: string, day: string, state: EntryState): Entry => ({
  id: `${habitId}_${day}`,
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
  habitId,
  day,
  value: state === 'open' ? 0 : 1,
  state,
  completedAt: state === 'open' ? null : 1,
})

const row = (over: Partial<LedgerRow>): LedgerRow => ({
  id: 'r',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
  day: '2026-11-15',
  kind: 'habit',
  reason: '',
  habitId: null,
  area: null,
  xp: 0,
  coins: 0,
  ...over,
})

describe('rewardFor', () => {
  it('vergibt Punkte nach Schwierigkeit', () => {
    expect(rewardFor('easy', 'done', DEFAULT_POINTS)).toEqual({ xp: 10, coins: 5 })
    expect(rewardFor('medium', 'done', DEFAULT_POINTS)).toEqual({ xp: 20, coins: 10 })
    expect(rewardFor('hard', 'done', DEFAULT_POINTS)).toEqual({ xp: 35, coins: 15 })
  })

  it('gibt für die Mini-Version 40 Prozent, gerundet', () => {
    expect(rewardFor('easy', 'mini', DEFAULT_POINTS)).toEqual({ xp: 4, coins: 2 })
    expect(rewardFor('medium', 'mini', DEFAULT_POINTS)).toEqual({ xp: 8, coins: 4 })
    expect(rewardFor('hard', 'mini', DEFAULT_POINTS)).toEqual({ xp: 14, coins: 6 })
  })

  it('gibt für die Mini-Version mindestens einen Punkt', () => {
    const tiny = { ...DEFAULT_POINTS, xp: { easy: 1, medium: 1, hard: 1 }, miniPercent: 10 }
    expect(rewardFor('easy', 'mini', tiny).xp).toBe(1)
  })

  it('gibt nichts für offene Einträge und nichts, wo der Wert 0 ist', () => {
    expect(rewardFor('hard', 'open', DEFAULT_POINTS)).toEqual({ xp: 0, coins: 0 })
    const noCoins = { ...DEFAULT_POINTS, coins: { easy: 0, medium: 0, hard: 0 } }
    expect(rewardFor('easy', 'mini', noCoins).coins).toBe(0)
  })

  it('folgt geänderten Punktwerten', () => {
    const custom = { ...DEFAULT_POINTS, xp: { easy: 12, medium: 25, hard: 50 }, miniPercent: 50 }
    expect(rewardFor('hard', 'done', custom).xp).toBe(50)
    expect(rewardFor('hard', 'mini', custom).xp).toBe(25)
  })
})

describe('Buchungen aus Einträgen', () => {
  it('bucht XP auf das Attribut der Gewohnheit', () => {
    const r = habitLedgerRow(habit(), entry('h1', '2026-11-15', 'done'), DEFAULT_POINTS, 99)
    expect(r).toMatchObject({ id: 'habit_h1_2026-11-15', area: 'seele', xp: 20, coins: 10, state: 'done', day: '2026-11-15' })
  })

  it('erzeugt keine Buchung für offene Einträge', () => {
    expect(habitLedgerRow(habit(), entry('h1', '2026-11-15', 'open'), DEFAULT_POINTS, 99)).toBeNull()
  })

  it('baut alle abgeschlossenen Einträge nach und überspringt Unbekanntes', () => {
    const rows = ledgerRowsFromEntries(
      [habit(), habit({ id: 'h2', area: 'koerper', difficulty: 'hard' })],
      [
        entry('h1', '2026-11-14', 'done'),
        entry('h1', '2026-11-15', 'mini'),
        entry('h2', '2026-11-15', 'done'),
        entry('h2', '2026-11-16', 'open'),
        entry('weg', '2026-11-15', 'done'),
        { ...entry('h1', '2026-11-13', 'done'), deletedAt: 5 },
      ],
      DEFAULT_POINTS,
      99,
    )
    expect(rows.map((r) => [r.id, r.xp])).toEqual([
      ['habit_h1_2026-11-14', 20],
      ['habit_h1_2026-11-15', 8],
      ['habit_h2_2026-11-15', 35],
    ])
  })
})

describe('summarizeLedger', () => {
  it('summiert XP gesamt und je Attribut, Münzen getrennt', () => {
    const s = summarizeLedger([
      row({ area: 'koerper', xp: 35, coins: 15 }),
      row({ area: 'koerper', xp: 10, coins: 5 }),
      row({ area: 'seele', xp: 20, coins: 10 }),
    ])
    expect(s.totalXp).toBe(65)
    expect(s.coins).toBe(30)
    expect(s.xpByArea).toEqual({ koerper: 45, vitalitaet: 0, seele: 20, ruhe: 0 })
  })

  it('zählt Bonus-XP ohne Bereich nur zum Gesamtlevel', () => {
    const s = summarizeLedger([row({ kind: 'bonus', area: null, xp: 20 }), row({ area: 'ruhe', xp: 10 })])
    expect(s.totalXp).toBe(30)
    expect(s.xpByArea.ruhe).toBe(10)
  })

  it('ignoriert zurückgenommene Buchungen', () => {
    expect(summarizeLedger([row({ area: 'ruhe', xp: 10, deletedAt: 3 })]).totalXp).toBe(0)
  })
})

describe('Einstellungen zusammenführen', () => {
  it('nutzt Standardwerte, wenn nichts gespeichert ist', () => {
    expect(mergeSettings({}).points).toEqual(DEFAULT_POINTS)
    expect(mergeSettings({}).dayStartHour).toBe(4)
  })

  it('ergänzt fehlende Punktwerte, ohne gespeicherte zu überschreiben', () => {
    const merged = mergePoints({ xp: { easy: 99 } as never })
    expect(merged.xp).toEqual({ easy: 99, medium: 20, hard: 35 })
    expect(merged.coins).toEqual(DEFAULT_POINTS.coins)
    expect(merged.miniPercent).toBe(40)
  })

  it('übernimmt gespeicherte Einzelwerte', () => {
    expect(mergeSettings({ dayStartHour: 2, lastBackupAt: 7 })).toMatchObject({ dayStartHour: 2, lastBackupAt: 7 })
  })
})
