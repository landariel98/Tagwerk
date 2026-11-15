import { describe, expect, it } from 'vitest'
import { backupFileName, isBackupDue, parseBackup } from './backup'

const DAY = 24 * 60 * 60 * 1000

describe('parseBackup', () => {
  const valid = {
    app: 'tagwerk',
    format: 1,
    exportedAt: 1,
    data: { habits: [{ id: 'a', name: 'Lesen' }], entries: [{ id: 'a_2026-11-15', habitId: 'a', day: '2026-11-15' }], settings: [] },
  }

  it('akzeptiert ein gültiges Backup', () => {
    expect(parseBackup(JSON.stringify(valid)).data.habits).toHaveLength(1)
  })

  it('lehnt kaputtes JSON ab', () => {
    expect(() => parseBackup('{nicht json')).toThrow('gültige JSON-Datei')
  })

  it('lehnt fremde Dateien ab', () => {
    expect(() => parseBackup(JSON.stringify({ foo: 1 }))).toThrow('kein Tagwerk-Backup')
    expect(() => parseBackup('null')).toThrow('kein Tagwerk-Backup')
  })

  it('lehnt Backups aus neueren Versionen ab', () => {
    expect(() => parseBackup(JSON.stringify({ ...valid, format: 99 }))).toThrow('neueren')
  })

  it('akzeptiert Backups mit und ohne Buchungen, lehnt beschädigte Buchungen ab', () => {
    const withLedger = { ...valid, format: 2, data: { ...valid.data, ledger: [{ id: 'habit_a_2026-11-15', xp: 20 }] } }
    expect(parseBackup(JSON.stringify(withLedger)).data.ledger).toHaveLength(1)
    expect(parseBackup(JSON.stringify(valid)).data.ledger).toBeUndefined()
    const broken = { ...valid, format: 2, data: { ...valid.data, ledger: [{ id: 'x' }] } }
    expect(() => parseBackup(JSON.stringify(broken))).toThrow('Buchungen')
  })

  it('lehnt unvollständige und beschädigte Daten ab', () => {
    expect(() => parseBackup(JSON.stringify({ ...valid, data: { habits: [] } }))).toThrow('unvollständig')
    expect(() => parseBackup(JSON.stringify({ ...valid, data: { ...valid.data, habits: [{ id: 1 }] } }))).toThrow('Gewohnheiten')
    expect(() => parseBackup(JSON.stringify({ ...valid, data: { ...valid.data, entries: [{ id: 'x' }] } }))).toThrow('Einträge')
  })
})

describe('isBackupDue', () => {
  const base = { lastBackupAt: null, firstUseAt: 1000, backupReminderDays: 7 }

  it('erinnert erst nach Ablauf der Frist seit dem ersten Start', () => {
    expect(isBackupDue(1000 + 6 * DAY, base)).toBe(false)
    expect(isBackupDue(1000 + 8 * DAY, base)).toBe(true)
  })

  it('zählt ab dem letzten Backup', () => {
    const s = { ...base, lastBackupAt: 1000 + 10 * DAY }
    expect(isBackupDue(1000 + 12 * DAY, s)).toBe(false)
    expect(isBackupDue(1000 + 18 * DAY, s)).toBe(true)
  })

  it('erinnert nicht, solange kein Startzeitpunkt bekannt ist', () => {
    expect(isBackupDue(99 * DAY, { ...base, firstUseAt: 0 })).toBe(false)
  })
})

describe('backupFileName', () => {
  it('enthält das Datum', () => {
    expect(backupFileName(new Date(2026, 10, 5))).toBe('tagwerk-backup-2026-11-05.json')
  })
})
