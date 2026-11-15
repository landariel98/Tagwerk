import { db, type SettingRow } from './db'
import { saveSetting } from './repo'
import { ledgerRowsFromEntries } from '../domain/rewards'
import { mergePoints } from '../domain/settings'
import type { Entry, Habit, LedgerRow, PointSettings } from '../domain/types'

/** Format 1: Etappe 1 (ohne Buchungen). Format 2: mit Buchungen (ledger). */
export const BACKUP_FORMAT = 2

/** Hier merkt sich die App, welche Level schon gefeiert wurden (siehe LevelUp.tsx). */
export const SEEN_LEVELS_KEY = 'tagwerk.levels'

export interface BackupFile {
  app: 'tagwerk'
  format: number
  exportedAt: number
  data: {
    habits: Habit[]
    entries: Entry[]
    settings: SettingRow[]
    /** Fehlt in Backups aus Etappe 1 und wird dann aus den Einträgen nachgebaut. */
    ledger?: LedgerRow[]
  }
}

export async function buildBackup(): Promise<BackupFile> {
  const [habits, entries, settings, ledger] = await Promise.all([
    db.habits.toArray(),
    db.entries.toArray(),
    db.settings.toArray(),
    db.ledger.toArray(),
  ])
  return { app: 'tagwerk', format: BACKUP_FORMAT, exportedAt: Date.now(), data: { habits, entries, settings, ledger } }
}

/** Prüft eine eingelesene Datei und gibt sie typisiert zurück oder wirft eine verständliche Fehlermeldung. */
export function parseBackup(text: string): BackupFile {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('Die Datei ist keine gültige JSON-Datei.')
  }
  const file = raw as Partial<BackupFile>
  if (!file || file.app !== 'tagwerk' || typeof file.format !== 'number' || !file.data) {
    throw new Error('Das ist kein Tagwerk-Backup.')
  }
  if (file.format > BACKUP_FORMAT) {
    throw new Error('Das Backup stammt aus einer neueren Tagwerk-Version. Bitte aktualisiere die App.')
  }
  const { habits, entries, settings } = file.data
  if (!Array.isArray(habits) || !Array.isArray(entries) || !Array.isArray(settings)) {
    throw new Error('Das Backup ist unvollständig.')
  }
  if (habits.some((h) => typeof h?.id !== 'string' || typeof h?.name !== 'string')) {
    throw new Error('Das Backup enthält beschädigte Gewohnheiten.')
  }
  if (entries.some((e) => typeof e?.id !== 'string' || typeof e?.habitId !== 'string' || typeof e?.day !== 'string')) {
    throw new Error('Das Backup enthält beschädigte Einträge.')
  }
  const { ledger } = file.data
  if (ledger !== undefined && (!Array.isArray(ledger) || ledger.some((r) => typeof r?.id !== 'string' || typeof r?.xp !== 'number'))) {
    throw new Error('Das Backup enthält beschädigte Buchungen.')
  }
  return file as BackupFile
}

/** Ersetzt alle Daten durch den Inhalt des Backups. */
export async function restoreBackup(file: BackupFile): Promise<void> {
  const { habits, entries, settings } = file.data
  const storedPoints = settings.find((s) => s.key === 'points')?.value as Partial<PointSettings> | undefined
  const ledger = file.data.ledger ?? ledgerRowsFromEntries(habits, entries, mergePoints(storedPoints), Date.now())

  await db.transaction('rw', db.habits, db.entries, db.settings, db.ledger, async () => {
    await Promise.all([db.habits.clear(), db.entries.clear(), db.settings.clear(), db.ledger.clear()])
    await db.habits.bulkPut(habits)
    await db.entries.bulkPut(entries)
    await db.settings.bulkPut(settings)
    await db.ledger.bulkPut(ledger)
  })
  // Die Level aus dem Backup gelten als bekannt, damit nicht alle Level-ups auf einmal gefeiert werden.
  try {
    localStorage.removeItem(SEEN_LEVELS_KEY)
  } catch {
    // ohne localStorage gibt es nichts zurückzusetzen
  }
}

export function backupFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `tagwerk-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`
}

/**
 * Übergibt das Backup ans Gerät: auf dem iPhone über das Teilen-Menü („In Dateien sichern“),
 * sonst als normaler Download. Gibt false zurück, wenn der Nutzer abbricht.
 */
export async function exportBackup(): Promise<boolean> {
  const backup = await buildBackup()
  const json = JSON.stringify(backup, null, 2)
  const name = backupFileName()
  const file = new File([json], name, { type: 'application/json' })

  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Tagwerk-Backup' })
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return false
      download(file, name)
    }
  } else {
    download(file, name)
  }
  await saveSetting('lastBackupAt', Date.now())
  return true
}

function download(file: File, name: string): void {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Ist ein Backup fällig? Gezählt wird ab dem letzten Backup, sonst ab dem ersten Start. */
export function isBackupDue(
  now: number,
  settings: { lastBackupAt: number | null; firstUseAt: number; backupReminderDays: number },
): boolean {
  const since = settings.lastBackupAt ?? settings.firstUseAt
  if (!since) return false
  return now - since > settings.backupReminderDays * 24 * 60 * 60 * 1000
}
