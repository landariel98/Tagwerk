import { DEFAULT_POINTS } from './rewards'
import type { PointSettings, Settings } from './types'

export const DEFAULT_SETTINGS: Settings = {
  dayStartHour: 4,
  firstUseAt: 0,
  lastBackupAt: null,
  backupReminderDays: 7,
  points: DEFAULT_POINTS,
}

/** Füllt gespeicherte Punktwerte mit Standardwerten auf, falls neue Felder dazugekommen sind. */
export function mergePoints(stored: Partial<PointSettings> | undefined): PointSettings {
  return {
    ...DEFAULT_POINTS,
    ...stored,
    xp: { ...DEFAULT_POINTS.xp, ...stored?.xp },
    coins: { ...DEFAULT_POINTS.coins, ...stored?.coins },
  }
}

/** Setzt gespeicherte Einzelwerte und Standardwerte zu vollständigen Einstellungen zusammen. */
export function mergeSettings(stored: Record<string, unknown>): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...(stored as Partial<Settings>),
    points: mergePoints(stored.points as Partial<PointSettings> | undefined),
  }
}
