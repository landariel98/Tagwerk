// Fenster, die sich aus der Tagesansicht öffnen: Timer, Wert eintragen, weitere Aktionen.
import { useState } from 'react'
import { Sheet } from '../components/Sheet'
import { addValue, markMini, resetEntry, setValue } from '../db/repo'
import { formatClock } from '../domain/describe'
import { targetValue } from '../domain/frequency'
import type { DayKey, Entry, Habit } from '../domain/types'
import { useNow } from '../hooks/useData'
import { discardTimer, elapsedSeconds, startTimer, stopTimer, useRunningTimer } from '../hooks/timer'

interface Common {
  habit: Habit
  entry: Entry | undefined
  day: DayKey
  onClose: () => void
}

export function TimerSheet({ habit, entry, day, onClose }: Common) {
  const timer = useRunningTimer()
  const now = useNow(1000)
  const running = timer?.habitId === habit.id && timer.day === day
  const saved = entry?.value ?? 0
  const total = saved + (running && timer ? elapsedSeconds(timer, now) : 0)
  const target = targetValue(habit)
  const reached = total >= target
  const fraction = Math.min(1, total / target)
  const R = 88
  const C = 2 * Math.PI * R

  return (
    <Sheet title={`${habit.emoji} ${habit.name}`} onClose={onClose}>
      <div className="timer">
        <svg viewBox="0 0 200 200" className="timer-ring" aria-hidden>
          <circle cx="100" cy="100" r={R} className="timer-track" />
          <circle
            cx="100"
            cy="100"
            r={R}
            className={`timer-progress${reached ? ' timer-reached' : ''}`}
            strokeDasharray={C}
            strokeDashoffset={C * (1 - fraction)}
            transform="rotate(-90 100 100)"
          />
        </svg>
        <div className="timer-center">
          <div className="timer-time" role="timer">
            {formatClock(total)}
          </div>
          <div className="muted">{reached ? 'Ziel erreicht' : `Ziel: ${habit.target} min`}</div>
        </div>
      </div>

      {running ? (
        <button className="btn btn-primary btn-block" onClick={() => stopTimer()}>
          Pause
        </button>
      ) : (
        <button className="btn btn-primary btn-block" onClick={() => startTimer(habit.id, day)}>
          {saved > 0 ? 'Weiter' : 'Start'}
        </button>
      )}

      <div className="btn-row">
        <button
          className="btn"
          disabled={reached}
          onClick={async () => {
            if (running) discardTimer()
            await setValue(habit, day, target)
            onClose()
          }}
        >
          Als erledigt markieren
        </button>
        <button
          className="btn"
          disabled={total === 0}
          onClick={async () => {
            if (running) discardTimer()
            await resetEntry(habit, day)
          }}
        >
          Zurücksetzen
        </button>
      </div>
      <small className="muted">
        Der Timer läuft weiter, auch wenn du die App schließt oder das Handy sperrst. Klingeln kann er auf dem iPhone nicht.
      </small>
    </Sheet>
  )
}

export function ValueSheet({ habit, entry, day, onClose }: Common) {
  const [text, setText] = useState(entry?.value ? String(entry.value) : '')
  const value = Number(text)
  const valid = text.trim() !== '' && Number.isFinite(value) && value >= 0

  return (
    <Sheet title={`${habit.emoji} ${habit.name}`} onClose={onClose}>
      <label className="field">
        <span>
          Heutiger Stand ({habit.unit || 'Anzahl'}), Ziel {new Intl.NumberFormat('de-DE').format(habit.target)}
        </span>
        <input type="number" inputMode="numeric" min={0} autoFocus value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <button
        className="btn btn-primary btn-block"
        disabled={!valid}
        onClick={async () => {
          await setValue(habit, day, Math.round(value))
          onClose()
        }}
      >
        Speichern
      </button>
    </Sheet>
  )
}

interface ActionsProps extends Common {
  completed: boolean
  onEdit: () => void
  onEnterValue: () => void
}

export function ActionsSheet({ habit, entry, day, completed, onClose, onEdit, onEnterValue }: ActionsProps) {
  const timer = useRunningTimer()
  const hasProgress = (entry?.value ?? 0) > 0 || completed
  const run = (action: () => Promise<void>) => async () => {
    await action()
    onClose()
  }

  return (
    <Sheet title={`${habit.emoji} ${habit.name}`} onClose={onClose}>
      <div className="actions">
        {habit.type !== 'avoid' && !completed && (
          <button className="action" onClick={run(() => markMini(habit, day))}>
            <span className="action-title">Mini-Version gemacht</span>
            <span className="muted">{habit.miniVersion || 'Die 2-Minuten-Version, damit die Gewohnheit nicht abreißt.'}</span>
          </button>
        )}
        {habit.type === 'counter' && (
          <button
            className="action"
            onClick={() => {
              onClose()
              onEnterValue()
            }}
          >
            <span className="action-title">Wert eintragen</span>
          </button>
        )}
        {habit.type === 'counter' && (entry?.value ?? 0) > 0 && (
          <button className="action" onClick={run(() => addValue(habit, day, -1))}>
            <span className="action-title">Einen abziehen</span>
          </button>
        )}
        {hasProgress && (
          <button
            className="action"
            onClick={run(async () => {
              if (timer?.habitId === habit.id && timer.day === day) discardTimer()
              await resetEntry(habit, day)
            })}
          >
            <span className="action-title">Zurücksetzen</span>
            <span className="muted">Setzt den Stand für diesen Tag auf null.</span>
          </button>
        )}
        <button
          className="action"
          onClick={() => {
            onClose()
            onEdit()
          }}
        >
          <span className="action-title">Bearbeiten</span>
          <span className="muted">Name, Ziel, Häufigkeit, pausieren oder archivieren.</span>
        </button>
      </div>
    </Sheet>
  )
}
