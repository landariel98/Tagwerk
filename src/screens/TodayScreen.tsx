import { useState } from 'react'
import { addValue, toggleDone } from '../db/repo'
import { isBackupDue } from '../db/backup'
import { TIME_OF_DAY_LABELS } from '../domain/areas'
import { formatDayLong } from '../domain/dates'
import { groupByTimeOfDay, planDay, type PlannedHabit } from '../domain/frequency'
import type { Progress } from '../domain/progress'
import { rewardFor } from '../domain/rewards'
import type { DayKey, Habit, Settings } from '../domain/types'
import { useNow, useWeekEntries } from '../hooks/useData'
import { elapsedSeconds, useRunningTimer } from '../hooks/timer'
import { HabitEditor } from './HabitEditor'
import { HabitRow } from './HabitRow'
import { ActionsSheet, TimerSheet, ValueSheet } from './HabitSheets'
import { TemplatePicker } from './TemplatePicker'

/** Zähler mit kleinem Ziel werden per Tap hochgezählt, große Ziele (z. B. Schritte) per Eingabe. */
const TAP_COUNTER_MAX = 20

type Open = { kind: 'timer' | 'value' | 'actions' | 'edit'; habitId: string } | { kind: 'new' } | { kind: 'templates' } | null

interface Props {
  habits: Habit[]
  settings: Settings
  today: DayKey
  yesterday: DayKey
  progress: Progress
  onOpenBackup: () => void
  onOpenCharacter: () => void
}

const nf = new Intl.NumberFormat('de-DE')

