import type { Habit } from './types'

/** Vorlage: alle inhaltlichen Felder einer Gewohnheit, ohne Verwaltungsdaten. */
export type HabitTemplate = Pick<
  Habit,
  'name' | 'emoji' | 'area' | 'type' | 'target' | 'unit' | 'frequency' | 'timeOfDay' | 'difficulty' | 'miniVersion'
> & { key: string; preselected?: boolean }

const daily = { kind: 'daily' } as const

export const TEMPLATES: HabitTemplate[] = [
  // Sport & Bewegung
  { key: 'training', name: 'Training', emoji: '🏋️', area: 'koerper', type: 'check', target: 1, unit: '', frequency: { kind: 'weekly', times: 3 }, timeOfDay: null, difficulty: 'hard', miniVersion: 'Ein Satz Liegestütze', preselected: true },
  { key: 'rad', name: 'Radfahren', emoji: '🚴', area: 'koerper', type: 'check', target: 1, unit: '', frequency: { kind: 'weekly', times: 2 }, timeOfDay: null, difficulty: 'medium', miniVersion: 'Einmal um den Block' },
  { key: 'schritte', name: 'Schritte-Ziel', emoji: '👟', area: 'koerper', type: 'counter', target: 8000, unit: 'Schritte', frequency: daily, timeOfDay: 'evening', difficulty: 'medium', miniVersion: '5 Minuten gehen' },
  { key: 'dehnen', name: 'Dehnen / Mobility', emoji: '🧘', area: 'koerper', type: 'duration', target: 10, unit: '', frequency: daily, timeOfDay: 'morning', difficulty: 'easy', miniVersion: 'Eine Dehnübung' },
  { key: 'spaziergang', name: 'Spaziergang', emoji: '🚶', area: 'koerper', type: 'check', target: 1, unit: '', frequency: daily, timeOfDay: 'day', difficulty: 'easy', miniVersion: 'Kurz vor die Tür', preselected: true },

  // Ernährung & Trinken
  { key: 'wasser', name: 'Wasser trinken', emoji: '💧', area: 'vitalitaet', type: 'counter', target: 8, unit: 'Gläser', frequency: daily, timeOfDay: 'day', difficulty: 'easy', miniVersion: 'Ein Glas Wasser', preselected: true },
  { key: 'obst', name: 'Obst / Gemüse', emoji: '🥦', area: 'vitalitaet', type: 'counter', target: 3, unit: 'Portionen', frequency: daily, timeOfDay: 'day', difficulty: 'easy', miniVersion: 'Ein Stück Obst' },
  { key: 'gekocht', name: 'Selbst gekocht', emoji: '🍳', area: 'vitalitaet', type: 'check', target: 1, unit: '', frequency: { kind: 'weekly', times: 4 }, timeOfDay: 'evening', difficulty: 'medium', miniVersion: 'Etwas Einfaches selbst zubereitet' },
  { key: 'suesskram', name: 'Kein Süßkram / Energy-Drink', emoji: '🚫', area: 'vitalitaet', type: 'avoid', target: 1, unit: '', frequency: daily, timeOfDay: 'evening', difficulty: 'medium', miniVersion: '' },
  { key: 'fruehstueck', name: 'Ordentlich gefrühstückt', emoji: '🥣', area: 'vitalitaet', type: 'check', target: 1, unit: '', frequency: daily, timeOfDay: 'morning', difficulty: 'easy', miniVersion: 'Wenigstens eine Kleinigkeit' },

  // Me-Time
  { key: 'musik', name: 'Musik machen', emoji: '🎸', area: 'seele', type: 'duration', target: 20, unit: '', frequency: { kind: 'weekly', times: 3 }, timeOfDay: null, difficulty: 'medium', miniVersion: '2 Minuten spielen' },
  { key: 'lesen', name: 'Lesen', emoji: '📖', area: 'seele', type: 'duration', target: 15, unit: '', frequency: daily, timeOfDay: 'evening', difficulty: 'medium', miniVersion: 'Eine Seite lesen', preselected: true },
  { key: 'natur', name: 'Zeit in der Natur', emoji: '🌲', area: 'seele', type: 'check', target: 1, unit: '', frequency: { kind: 'weekly', times: 2 }, timeOfDay: null, difficulty: 'medium', miniVersion: '5 Minuten an die frische Luft' },
  { key: 'zocken', name: 'Bewusst gezockt', emoji: '🎮', area: 'seele', type: 'check', target: 1, unit: '', frequency: { kind: 'weekly', times: 2 }, timeOfDay: null, difficulty: 'easy', miniVersion: '' },
  { key: 'freunde', name: 'Zeit mit Freunden', emoji: '🫂', area: 'seele', type: 'check', target: 1, unit: '', frequency: { kind: 'weekly', times: 1 }, timeOfDay: null, difficulty: 'medium', miniVersion: 'Jemandem schreiben oder anrufen' },
  { key: 'gutedinge', name: '3 gute Dinge aufschreiben', emoji: '✨', area: 'seele', type: 'check', target: 1, unit: '', frequency: daily, timeOfDay: 'evening', difficulty: 'easy', miniVersion: 'Ein gutes Ding', preselected: true },

  // Schlaf & Handy-Detox
  { key: 'bett', name: 'Vor 23 Uhr im Bett', emoji: '🛏️', area: 'ruhe', type: 'check', target: 1, unit: '', frequency: daily, timeOfDay: 'evening', difficulty: 'medium', miniVersion: '' },
  { key: 'abendhandy', name: '30 min vor dem Schlafen kein Handy', emoji: '🌙', area: 'ruhe', type: 'avoid', target: 1, unit: '', frequency: daily, timeOfDay: 'evening', difficulty: 'medium', miniVersion: '', preselected: true },
  { key: 'morgenhandy', name: 'Erste Stunde ohne Handy', emoji: '🌅', area: 'ruhe', type: 'avoid', target: 1, unit: '', frequency: daily, timeOfDay: 'morning', difficulty: 'hard', miniVersion: '' },
  { key: 'handyfrei', name: 'Handyfreier Block', emoji: '📵', area: 'ruhe', type: 'duration', target: 60, unit: '', frequency: daily, timeOfDay: 'day', difficulty: 'medium', miniVersion: '10 Minuten ohne Handy' },
  { key: 'feierabend', name: 'Feierabend pünktlich gemacht', emoji: '🏁', area: 'ruhe', type: 'check', target: 1, unit: '', frequency: { kind: 'weekdays', days: [0, 1, 2, 3, 4] }, timeOfDay: 'evening', difficulty: 'medium', miniVersion: '' },
]
