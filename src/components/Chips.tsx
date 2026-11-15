interface ChipsProps<T> {
  options: { value: T; label: string; color?: string }[]
  value: T
  onChange: (value: T) => void
  label: string
}

/** Auswahl einer Option aus wenigen, als große Tipp-Flächen. */
export function Chips<T extends string | number | null>({ options, value, onChange, label }: ChipsProps<T>) {
  return (
    <div className="chips" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={`chip${o.value === value ? ' chip-on' : ''}`}
          style={o.color && o.value === value ? { borderColor: o.color, color: o.color } : undefined}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

interface StepperProps {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  label: string
  suffix?: string
}

export function Stepper({ value, min, max, onChange, label, suffix }: StepperProps) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" className="stepper-btn" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="Weniger">
        −
      </button>
      <span className="stepper-value">
        {value}
        {suffix ? ` ${suffix}` : ''}
      </span>
      <button type="button" className="stepper-btn" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="Mehr">
        +
      </button>
    </div>
  )
}
