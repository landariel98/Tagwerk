import { useState } from 'react'
import { Chips, Stepper } from '../components/Chips'
import { ConfirmSheet, Sheet } from '../components/Sheet'
import { createHabit, deleteHabit, setHabitStatus, updateHabit, type HabitDraft } from '../db/repo'
import { AREAS, DIFFICULTY_LABELS, TIME_OF_DAY_LABELS, TYPE_LABELS, WEEKDAY_SHORT } from '../domain/areas'
import type { Difficulty, Frequency, Habit, HabitType, TimeOfDay } from '../domain/types'

const EMPTY: HabitDraft = {
  name: '',
  emoji: '⭐',
  area: 'koerper',
  type: 'check',
  target: 1,
  unit: '',
  frequency: { kind: 'daily' },
  timeOfDay: null,
  difficulty: 'medium',
  miniVersion: '',
}

const TYPE_HINTS: Record<HabitType, string> = {
  check: 'Ein Tap, erledigt.',
  counter: 'Zählt bis zu einem Ziel, z. B. 8 Gläser.',
  duration: 'Mit Timer, z. B. 20 Minuten.',
  avoid: 'Etwas, das du lässt. Du bestätigst es am Abend.',
}

function draftFrom(habit: Habit): HabitDraft {
  const { name, emoji, area, type, target, unit, frequency, timeOfDay, difficulty, miniVersion } = habit
  return { name, emoji, area, type, target, unit, frequency, timeOfDay, difficulty, miniVersion }
}

interface Props {
  /** Vorhandene Gewohnheit zum Bearbeiten, null zum Anlegen. */
  habit: Habit | null
  onClose: () => void
}

