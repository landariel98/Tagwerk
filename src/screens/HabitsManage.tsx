import { useState } from 'react'
import { Sheet } from '../components/Sheet'
import { areaById } from '../domain/areas'
import { describeFrequency } from '../domain/describe'
import type { Habit, HabitStatus } from '../domain/types'
import { HabitEditor } from './HabitEditor'

const GROUPS: { status: HabitStatus; title: string }[] = [
  { status: 'active', title: 'Aktiv' },
  { status: 'paused', title: 'Pausiert' },
  { status: 'archived', title: 'Archiviert' },
]

interface Props {
  habits: Habit[]
  onClose: () => void
  onAdd: () => void
}

/** Liste aller Gewohnheiten zum Bearbeiten, Pausieren und Archivieren. */
export function HabitsManage({ habits, onClose, onAdd }: Props) {
  const [editing, setEditing] = useState<Habit | null>(null)

  return (
    <Sheet title="Gewohnheiten" onClose={onClose} tall>
      {habits.length === 0 && <p className="muted">Noch keine Gewohnheiten angelegt.</p>}

      {GROUPS.map(({ status, title }) => {
        const list = habits.filter((h) => h.status === status)
        if (list.length === 0) return null
        return (
          <section key={status} className="manage-group">
            <h3>
              {title} <span className="muted">· {list.length}</span>
            </h3>
            {list.map((h) => (
              <button key={h.id} className="manage-row" onClick={() => setEditing(h)}>
                <span className="habit-emoji" style={{ borderColor: areaById(h.area).color }}>
                  {h.emoji}
                </span>
                <span className="tpl-text">
                  <span className="tpl-name">{h.name}</span>
                  <span className="muted">
                    {areaById(h.area).attribute} · {describeFrequency(h)}
                  </span>
                </span>
                <span className="muted" aria-hidden>
                  ›
                </span>
              </button>
            ))}
          </section>
        )
      })}

      <div className="sheet-footer">
        <button className="btn btn-primary btn-block" onClick={onAdd}>
          Gewohnheit hinzufügen
        </button>
      </div>

      {editing && <HabitEditor habit={editing} onClose={() => setEditing(null)} />}
    </Sheet>
  )
}
