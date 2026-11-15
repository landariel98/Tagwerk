import { describe, expect, it } from 'vitest'
import {
  ATTRIBUTE_CURVE,
  RANKS,
  TOTAL_CURVE,
  levelFromXp,
  nextRank,
  rankForLevel,
  xpForNextLevel,
  xpToReachLevel,
} from './leveling'

describe('XP-Kurve', () => {
  it('wird pro Level um einen festen Betrag teurer', () => {
    expect(xpForNextLevel(1, TOTAL_CURVE)).toBe(50)
    expect(xpForNextLevel(2, TOTAL_CURVE)).toBe(75)
    expect(xpForNextLevel(10, TOTAL_CURVE)).toBe(275)
    expect(xpForNextLevel(1, ATTRIBUTE_CURVE)).toBe(30)
    expect(xpForNextLevel(3, ATTRIBUTE_CURVE)).toBe(60)
  })

  it('summiert die XP bis zu einem Level', () => {
    expect(xpToReachLevel(1, TOTAL_CURVE)).toBe(0)
    expect(xpToReachLevel(2, TOTAL_CURVE)).toBe(50)
    expect(xpToReachLevel(5, TOTAL_CURVE)).toBe(350)
    expect(xpToReachLevel(10, TOTAL_CURVE)).toBe(1350)
    expect(xpToReachLevel(20, TOTAL_CURVE)).toBe(5225)
    expect(xpToReachLevel(50, TOTAL_CURVE)).toBe(31850)
  })
})

describe('levelFromXp', () => {
  it('startet bei Level 1 ohne Fortschritt', () => {
    expect(levelFromXp(0, TOTAL_CURVE)).toEqual({ level: 1, into: 0, needed: 50, fraction: 0 })
  })

  it('steigt genau an der Schwelle auf', () => {
    expect(levelFromXp(49, TOTAL_CURVE).level).toBe(1)
    expect(levelFromXp(50, TOTAL_CURVE)).toEqual({ level: 2, into: 0, needed: 75, fraction: 0 })
    expect(levelFromXp(124, TOTAL_CURVE).level).toBe(2)
    expect(levelFromXp(125, TOTAL_CURVE).level).toBe(3)
  })

  it('berechnet den Fortschritt innerhalb des Levels', () => {
    const info = levelFromXp(80, TOTAL_CURVE)
    expect(info).toMatchObject({ level: 2, into: 30, needed: 75 })
    expect(info.fraction).toBeCloseTo(0.4)
  })

  it('passt zu xpToReachLevel', () => {
    for (const level of [2, 7, 13, 30, 50]) {
      const xp = xpToReachLevel(level, TOTAL_CURVE)
      expect(levelFromXp(xp, TOTAL_CURVE).level).toBe(level)
      expect(levelFromXp(xp - 1, TOTAL_CURVE).level).toBe(level - 1)
    }
  })

  it('überspringt mehrere Level bei viel XP auf einmal', () => {
    expect(levelFromXp(1350, TOTAL_CURVE).level).toBe(10)
  })

  it('behandelt negative und krumme Werte robust', () => {
    expect(levelFromXp(-20, TOTAL_CURVE).level).toBe(1)
    expect(levelFromXp(50.9, TOTAL_CURVE)).toMatchObject({ level: 2, into: 0 })
  })

  it('nutzt für Attribute die flachere Kurve', () => {
    expect(levelFromXp(30, ATTRIBUTE_CURVE).level).toBe(2)
    expect(levelFromXp(210, ATTRIBUTE_CURVE).level).toBe(5)
  })
})

describe('Ränge', () => {
  it('ordnet jedem Level den passenden Rang zu', () => {
    expect(rankForLevel(1).name).toBe('Anfänger')
    expect(rankForLevel(4).name).toBe('Anfänger')
    expect(rankForLevel(5).name).toBe('Fortgeschrittener')
    expect(rankForLevel(10).name).toBe('Routinier')
    expect(rankForLevel(29).name).toBe('Profi')
    expect(rankForLevel(30).name).toBe('Experte')
    expect(rankForLevel(99).name).toBe('Meister')
  })

  it('nennt den nächsten Rang', () => {
    expect(nextRank(1)?.name).toBe('Fortgeschrittener')
    expect(nextRank(5)?.name).toBe('Routinier')
    expect(nextRank(50)).toBeNull()
  })

  it('ist aufsteigend sortiert', () => {
    const levels = RANKS.map((r) => r.fromLevel)
    expect(levels).toEqual([...levels].sort((a, b) => a - b))
  })
})
