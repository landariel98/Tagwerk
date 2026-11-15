# Tagwerk

Persönliche Habit-App als PWA: Gewohnheiten aufbauen, aufleveln, belohnen. Alle Daten bleiben lokal auf dem Gerät (IndexedDB).

## Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver starten |
| `npm test` | Tests ausführen |
| `npm run build` | Typprüfung und Produktions-Build nach `dist/` |
| `npm run preview` | Den Build lokal ansehen (mit Service Worker) |
| `npm run icons` | Icons und iOS-Startbilder aus `public/icon.svg` neu erzeugen |

## Aufbau

- `src/domain/` – reine Logik ohne Oberfläche und Datenbank (Datum, Häufigkeiten, Vorlagen). Hier liegen die Tests.
- `src/db/` – Datenbank (Dexie), alle Schreibzugriffe (`repo.ts`) und Backup (`backup.ts`).
- `src/hooks/` – Datenzugriff für die Oberfläche und der Timer.
- `src/screens/` – Bildschirme und Fenster.
- `src/components/` – wiederverwendbare Bausteine.

Jeder Datensatz trägt `id`, `updatedAt` und `deletedAt`, damit sich später eine Synchronisierung nachrüsten lässt.

## Etappen

1. Grundgerüst, Gewohnheiten, Tagesansicht, Backup, Deployment ✅
2. XP, Level, Attribute, Ränge, Charakter-Übersicht
3. Münzen, Shop, Sparziele, Boni
4. Abend-Check, Wochenrückblick, Statistiken, Kalender-Erinnerungen
5. „Statt Scrollen“, Habit Stacking, Onboarding, Feinschliff
