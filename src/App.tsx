import { useEffect, useRef, useState } from 'react'
import { ensureFirstUse } from './db/repo'
import { useHabits, useSettings, useToday } from './hooks/useData'
import { PlaceholderScreen } from './screens/PlaceholderScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { TodayScreen } from './screens/TodayScreen'

/** Die fünf Bereiche der unteren Navigation. */
type Tab = 'today' | 'character' | 'shop' | 'stats' | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Heute', icon: 'M5 12.5l4.5 4.5L19 7.5' },
  { id: 'character', label: 'Charakter', icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8c0-3.5 3.1-6 7-6s7 2.500 7 6' },
  { id: 'shop', label: 'Shop', icon: 'M4 8h16l-1.500 11h-13L4 8zm4 0a4 4 0 018 0' },
  { id: 'stats', label: 'Statistik', icon: 'M5 20V11m7 9V4m7 16v-6' },
  { id: 'settings', label: 'Einstellungen', icon: 'M4 7h16M4 12h16M4 17h16' },
]

export function App() {
  const [tab, setTab] = useState<Tab>('today')
  const settings = useSettings()
  const habits = useHabits()
  const days = useToday(settings)
  const contentRef = useRef<HTMLElement>(null)

  useEffect(() => {
    void ensureFirstUse()
    // Bittet das System, die Daten nicht von selbst zu löschen.
    void navigator.storage?.persist?.().catch(() => undefined)
  }, [])

  // Jeder Bereich beginnt oben, statt die Scrollposition des vorigen zu übernehmen.
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0)
  }, [tab])

  const ready = settings && habits && days

  return (
    <div className="app">
      <main className="content" ref={contentRef}>
        {ready && tab === 'today' && (
          <TodayScreen
            habits={habits}
            settings={settings}
            today={days.today}
            yesterday={days.yesterday}
            onOpenBackup={() => setTab('settings')}
          />
        )}
        {tab === 'character' && (
          <PlaceholderScreen title="Charakter" stage={2} text="Level, XP, die vier Attribute Körper, Vitalität, Seele und Ruhe sowie deine Ränge." />
        )}
        {tab === 'shop' && <PlaceholderScreen title="Shop" stage={3} text="Münzen, eigene Belohnungen, Sparziele und Boni." />}
        {tab === 'stats' && <PlaceholderScreen title="Statistik" stage={4} text="Heatmaps, Erfüllungsquoten und der Verlauf deiner Attribute." />}
        {ready && tab === 'settings' && <SettingsScreen habits={habits} settings={settings} />}
      </main>

      <nav className="tabbar" aria-label="Hauptnavigation">
        {TABS.map((t) => (
          <button key={t.id} className={`tab${tab === t.id ? ' tab-on' : ''}`} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d={t.icon} />
            </svg>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
