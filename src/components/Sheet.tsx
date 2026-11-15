import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface SheetProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** Füllt fast den ganzen Bildschirm (für Formulare). */
  tall?: boolean
}

/** Von unten einfahrendes Fenster. Schließt beim Tippen auf den Hintergrund. */
export function Sheet({ title, onClose, children, tall }: SheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Portal: So liegen auch verschachtelte Fenster sauber über allem anderen.
  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className={`sheet${tall ? ' sheet-tall' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Schließen">
            ✕
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

interface ConfirmProps {
  title: string
  text: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmSheet({ title, text, confirmLabel, danger, onConfirm, onCancel }: ConfirmProps) {
  return (
    <Sheet title={title} onClose={onCancel}>
      <p className="muted">{text}</p>
      <div className="btn-row">
        <button className="btn" onClick={onCancel}>
          Abbrechen
        </button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  )
}
