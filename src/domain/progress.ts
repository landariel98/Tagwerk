import { ATTRIBUTE_CURVE, TOTAL_CURVE, levelFromXp, nextRank, rankForLevel, type LevelInfo, type Rank } from './leveling'
import type { LedgerSummary } from './rewards'
import type { AreaId } from './types'

/** Alles, was die Oberfläche über den Spielstand wissen muss. */
export interface Progress {
  totalXp: number
  total: LevelInfo
  rank: Rank
  nextRank: Rank | null
  areas: Record<AreaId, LevelInfo & { xp: number }>
}

export function progressFromSummary(summary: LedgerSummary): Progress {
  const total = levelFromXp(summary.totalXp, TOTAL_CURVE)
  const area = (id: AreaId) => ({ ...levelFromXp(summary.xpByArea[id], ATTRIBUTE_CURVE), xp: summary.xpByArea[id] })
  return {
    totalXp: summary.totalXp,
    total,
    rank: rankForLevel(total.level),
    nextRank: nextRank(total.level),
    areas: { koerper: area('koerper'), vitalitaet: area('vitalitaet'), seele: area('seele'), ruhe: area('ruhe') },
  }
}
