import { describe, expect, it } from 'vitest'
import {
  groupByTimeOfDay,
  isCompleted,
  isScheduledOn,
  planDay,
  stateForValue,
  targetValue,
  weeklyCount,
} from './frequency'
import type { Entry, EntryState, Habit } from './types'

// 2026-11-09 ist ein Montag, 2026-11-15 ein Sonntag.
const CREATED = new Date(2026, 10, 1, 12).getTime()

function habit(over: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    createdAt: CREATED,
    updatedAt: CREATED,
    deletedAt: null,
    name: 'Test',
    emoji: '✅',
    area: 'koerper',
    type: 'check',
    target: 1,
    unit: '',
    frequency: { kind: 'daily' },
    timeOfDay: null,
    difficulty: 'easy',
    miniVersion: '',
    afterHabitId: null,
    status: 'active',
    sortOrder: 0,
    ...over,
  }
}

function entry(habitId: string, day: string, state: EntryState = 'done', value = 1): Entry {
  return {
    id: `${habitId}_${day}`,
    createdAt: CREATED,
    updatedAt: CREATED,
    deletedAt: null,
    habitId,
    day,
    value,
    state,
    completedAt: state === 'open' ? null : CREATED,
  }
}

describe('isScheduledOn', () => {
  it('plant tägliche Gewohnheiten jeden Tag', () => {
    expect(isScheduledOn(habit(), '2026-11-09')).toBe(true)
    expect(isScheduledOn(habit(), '2026-11-15')).toBe(true)
  })

  it('plant Wochentags-Gewohnheiten nur an den gewählten Tagen', () => {
    const h = habit({ frequency: { kind: 'weekdays', days: [0, 2, 4] } }) // Mo, Mi, Fr
    expect(isScheduledOn(h, '2026-11-09')).toBe(true) // Mo
    expect(isScheduledOn(h, '2026-11-10')).toBe(false) // Di
    expect(isScheduledOn(h, '2026-11-11')).toBe(true) // Mi
    expect(isScheduledOn(h, '2026-11-15')).toBe(false) // So
  })

  it('plant X-mal-pro-Woche nie fest ein', () => {
    const h = habit({ frequency: { kind: 'weekly', times: 3 } })
    expect(isScheduledOn(h, '2026-11-09')).toBe(false)
  })
})

describe('Zielwert und Zustand', () => {
  it('rechnet Dauer-Ziele in Sekunden um', () => {
    expect(targetValue(habit({ type: 'duration', target: 20 }))).toBe(1200)
    expect(targetValue(habit({ type: 'counter', target: 8 }))).toBe(8)
    expect(targetValue(habit({ type: 'check' }))).toBe(1)
  })

  it('setzt „erledigt“, sobald das Ziel erreicht ist', () => {
    const water = habit({ type: 'counter', target: 8 })
    expect(stateForValue(water, 7)).toBe('open')
    expect(stateForValue(water, 8)).toBe('done')
    expect(stateForValue(water, 9)).toBe('done')
  })

  it('behält die Mini-Version, bis das volle Ziel erreicht ist', () => {
    const water = habit({ type: 'counter', target: 8 })
    expect(stateForValue(water, 3, 'mini')).toBe('mini')
    expect(stateForValue(water, 8, 'mini')).toBe('done')
  })

  it('wertet erledigt und Mini als abgeschlossen', () => {
    expect(isCompleted(entry('h1', '2026-11-09', 'done'))).toBe(true)
    expect(isCompleted(entry('h1', '2026-11-09', 'mini'))).toBe(true)
    expect(isCompleted(entry('h1', '2026-11-09', 'open'))).toBe(false)
    expect(isCompleted(undefined)).toBe(false)
  })
})

describe('weeklyCount', () => {
  const h = habit({ frequency: { kind: 'weekly', times: 3 } })

  it('zählt nur abgeschlossene Einträge der laufenden Woche', () => {
    const entries = [
      entry('h1', '2026-11-08'), // Sonntag der Vorwoche
      entry('h1', '2026-11-09'),
      entry('h1', '2026-11-11', 'mini'),
      entry('h1', '2026-11-12', 'open', 0),
      entry('h1', '2026-11-16'), // Montag der Folgewoche
      entry('anderes', '2026-11-10'),
    ]
    expect(weeklyCount(h, entries, '2026-11-13')).toBe(2)
  })
})

