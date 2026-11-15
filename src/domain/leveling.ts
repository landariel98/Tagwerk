// Level, Ränge und XP-Kurven. Reine Rechenlogik ohne Datenbank.

export interface Curve {
  /** XP für den Schritt von Level 1 auf 2. */
  base: number
  /** Um so viel wird jedes weitere Level teurer. */
  step: number
}

/** Gesamtlevel: 50, 75, 100 … XP pro Level. */
export const TOTAL_CURVE: Curve = { base: 50, step: 25 }
/** Attribut-Level: flacher, weil nur ein Teil der XP in jedes Attribut fließt. */
export const ATTRIBUTE_CURVE: Curve = { base: 30, step: 15 }

/** XP, die man auf diesem Level für das nächste braucht. */
export function xpForNextLevel(level: number, curve: Curve): number {
  return curve.base + curve.step * (level - 1)
}

/** XP, die insgesamt nötig sind, um dieses Level zu erreichen (Level 1 = 0). */
export function xpToReachLevel(level: number, curve: Curve): number {
  const n = level - 1
  return n * curve.base + (curve.step * n * (n - 1)) / 2
}

export interface LevelInfo {
  level: number
  /** XP, die auf dem aktuellen Level schon gesammelt sind. */
  into: number
  /** XP, die das aktuelle Level insgesamt verlangt. */
  needed: number
  /** Fortschritt zum nächsten Level, 0 bis 1. */
  fraction: number
}

export function levelFromXp(xp: number, curve: Curve): LevelInfo {
  let level = 1
  let rest = Math.max(0, Math.floor(xp))
  while (rest >= xpForNextLevel(level, curve)) {
    rest -= xpForNextLevel(level, curve)
    level++
  }
  const needed = xpForNextLevel(level, curve)
  return { level, into: rest, needed, fraction: rest / needed }
}

export interface Rank {
  name: string
  /** Ab diesem Gesamtlevel gilt der Rang. */
  fromLevel: number
}

export const RANKS: Rank[] = [
  { name: 'Anfänger', fromLevel: 1 },
  { name: 'Fortgeschrittener', fromLevel: 5 },
  { name: 'Routinier', fromLevel: 10 },
  { name: 'Profi', fromLevel: 20 },
  { name: 'Experte', fromLevel: 30 },
  { name: 'Meister', fromLevel: 50 },
]

export function rankForLevel(level: number): Rank {
  return [...RANKS].reverse().find((r) => level >= r.fromLevel) ?? RANKS[0]
}

/** Der nächste Rang oder null, wenn der höchste erreicht ist. */
export function nextRank(level: number): Rank | null {
  return RANKS.find((r) => r.fromLevel > level) ?? null
}
