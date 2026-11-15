import { useState } from 'react'
import { savePoints } from '../db/repo'
import { DIFFICULTY_LABELS } from '../domain/areas'
import { DEFAULT_POINTS } from '../domain/rewards'
import type { Difficulty, PointSettings } from '../domain/types'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

interface NumberFieldProps {
  label: string
  value: number
  min: number
  max: number
  onCommit: (value: number) => void
}

/** Zahlenfeld, das erst beim Verlassen speichert und ungültige Eingaben zurücksetzt. */
function NumberField({ label, value, min, max, onCommit }: NumberFieldProps) {
  const [text, setText] = useState<string | null>(null)
  const commit = () => {
    const n = Math.round(Number(text))
    if (text !== null && text.trim() !== '' && Number.isFinite(n)) onCommit(Math.min(max, Math.max(min, n)))
    setText(null)
  }
  return (
    <label className="field field-grow">
      <span>{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={text ?? value}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
    </label>
  )
}

/** Einstellbare Punktwerte. Münzwerte kommen mit dem Shop in Etappe 3 dazu. */
export function PointsCard({ points }: { points: PointSettings }) {
  const isDefault = JSON.stringify(points) === JSON.stringify(DEFAULT_POINTS)

  return (
    <section className="card">
      <h2>Punktwerte</h2>
      <p className="muted">XP pro erledigter Gewohnheit. Änderungen gelten ab dem nächsten Abhaken, bereits Verdientes bleibt.</p>
      <div className="field-row">
        {DIFFICULTIES.map((d) => (
          <NumberField
            key={d}
            label={DIFFICULTY_LABELS[d]}
            value={points.xp[d]}
            min={0}
            max={999}
            onCommit={(v) => savePoints({ ...points, xp: { ...points.xp, [d]: v } })}
          />
        ))}
      </div>
      <NumberField
        label="Mini-Version: Anteil der Punkte in Prozent"
        value={points.miniPercent}
        min={0}
        max={100}
        onCommit={(v) => savePoints({ ...points, miniPercent: v })}
      />
      <button className="btn btn-block" disabled={isDefault} onClick={() => savePoints(DEFAULT_POINTS)}>
        Standardwerte wiederherstellen
      </button>
    </section>
  )
}
