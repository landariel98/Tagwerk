import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { SEEN_LEVELS_KEY } from '../db/backup'
import { AREAS, areaById } from '../domain/areas'
import { rankForLevel } from '../domain/leveling'
import type { Progress } from '../domain/progress'
import type { AreaId } from '../domain/types'

type Levels = Record<'total' | AreaId, number>

type LevelUpEvent =
  | { kind: 'total'; level: number; newRank: string | null }
  | { kind: 'area'; area: AreaId; level: number }

function readSeen(): Levels | null {
  try {
    const raw = localStorage.getItem(SEEN_LEVELS_KEY)
    return raw ? (JSON.parse(raw) as Levels) : null
  } catch {
    return null
  }
}

function writeSeen(levels: Levels): void {
  try {
    localStorage.setItem(SEEN_LEVELS_KEY, JSON.stringify(levels))
  } catch {
    // ohne localStorage wird höchstens ein Level-up doppelt gefeiert
  }
}

/** Vergleicht die bekannten mit den aktuellen Leveln und liefert die neuen Aufstiege. */
export function levelUpEvents(seen: Levels, now: Levels): LevelUpEvent[] {
  const events: LevelUpEvent[] = []
  if (now.total > seen.total) {
    const before = rankForLevel(seen.total).name
    const after = rankForLevel(now.total).name
    events.push({ kind: 'total', level: now.total, newRank: after !== before ? after : null })
  }
  for (const area of AREAS) {
    if (now[area.id] > seen[area.id]) events.push({ kind: 'area', area: area.id, level: now[area.id] })
  }
  return events
}

/** Beobachtet den Spielstand und zeigt bei einem Aufstieg die Level-up-Animation. */
export function LevelUpWatcher({ progress }: { progress: Progress }) {
  const [queue, setQueue] = useState<LevelUpEvent[]>([])
  const { total, areas } = progress
  const key = [total.level, areas.koerper.level, areas.vitalitaet.level, areas.seele.level, areas.ruhe.level].join('-')

  useEffect(() => {
    const now: Levels = {
      total: total.level,
      koerper: areas.koerper.level,
      vitalitaet: areas.vitalitaet.level,
      seele: areas.seele.level,
      ruhe: areas.ruhe.level,
    }
    const seen = readSeen()
    // Erster Start oder frisch eingespieltes Backup: Stand merken, nichts feiern.
    if (seen) {
      const events = levelUpEvents(seen, now)
      if (events.length > 0) setQueue((q) => [...q, ...events])
    }
    writeSeen(now)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const current = queue[0]
  if (!current) return null
  const dismiss = () => setQueue((q) => q.slice(1))

  const area = current.kind === 'area' ? areaById(current.area) : null
  const color = area ? area.color : 'var(--accent)'

  return createPortal(
    <div
      className="levelup"
      style={{ '--glow': color } as React.CSSProperties}
      role="alertdialog"
      aria-label="Level-up"
      onClick={dismiss}
      key={`${current.kind}-${current.level}-${area?.id ?? ''}`}
    >
      <div className="levelup-rays" aria-hidden />
      <div className="levelup-sparks" aria-hidden>
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>
      <div className="levelup-body">
        <div className="levelup-eyebrow">{area ? `${area.attribute} steigt auf` : 'Level-up'}</div>
        <div className="levelup-badge">
          <span className="levelup-label">Level</span>
          <span className="levelup-num">{current.level}</span>
        </div>
        {current.kind === 'total' && current.newRank && (
          <div className="levelup-rank">
            Neuer Rang: <strong>{current.newRank}</strong>
          </div>
        )}
        {current.kind === 'total' && !current.newRank && <div className="levelup-rank">Stark. Weiter so.</div>}
        {area && <div className="levelup-rank">{area.label}</div>}
        {/* Kein eigener Klick-Handler: Der Tap steigt zum Hintergrund auf und schließt genau eine Anzeige. */}
        <button className="btn btn-primary levelup-btn">Weiter</button>
      </div>
    </div>,
    document.body,
  )
}
