interface Props {
  title: string
  stage: number
  text: string
}

/** Platzhalter für Bereiche, die in einer späteren Etappe gebaut werden. */
export function PlaceholderScreen({ title, stage, text }: Props) {
  return (
    <div className="screen">
      <header className="plain-head">
        <h1>{title}</h1>
      </header>
      <div className="empty">
        <div className="empty-icon" aria-hidden>
          🔒
        </div>
        <h2>Kommt in Etappe {stage}</h2>
        <p className="muted">{text}</p>
      </div>
    </div>
  )
}