describe('planDay', () => {
  const daily = habit({ id: 'daily', sortOrder: 1 })
  const monWed = habit({ id: 'monwed', sortOrder: 2, frequency: { kind: 'weekdays', days: [0, 2] } })
  const weekly = habit({ id: 'weekly', sortOrder: 3, frequency: { kind: 'weekly', times: 2 } })

  it('trennt fest geplante und Wochen-Gewohnheiten', () => {
    const plan = planDay([daily, monWed, weekly], [], '2026-11-09', 4)
    expect(plan.scheduled.map((p) => p.habit.id)).toEqual(['daily', 'monwed'])
    expect(plan.weekly.map((p) => p.habit.id)).toEqual(['weekly'])
    expect(plan.weekly[0]).toMatchObject({ doneThisWeek: 0, times: 2, completed: false })
  })

  it('lässt Wochentags-Gewohnheiten an freien Tagen weg', () => {
    const plan = planDay([daily, monWed], [], '2026-11-10', 4)
    expect(plan.scheduled.map((p) => p.habit.id)).toEqual(['daily'])
  })

  it('blendet Wochen-Gewohnheiten aus, sobald das Wochenziel erreicht ist', () => {
    const entries = [entry('weekly', '2026-11-09'), entry('weekly', '2026-11-10')]
    expect(planDay([weekly], entries, '2026-11-11', 4).weekly).toHaveLength(0)
  })

  it('zeigt die Wochen-Gewohnheit am Tag des Erreichens weiter an', () => {
    const entries = [entry('weekly', '2026-11-09'), entry('weekly', '2026-11-10')]
    const plan = planDay([weekly], entries, '2026-11-10', 4)
    expect(plan.weekly).toHaveLength(1)
    expect(plan.weekly[0]).toMatchObject({ completed: true, doneThisWeek: 2 })
  })

  it('startet das Wochenziel am Montag neu', () => {
    const entries = [entry('weekly', '2026-11-09'), entry('weekly', '2026-11-10')]
    const plan = planDay([weekly], entries, '2026-11-16', 4)
    expect(plan.weekly[0]).toMatchObject({ doneThisWeek: 0, completed: false })
  })

  it('zeigt pausierte, archivierte und gelöschte Gewohnheiten nicht', () => {
    const plan = planDay(
      [
        habit({ id: 'p', status: 'paused' }),
        habit({ id: 'a', status: 'archived' }),
        habit({ id: 'd', deletedAt: CREATED }),
      ],
      [],
      '2026-11-09',
      4,
    )
    expect(plan.scheduled).toHaveLength(0)
  })

  it('zeigt eine Gewohnheit nicht an Tagen vor ihrem Anlegen', () => {
    const fresh = habit({ id: 'neu', createdAt: new Date(2026, 10, 10, 9).getTime() })
    expect(planDay([fresh], [], '2026-11-09', 4).scheduled).toHaveLength(0)
    expect(planDay([fresh], [], '2026-11-10', 4).scheduled).toHaveLength(1)
  })

  it('rechnet eine nach Mitternacht angelegte Gewohnheit dem Vortag zu', () => {
    const night = habit({ id: 'nacht', createdAt: new Date(2026, 10, 10, 1).getTime() })
    expect(planDay([night], [], '2026-11-09', 4).scheduled).toHaveLength(1)
  })

  it('verknüpft den Eintrag des Tages', () => {
    const plan = planDay([daily], [entry('daily', '2026-11-09')], '2026-11-09', 4)
    expect(plan.scheduled[0].completed).toBe(true)
    expect(planDay([daily], [entry('daily', '2026-11-09')], '2026-11-10', 4).scheduled[0].completed).toBe(false)
  })
})

describe('groupByTimeOfDay', () => {
  it('sortiert Morgen, Tagsüber, Abend, ohne Tageszeit und lässt leere Gruppen weg', () => {
    const items = [
      { habit: habit({ id: 'x', timeOfDay: null }) },
      { habit: habit({ id: 'e', timeOfDay: 'evening' }) },
      { habit: habit({ id: 'm', timeOfDay: 'morning' }) },
    ]
    const groups = groupByTimeOfDay(items)
    expect(groups.map((g) => g.timeOfDay)).toEqual(['morning', 'evening', null])
    expect(groups[0].items[0].habit.id).toBe('m')
  })
})
