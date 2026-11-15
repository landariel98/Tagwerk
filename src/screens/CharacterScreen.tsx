import { AREAS } from '../domain/areas'
import { RANKS, TOTAL_CURVE, xpToReachLevel } from '../domain/leveling'
import type { Progress } from '../domain/progress'
import type { AreaId } from '../domain/types'

const nf = new Intl.NumberFormat('de-DE')

/** Reihenfolge der Achsen im Radar: oben, rechts, unten, links. */
const AXES: { id: AreaId; dx: number; dy: number }[] = [
  { id: 'koerper', dx: 0, dy: -1 },
  { id: 'vitalitaet', dx: 1, dy: 0 },
  { id: 'seele', dx: 0, dy: 1 },
  { id: 'ruhe', dx: -1, dy: 0 },
]

function Radar({ progress }: { progress: Progress }) {
  const C = 120
  const R = 82
  // Wert je Achse: Level plus Fortschritt. Die Skala wächst mit dem höchsten Attribut mit.
  const values = AXES.map((a) => progress.areas[a.id].level - 1 + progress.areas[a.id].fraction)
  const scale = Math.max(3, Math.ceil(Math.max(...values)) + 1)
  const point = (i: number, f: number) => `${C + AXES[i].dx * R * f},${C + AXES[i].dy * R * f}`
  const ring = (f: number) => AXES.map((_, i) => point(i, f)).join(' ')
  const shape = values.map((v, i) => point(i, Math.max(0.06, v / scale))).join(' ')
  const summary = AXES.map((a) => `${AREAS.find((x) => x.id === a.id)!.attribute} Level ${progress.areas[a.id].level}`).join(', ')

  return (
    <svg viewBox="-40 0 320 240" className="radar" role="img" aria-label={`Attribute: ${summary}`}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={ring(f)} className="radar-grid" />
      ))}
      {AXES.map((_, i) => (
        <line key={i} x1={C} y1={C} x2={C + AXES[i].dx * R} y2={C + AXES[i].dy * R} className="radar-grid" />
      ))}
      <polygon points={shape} className="radar-shape" />
      {AXES.map((a, i) => {
        const area = AREAS.find((x) => x.id === a.id)!
        const f = Math.max(0.06, values[i] / scale)
        return (
          <g key={a.id}>
            <circle cx={C + a.dx * R * f} cy={C + a.dy * R * f} r="5" fill={area.color} />
            <text
              x={C + a.dx * (R + 12)}
              y={C + a.dy * (R + 20) + 4}
              textAnchor={a.dx === 0 ? 'middle' : a.dx > 0 ? 'start' : 'end'}
              className="radar-label"
              fill={area.color}
            >
              {area.attribute}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function CharacterScreen({ progress }: { progress: Progress }) {
  const { total, rank, nextRank } = progress
  const xpToNextRank = nextRank ? xpToReachLevel(nextRank.fromLevel, TOTAL_CURVE) - progress.totalXp : 0

  return (
    <div className="screen">
      <header className="plain-head">
        <h1>Charakter</h1>
      </header>

      <section className="card hero">
        <div className="hero-level" aria-hidden>
          <span className="hero-level-label">Level</span>
          <span className="hero-level-num">{total.level}</span>
        </div>
        <div className="hero-text">
          <div className="eyebrow">Rang</div>
          <h2>{rank.name}</h2>
          <div className="xpbar" aria-hidden>
            <span style={{ width: `${total.fraction * 100}%` }} />
          </div>
          <p className="muted small">
            {nf.format(total.into)} / {nf.format(total.needed)} XP bis Level {total.level + 1}
          </p>
        </div>
      </section>

      <section className="card">
        <h2>Attribute</h2>
        <Radar progress={progress} />
        <div className="attrs">
          {AREAS.map((area) => {
            const info = progress.areas[area.id]
            return (
              <div key={area.id} className="attr" style={{ '--area': area.color } as React.CSSProperties}>
                <div className="attr-head">
                  <span className="attr-name">{area.attribute}</span>
                  <span className="attr-level">Level {info.level}</span>
                </div>
                <div className="attr-bar" aria-hidden>
                  <span style={{ width: `${info.fraction * 100}%` }} />
                </div>
                <div className="attr-foot muted">
                  <span>{area.label}</span>
                  <span>
                    {nf.format(info.into)} / {nf.format(info.needed)} XP
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card">
        <h2>Ränge</h2>
        <p className="muted">
          {nextRank
            ? `Noch ${nf.format(xpToNextRank)} XP bis „${nextRank.name}“ (Level ${nextRank.fromLevel}).`
            : 'Du hast den höchsten Rang erreicht.'}
        </p>
        <ol className="ranks">
          {RANKS.map((r) => {
            const reached = total.level >= r.fromLevel
            const current = r.name === rank.name
            return (
              <li key={r.name} className={`rank${reached ? ' rank-reached' : ''}${current ? ' rank-current' : ''}`}>
                <span className="rank-dot" aria-hidden>
                  {reached ? '✓' : ''}
                </span>
                <span className="rank-name">{r.name}</span>
                <span className="muted">ab Level {r.fromLevel}</span>
              </li>
            )
          })}
        </ol>
        <p className="muted small">Gesamt gesammelt: {nf.format(progress.totalXp)} XP. XP gehen nie verloren.</p>
      </section>
    </div>
  )
}
