import { areaById } from '../domain/areas'
import { describeProgress } from '../domain/describe'
import { targetValue } from '../domain/frequency'
import type { Entry, Habit } from '../domain/types'

interface Props {
  habit: Habit
  entry: Entry | undefined
  completed: boolean
  /** Sekunden eines gerade laufenden Timers für diese Gewohnheit. */
  liveSeconds: number
  /** Spielt die Abhak-Animation ab (nur direkt nach dem Tippen). */
  celebrate: boolean
  /** XP, die beim Erledigen gutgeschrieben werden (für die „+XP“-Einblendung). */
  gainXp: number
  /** Zusatz hinter dem Namen, z. B. „2/3 diese Woche“. */
  badge?: string
  onTap: () => void
  onMore: () => void
}

export function HabitRow({ habit, entry, completed, liveSeconds, celebrate, gainXp, badge, onTap, onMore }: Props) {
  const area = areaById(habit.area)
  const sub = describeProgress(habit, entry, liveSeconds)
  const showBar = habit.type === 'counter' || habit.type === 'duration'
  const fraction = showBar ? Math.min(1, ((entry?.value ?? 0) + liveSeconds) / targetValue(habit)) : 0
  const mini = entry?.state === 'mini'

  return (
    <div
      className={`habit${completed ? ' habit-done' : ''}${celebrate ? ' habit-celebrate' : ''}`}
      style={{ '--area': area.color } as React.CSSProperties}
    >
      <button className="habit-main" onClick={onTap} aria-pressed={completed} aria-label={`${habit.name}${sub ? `, ${sub}` : ''}`}>
        <span className="habit-emoji" aria-hidden>
          {habit.emoji}
        </span>
        <span className="habit-text">
          <span className="habit-name">
            {habit.name}
            {badge && <span className="habit-badge">{badge}</span>}
          </span>
          {sub && <span className="habit-sub">{sub}</span>}
          {showBar && (
            <span className="habit-bar" aria-hidden>
              <span style={{ width: `${fraction * 100}%` }} />
            </span>
          )}
        </span>
        <span className={`habit-check${completed ? ' habit-check-on' : ''}${mini ? ' habit-check-mini' : ''}`} aria-hidden>
          {completed ? (mini ? '½' : '✓') : habit.type === 'duration' ? (liveSeconds > 0 ? '❚❚' : '▶') : habit.type === 'counter' ? '+' : ''}
        </span>
      </button>
      {celebrate && gainXp > 0 && (
        <span className="habit-gain" aria-hidden>
          +{gainXp} XP
        </span>
      )}
      <button className="habit-more" onClick={onMore} aria-label={`Mehr zu ${habit.name}`}>
        ⋯
      </button>
    </div>
  )
}
