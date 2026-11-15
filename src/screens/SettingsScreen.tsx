import { useEffect, useRef, useState } from 'react'
import { ConfirmSheet } from '../components/Sheet'
import { exportBackup, parseBackup, restoreBackup, type BackupFile } from '../db/backup'
import { saveSetting } from '../db/repo'
import { formatDateTime } from '../domain/dates'
import type { Habit, Settings } from '../domain/types'
import { HabitEditor } from './HabitEditor'
import { HabitsManage } from './HabitsManage'
import { TemplatePicker } from './TemplatePicker'

interface Props {
  habits: Habit[]
  settings: Settings
}

type Open = 'manage' | 'templates' | 'new' | null

export function SettingsScreen({ habits, settings }: Props) {
  const [open, setOpen] = useState<Open>(null)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const [pending, setPending] = useState<BackupFile | null>(null)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted, () => setPersisted(null))
  }, [])

  const doExport = async () => {
    try {
      const done = await exportBackup()
      setMessage(done ? { text: 'Backup erstellt.' } : null)
    } catch {
      setMessage({ text: 'Das Backup konnte nicht erstellt werden.', error: true })
    }
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setPending(parseBackup(await file.text()))
      setMessage(null)
    } catch (err) {
      setMessage({ text: (err as Error).message, error: true })
    }
  }

  const doImport = async () => {
    if (!pending) return
    try {
      await restoreBackup(pending)
      setMessage({ text: 'Backup eingespielt.' })
    } catch {
      setMessage({ text: 'Das Backup konnte nicht eingespielt werden. Deine bisherigen Daten sind unverändert.', error: true })
    }
    setPending(null)
  }

  const active = habits.filter((h) => h.status === 'active').length

  return (
    <div className="screen">
      <header className="plain-head">
        <h1>Einstellungen</h1>
      </header>

      <section className="card">
        <h2>Gewohnheiten</h2>
        <p className="muted">
          {habits.length === 0 ? 'Noch keine angelegt.' : `${active} aktiv, ${habits.length - active} pausiert oder archiviert.`}
        </p>
        <button className="btn btn-block" onClick={() => setOpen('manage')}>
          Gewohnheiten verwalten
        </button>
        <button className="btn btn-block" onClick={() => setOpen('templates')}>
          Aus Vorlagen hinzufügen
        </button>
      </section>

      <section className="card">
        <h2>Tageswechsel</h2>
        <p className="muted">Bis zu dieser Uhrzeit zählt Abhaken nach Mitternacht noch zum Vortag.</p>
        <label className="field">
          <span>Neuer Tag beginnt um</span>
          <select value={settings.dayStartHour} onChange={(e) => saveSetting('dayStartHour', Number(e.target.value))}>
            {[0, 1, 2, 3, 4, 5, 6].map((h) => (
              <option key={h} value={h}>
                {h}:00 Uhr
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="card" id="backup">
        <h2>Backup</h2>
        <p className="muted">
          Deine Daten liegen nur auf diesem Gerät. Sichere sie regelmäßig als Datei, zum Beispiel in iCloud Drive.
        </p>
        <p>
          Letztes Backup: <strong>{settings.lastBackupAt ? formatDateTime(settings.lastBackupAt) : 'noch keines'}</strong>
        </p>
        <button className="btn btn-primary btn-block" onClick={doExport}>
          Backup erstellen
        </button>
        <button className="btn btn-block" onClick={() => fileInput.current?.click()}>
          Backup einspielen
        </button>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onFile} />
        {message && (
          <p className={message.error ? 'error' : 'ok'} role="status">
            {message.text}
          </p>
        )}
        <label className="field">
          <span>An Backup erinnern nach</span>
          <select value={settings.backupReminderDays} onChange={(e) => saveSetting('backupReminderDays', Number(e.target.value))}>
            {[3, 7, 14, 30].map((d) => (
              <option key={d} value={d}>
                {d} Tagen
              </option>
            ))}
          </select>
        </label>
        {persisted !== null && (
          <small className="muted">
            {persisted
              ? 'Der Speicher ist geschützt: Das System löscht die Daten nicht von selbst.'
              : 'Der Speicher ist nicht dauerhaft geschützt. Installiere die App auf dem Home-Bildschirm und mach regelmäßig Backups.'}
          </small>
        )}
      </section>

      <section className="card">
        <h2>Über</h2>
        <p className="muted">Tagwerk {__APP_VERSION__} · Etappe 1</p>
      </section>

      {open === 'manage' && <HabitsManage habits={habits} onClose={() => setOpen(null)} onAdd={() => setOpen('templates')} />}
      {open === 'templates' && <TemplatePicker existing={habits} onClose={() => setOpen(null)} onCustom={() => setOpen('new')} />}
      {open === 'new' && <HabitEditor habit={null} onClose={() => setOpen(null)} />}

      {pending && (
        <ConfirmSheet
          title="Backup einspielen?"
          text={`Das Backup vom ${formatDateTime(pending.exportedAt)} enthält ${pending.data.habits.filter((h) => !h.deletedAt).length} Gewohnheiten und ${pending.data.entries.length} Einträge. Alle Daten auf diesem Gerät werden dadurch ersetzt.`}
          confirmLabel="Ersetzen"
          danger
          onCancel={() => setPending(null)}
          onConfirm={doImport}
        />
      )}
    </div>
  )
}
