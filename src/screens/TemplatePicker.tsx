import { useState } from 'react'
import { Sheet } from '../components/Sheet'
import { createHabitsFromTemplates } from '../db/repo'
import { AREAS } from '../domain/areas'
import { describeFrequency } from '../domain/describe'
import { TEMPLATES } from '../domain/templates'
import type { Habit } from '../domain/types'

interface Props {
  /** Bereits vorhandene Gewohnheiten, damit Vorlagen nicht doppelt angelegt werden. */
  existing: Habit[]
  onClose: () => void
  onCustom: () => void
}

export function TemplatePicker({ existing, onClose, onCustom }: Props) {
  const existingNames = new Set(existing.map((h) => h.name))
  const isFirstRun = existing.length === 0
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(isFirstRun ? TEMPLATES.filter((t) => t.preselected).map((t) => t.key) : []),
  )

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const add = async () => {
    await createHabitsFromTemplates(TEMPLATES.filter((t) => selected.has(t.key)))
    onClose()
  }

  const total = existing.filter((h) => h.status === 'active').length + selected.size

  return (
    <Sheet title="Vorlagen" onClose={onClose} tall>
      <p className="muted">
        Fang lieber mit wenigen an (etwa 5 bis 7) und bau später aus. Alles lässt sich danach anpassen.
      </p>

      {AREAS.map((area) => (
        <section key={area.id} className="tpl-area">
          <h3 style={{ color: area.color }}>
            {area.attribute} <span className="muted">· {area.label}</span>
          </h3>
          {TEMPLATES.filter((t) => t.area === area.id).map((t) => {
            const taken = existingNames.has(t.name)
            const on = selected.has(t.key)
            return (
              <button
                key={t.key}
                type="button"
                className={`tpl${on ? ' tpl-on' : ''}`}
                disabled={taken}
                aria-pressed={on}
                onClick={() => toggle(t.key)}
              >
                <span className="tpl-emoji">{t.emoji}</span>
                <span className="tpl-text">
                  <span className="tpl-name">{t.name}</span>
                  <span className="muted">{taken ? 'Schon angelegt' : describeFrequency(t)}</span>
                </span>
                <span className={`tpl-check${on ? ' tpl-check-on' : ''}`} aria-hidden>
                  {on ? '✓' : ''}
                </span>
              </button>
            )
          })}
        </section>
      ))}

      <div className="sheet-footer">
        {total > 7 && <small className="warn">Das wären {total} aktive Gewohnheiten. Weniger ist am Anfang mehr.</small>}
        <button className="btn btn-primary btn-block" disabled={selected.size === 0} onClick={add}>
          {selected.size === 0 ? 'Vorlagen auswählen' : `${selected.size} hinzufügen`}
        </button>
        <button className="btn btn-block" onClick={onCustom}>
          Eigene Gewohnheit anlegen
        </button>
      </div>
    </Sheet>
  )
}