export function TodayScreen({ habits, settings, today, yesterday, progress, onOpenBackup, onOpenCharacter }: Props) {
  const [showYesterday, setShowYesterday] = useState(false)
  const [open, setOpen] = useState<Open>(null)
  const [celebrating, setCelebrating] = useState<string | null>(null)
  const day = showYesterday ? yesterday : today
  const entries = useWeekEntries(day)
  const timer = useRunningTimer()
  const now = useNow(timer ? 1000 : 60_000)

  if (!entries) return null

  const plan = planDay(habits, entries, day, settings.dayStartHour)
  const groups = groupByTimeOfDay(plan.scheduled)
  const doneCount = plan.scheduled.filter((p) => p.completed).length
  const total = plan.scheduled.length
  const allDone = total > 0 && doneCount === total
  const hasHabits = habits.some((h) => h.status === 'active')
  const backupDue = habits.length > 0 && isBackupDue(now, settings)

  const liveSeconds = (habit: Habit) =>
    timer && timer.habitId === habit.id && timer.day === day ? elapsedSeconds(timer, now) : 0

  const celebrate = (habitId: string) => {
    setCelebrating(habitId)
    setTimeout(() => setCelebrating((c) => (c === habitId ? null : c)), 1100)
  }

  const tap = async ({ habit, completed }: PlannedHabit) => {
    switch (habit.type) {
      case 'check':
      case 'avoid':
        if (!completed) celebrate(habit.id)
        await toggleDone(habit, day)
        break
      case 'counter':
        if (habit.target > TAP_COUNTER_MAX) setOpen({ kind: 'value', habitId: habit.id })
        else if (!completed) {
          const entry = entries.find((e) => e.habitId === habit.id && e.day === day)
          if ((entry?.value ?? 0) + 1 >= habit.target) celebrate(habit.id)
          await addValue(habit, day, 1)
        }
        break
      case 'duration':
        setOpen({ kind: 'timer', habitId: habit.id })
        break
    }
  }

  const row = (p: PlannedHabit, badge?: string) => (
    <HabitRow
      key={p.habit.id}
      habit={p.habit}
      entry={p.entry}
      completed={p.completed}
      liveSeconds={liveSeconds(p.habit)}
      celebrate={celebrating === p.habit.id}
      gainXp={rewardFor(p.habit.difficulty, 'done', settings.points).xp}
      badge={badge}
      onTap={() => tap(p)}
      onMore={() => setOpen({ kind: 'actions', habitId: p.habit.id })}
    />
  )

  const openHabit = open && 'habitId' in open ? habits.find((h) => h.id === open.habitId) : undefined
  const openEntry = openHabit ? entries.find((e) => e.habitId === openHabit.id && e.day === day && !e.deletedAt) : undefined
  const close = () => setOpen(null)

  return (
    <div className="screen">
      <header className="today-head">
        <button className="levelbar" onClick={onOpenCharacter} aria-label={`Level ${progress.total.level}, ${progress.rank.name}. Charakter öffnen`}>
          <span className="levelbar-badge" aria-hidden>
            {progress.total.level}
          </span>
          <span className="levelbar-text">
            <span className="levelbar-top">
              <strong>{progress.rank.name}</strong>
              <span className="muted">
                {nf.format(progress.total.into)} / {nf.format(progress.total.needed)} XP
              </span>
            </span>
            <span className="xpbar" aria-hidden>
              <span style={{ width: `${progress.total.fraction * 100}%` }} />
            </span>
          </span>
        </button>

        <div className="today-top">
          <div>
            <div className="eyebrow">{showYesterday ? 'Gestern' : 'Heute'}</div>
            <h1>{formatDayLong(day)}</h1>
          </div>
          <div className="segmented" role="tablist" aria-label="Tag wählen">
            <button role="tab" aria-selected={showYesterday} className={showYesterday ? 'on' : ''} onClick={() => setShowYesterday(true)}>
              Gestern
            </button>
            <button role="tab" aria-selected={!showYesterday} className={!showYesterday ? 'on' : ''} onClick={() => setShowYesterday(false)}>
              Heute
            </button>
          </div>
        </div>

        {total > 0 && (
          <div className="day-progress">
            <div className="day-progress-bar" aria-hidden>
              <span style={{ width: `${(doneCount / total) * 100}%` }} className={allDone ? 'full' : ''} />
            </div>
            <span className="day-progress-text">
              {allDone ? 'Alles geschafft' : `${doneCount} von ${total} erledigt`}
            </span>
          </div>
        )}
      </header>

      {showYesterday && <p className="note">Du trägst für gestern nach. Vergessenes kannst du hier noch abhaken.</p>}

      {backupDue && !showYesterday && (
        <button className="banner" onClick={onOpenBackup}>
          <span>
            <strong>Zeit für ein Backup.</strong> {settings.lastBackupAt ? 'Dein letztes ist schon länger her.' : 'Du hast noch keines gemacht.'}
          </span>
          <span aria-hidden>›</span>
        </button>
      )}

      {!hasHabits && (
        <div className="empty">
          <div className="empty-icon" aria-hidden>
            🌱
          </div>
          <h2>Noch keine Gewohnheiten</h2>
          <p className="muted">Such dir ein paar aus den Vorlagen aus oder leg eine eigene an.</p>
          <button className="btn btn-primary" onClick={() => setOpen({ kind: 'templates' })}>
            Aus Vorlagen wählen
          </button>
          <button className="btn" onClick={() => setOpen({ kind: 'new' })}>
            Eigene anlegen
          </button>
        </div>
      )}

      {hasHabits && total === 0 && plan.weekly.length === 0 && (
        <p className="note">Für diesen Tag ist nichts geplant.</p>
      )}

      {groups.map((g) => (
        <section key={g.timeOfDay ?? 'any'} className="group">
          <h2 className="group-title">{g.timeOfDay ? TIME_OF_DAY_LABELS[g.timeOfDay] : 'Jederzeit'}</h2>
          {g.items.map((p) => row(p))}
        </section>
      ))}

      {plan.weekly.length > 0 && (
        <section className="group">
          <h2 className="group-title">
            Diese Woche <span className="muted">· freiwillig heute</span>
          </h2>
          {plan.weekly.map((p) => row(p, `${p.doneThisWeek}/${p.times}`))}
        </section>
      )}

      {hasHabits && (
        <button className="fab" onClick={() => setOpen({ kind: 'templates' })} aria-label="Gewohnheit hinzufügen">
          +
        </button>
      )}

      {open?.kind === 'timer' && openHabit && <TimerSheet habit={openHabit} entry={openEntry} day={day} onClose={close} />}
      {open?.kind === 'value' && openHabit && <ValueSheet habit={openHabit} entry={openEntry} day={day} onClose={close} />}
      {open?.kind === 'actions' && openHabit && (
        <ActionsSheet
          habit={openHabit}
          entry={openEntry}
          day={day}
          completed={openEntry?.state === 'done' || openEntry?.state === 'mini'}
          onClose={close}
          onEdit={() => setOpen({ kind: 'edit', habitId: openHabit.id })}
          onEnterValue={() => setOpen({ kind: 'value', habitId: openHabit.id })}
        />
      )}
      {open?.kind === 'edit' && openHabit && <HabitEditor habit={openHabit} onClose={close} />}
      {open?.kind === 'new' && <HabitEditor habit={null} onClose={close} />}
      {open?.kind === 'templates' && <TemplatePicker existing={habits} onClose={close} onCustom={() => setOpen({ kind: 'new' })} />}
    </div>
  )
}
