import { describe, expect, it } from 'vitest'
import { addDays, logicalDay, toDayKey, weekDays, weekStart, weekdayIndex } from './dates'

describe('logicalDay (Tageswechsel)', () => {
  it('zählt die Zeit vor dem Tageswechsel zum Vortag', () => {
    expect(logicalDay(new Date(2026, 10, 16, 1, 30), 4)).toBe('2026-11-15')
    expect(logicalDay(new Date(2026, 10, 16, 3, 59), 4)).toBe('2026-11-15')
  })

  it('beginnt den neuen Tag genau zur Tageswechsel-Stunde', () => {
    expect(logicalDay(new Date(2026, 10, 16, 4, 0), 4)).toBe('2026-11-16')
    expect(logicalDay(new Date(2026, 10, 16, 23, 59), 4)).toBe('2026-11-16')
  })

  it('verhält sich bei Tageswechsel 0 Uhr wie der Kalendertag', () => {
    expect(logicalDay(new Date(2026, 10, 16, 0, 0), 0)).toBe('2026-11-16')
    expect(logicalDay(new Date(2026, 10, 15, 23, 59), 0)).toBe('2026-11-15')
  })

  it('springt über Monats- und Jahresgrenzen zurück', () => {
    expect(logicalDay(new Date(2026, 11, 1, 2, 0), 4)).toBe('2026-11-30')
    expect(logicalDay(new Date(2027, 0, 1, 0, 30), 4)).toBe('2026-12-31')
  })
})

describe('Tagesrechnung', () => {
  it('addiert Tage über Monats- und Jahresgrenzen', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('bleibt über die Zeitumstellung stabil', () => {
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29')
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30')
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26')
  })

  it('formatiert Tage mit führenden Nullen', () => {
    expect(toDayKey(new Date(2026, 0, 5, 12))).toBe('2026-01-05')
  })
})

describe('Wochenrechnung', () => {
  it('nummeriert Wochentage ab Montag', () => {
    expect(weekdayIndex('2026-11-16')).toBe(0) // Montag
    expect(weekdayIndex('2026-11-15')).toBe(6) // Sonntag
    expect(weekdayIndex('2026-11-18')).toBe(2) // Mittwoch
  })

  it('findet den Montag der Woche', () => {
    expect(weekStart('2026-11-15')).toBe('2026-11-09')
    expect(weekStart('2026-11-16')).toBe('2026-11-16')
    expect(weekStart('2027-01-01')).toBe('2026-12-28')
  })

  it('liefert Montag bis Sonntag', () => {
    const days = weekDays('2026-11-12')
    expect(days).toHaveLength(7)
    expect(days[0]).toBe('2026-11-09')
    expect(days[6]).toBe('2026-11-15')
  })
})