export function HabitEditor({ habit, onClose }: Props) {
  const [draft, setDraft] = useState<HabitDraft>(() => (habit ? draftFrom(habit) : EMPTY))
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = <K extends keyof HabitDraft>(key: K, value: HabitDraft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const freq = draft.frequency
  const nameOk = draft.name.trim().length > 0
  const targetOk = draft.type === 'check' || draft.type === 'avoid' || (Number.isFinite(draft.target) && draft.target >= 1)
  const daysOk = freq.kind !== 'weekdays' || freq.days.length > 0
  const valid = nameOk && targetOk && daysOk

  const setType = (type: HabitType) =>
    setDraft((d) => ({
      ...d,
      type,
      target: type === 'counter' ? (d.type === 'counter' ? d.target : 8) : type === 'duration' ? (d.type === 'duration' ? d.target : 10) : 1,
    }))

  const setFreqKind = (kind: Frequency['kind']) => {
    if (kind === 'daily') set('frequency', { kind })
    if (kind === 'weekly') set('frequency', { kind, times: 3 })
    if (kind === 'weekdays') set('frequency', { kind, days: [0, 1, 2, 3, 4] })
  }

  const toggleDay = (day: number) => {
    if (freq.kind !== 'weekdays') return
    const days = freq.days.includes(day) ? freq.days.filter((d) => d !== day) : [...freq.days, day].sort()
    set('frequency', { kind: 'weekdays', days })
  }

  const save = async () => {
    if (!valid) return
    const clean: HabitDraft = {
      ...draft,
      name: draft.name.trim(),
      emoji: draft.emoji.trim() || '⭐',
      unit: draft.type === 'counter' ? draft.unit.trim() : '',
      miniVersion: draft.miniVersion.trim(),
      target: draft.type === 'counter' || draft.type === 'duration' ? Math.round(draft.target) : 1,
    }
    if (habit) await updateHabit(habit.id, clean)
    else await createHabit(clean)
    onClose()
  }

  const changeStatus = async (status: Habit['status']) => {
    if (!habit) return
    await setHabitStatus(habit.id, status)
    onClose()
  }

  return (
    <Sheet title={habit ? 'Gewohnheit bearbeiten' : 'Neue Gewohnheit'} onClose={onClose} tall>
      <div className="form">
        <div className="field-row">
          <label className="field field-emoji">
            <span>Symbol</span>
            <input value={draft.emoji} onChange={(e) => set('emoji', e.target.value)} maxLength={8} aria-label="Symbol (Emoji)" />
          </label>
          <label className="field field-grow">
            <span>Name</span>
            <input value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="z. B. 10 min Dehnen" maxLength={60} />
          </label>
        </div>

        <div className="field">
          <span>Bereich</span>
          <Chips
            label="Bereich"
            value={draft.area}
            onChange={(v) => set('area', v)}
            options={AREAS.map((a) => ({ value: a.id, label: a.attribute, color: a.color }))}
          />
          <small className="muted">{AREAS.find((a) => a.id === draft.area)?.label}</small>
        </div>

        <div className="field">
          <span>Art</span>
          <Chips
            label="Art"
            value={draft.type}
            onChange={setType}
            options={(Object.keys(TYPE_LABELS) as HabitType[]).map((t) => ({ value: t, label: TYPE_LABELS[t] }))}
          />
          <small className="muted">{TYPE_HINTS[draft.type]}</small>
        </div>

        {draft.type === 'counter' && (
          <div className="field-row">
            <label className="field field-grow">
              <span>Ziel pro Tag</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={Number.isFinite(draft.target) ? draft.target : ''}
                onChange={(e) => set('target', e.target.valueAsNumber)}
              />
            </label>
            <label className="field field-grow">
              <span>Einheit</span>
              <input value={draft.unit} onChange={(e) => set('unit', e.target.value)} placeholder="z. B. Gläser" maxLength={20} />
            </label>
          </div>
        )}

        {draft.type === 'duration' && (
          <label className="field">
            <span>Ziel in Minuten</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={Number.isFinite(draft.target) ? draft.target : ''}
              onChange={(e) => set('target', e.target.valueAsNumber)}
            />
          </label>
        )}

        <div className="field">
          <span>Häufigkeit</span>
          <Chips
            label="Häufigkeit"
            value={freq.kind}
            onChange={setFreqKind}
            options={[
              { value: 'daily', label: 'Täglich' },
              { value: 'weekly', label: 'X-mal pro Woche' },
              { value: 'weekdays', label: 'Wochentage' },
            ]}
          />
          {freq.kind === 'weekly' && (
            <Stepper
              label="Mal pro Woche"
              value={freq.times}
              min={1}
              max={6}
              suffix="× pro Woche"
              onChange={(times) => set('frequency', { kind: 'weekly', times })}
            />
          )}
          {freq.kind === 'weekdays' && (
            <div className="weekdays" role="group" aria-label="Wochentage">
              {WEEKDAY_SHORT.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={freq.days.includes(i)}
                  className={`weekday${freq.days.includes(i) ? ' weekday-on' : ''}`}
                  onClick={() => toggleDay(i)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {!daysOk && <small className="error">Wähle mindestens einen Wochentag.</small>}
        </div>

        <div className="field">
          <span>Tageszeit (optional)</span>
          <Chips<TimeOfDay>
            label="Tageszeit"
            value={draft.timeOfDay}
            onChange={(v) => set('timeOfDay', v)}
            options={[
              { value: null, label: 'Egal' },
              { value: 'morning', label: TIME_OF_DAY_LABELS.morning },
              { value: 'day', label: TIME_OF_DAY_LABELS.day },
              { value: 'evening', label: TIME_OF_DAY_LABELS.evening },
            ]}
          />
        </div>

        <div className="field">
          <span>Schwierigkeit</span>
          <Chips
            label="Schwierigkeit"
            value={draft.difficulty}
            onChange={(v) => set('difficulty', v)}
            options={(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => ({ value: d, label: DIFFICULTY_LABELS[d] }))}
          />
          <small className="muted">Bestimmt später, wie viele XP und Münzen es gibt.</small>
        </div>

        {draft.type !== 'avoid' && (
          <label className="field">
            <span>Mini-Version für schlechte Tage (optional)</span>
            <input
              value={draft.miniVersion}
              onChange={(e) => set('miniVersion', e.target.value)}
              placeholder="z. B. ein Liegestütz, eine Seite lesen"
              maxLength={80}
            />
          </label>
        )}

        <button className="btn btn-primary btn-block" disabled={!valid} onClick={save}>
          {habit ? 'Speichern' : 'Anlegen'}
        </button>

        {habit && (
          <div className="form-secondary">
            {habit.status === 'active' && (
              <button className="btn btn-block" onClick={() => changeStatus('paused')}>
                Pausieren
              </button>
            )}
            {habit.status !== 'active' && (
              <button className="btn btn-block" onClick={() => changeStatus('active')}>
                Wieder aktivieren
              </button>
            )}
            {habit.status !== 'archived' && (
              <button className="btn btn-block" onClick={() => changeStatus('archived')}>
                Archivieren
              </button>
            )}
            {habit.status === 'archived' && (
              <button className="btn btn-block btn-danger-ghost" onClick={() => setConfirmDelete(true)}>
                Endgültig löschen
              </button>
            )}
            <small className="muted">
              Pausiert: taucht nicht mehr in der Tagesansicht auf, bis du sie wieder aktivierst. Archiviert: abgeschlossen, der Verlauf
              bleibt erhalten.
            </small>
          </div>
        )}
      </div>

      {confirmDelete && habit && (
        <ConfirmSheet
          title="Endgültig löschen?"
          text={`„${habit.name}“ verschwindet aus allen Listen. Das lässt sich nicht rückgängig machen.`}
          confirmLabel="Löschen"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await deleteHabit(habit.id)
            onClose()
          }}
        />
      )}
    </Sheet>
  )
}
