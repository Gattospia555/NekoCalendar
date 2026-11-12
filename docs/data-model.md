# Modello dei dati

Database SQLite sul PC: `%APPDATA%\com.catdevstudio.nekocalendar\nekocalendar.db`. Lo schema nasce dalle migrazioni in [`src-tauri/migrations/`](../src-tauri/migrations/), applicate da sole all'avvio. Una migrazione già rilasciata **non si modifica mai**: ogni cambiamento è un file nuovo con il numero successivo.

## Convenzioni

| Cosa          | Formato                                                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Id            | UUID v7 generato sul dispositivo (funziona anche offline, ordinato per data di creazione)                                                       |
| Giorno        | Testo `YYYY-MM-DD`                                                                                                                              |
| Ora           | Testo `YYYY-MM-DDTHH:mm`, **ora dell'orologio** nel fuso `tzid` dell'evento                                                                     |
| Fine          | **Esclusiva**: un evento di tutto il giorno del 12 novembre ha `end_at = 2026-11-13`                                                            |
| Booleani      | `0` / `1`                                                                                                                                       |
| Sync          | `updated_hlc` = orologio logico ibrido dell'ultima modifica; `deleted` = "lapide" (la riga resta finché tutti i dispositivi lo sanno). ADR-0003 |
| Cancellazioni | Sempre "morbide" (`deleted = 1`), mai `DELETE`                                                                                                  |

## Tabelle (migrazione 0001, M1)

### `calendars`

| Colonna      | Tipo    | Note                                        |
| ------------ | ------- | ------------------------------------------- |
| `id`         | TEXT PK |                                             |
| `name`       | TEXT    | 1–100 caratteri                             |
| `color`      | TEXT    | `#rrggbb` (controllato dal database)        |
| `visible`    | INTEGER | Se `0` gli eventi sono nascosti nelle viste |
| `sort_order` | INTEGER | Ordine nella barra laterale                 |

### `events`

| Colonna       | Tipo    | Note                                                                              |
| ------------- | ------- | --------------------------------------------------------------------------------- |
| `id`          | TEXT PK |                                                                                   |
| `calendar_id` | TEXT FK | → `calendars.id`                                                                  |
| `kind`        | TEXT    | `event`, `birthday`, `anniversary`, `task`                                        |
| `title`       | TEXT    | 1–200 caratteri                                                                   |
| `description` | TEXT    | Note                                                                              |
| `location`    | TEXT    |                                                                                   |
| `all_day`     | INTEGER |                                                                                   |
| `start_at`    | TEXT    | Giorno o ora; per i task è la scadenza                                            |
| `end_at`      | TEXT    | Fine esclusiva; per i task uguale a `start_at`                                    |
| `tzid`        | TEXT    | Fuso IANA, es. `Europe/Rome`                                                      |
| `rrule`       | TEXT    | RRULE RFC 5545 senza prefisso, es. `FREQ=WEEKLY;BYDAY=MO`; `NULL` = non si ripete |
| `color`       | TEXT    | `NULL` = colore del calendario                                                    |
| `reminders`   | TEXT    | Array JSON di minuti di anticipo, es. `[10,60]`                                   |
| `done`        | INTEGER | Solo per i task                                                                   |

Indici: `calendar_id`, `start_at`, `updated_hlc`.

### `event_exceptions`

Modifica o cancellazione di **una sola** ripetizione di un evento ricorrente.

| Colonna                       | Tipo    | Note                                                            |
| ----------------------------- | ------- | --------------------------------------------------------------- |
| `id`                          | TEXT PK |                                                                 |
| `event_id`                    | TEXT FK | → `events.id`                                                   |
| `occurrence_start`            | TEXT    | Inizio originale dell'occorrenza (RECURRENCE-ID)                |
| `cancelled`                   | INTEGER | `1` = cancellata (EXDATE)                                       |
| `title`, `start_at`, `end_at` | TEXT    | Valori che sostituiscono quelli della serie; `NULL` = invariato |

Vincolo: una sola eccezione per occorrenza (`UNIQUE(event_id, occurrence_start)`).

### `settings`

Chiave → valore, **non** sincronizzate (appartengono al dispositivo).

| Chiave     | Valore                                                                  |
| ---------- | ----------------------------------------------------------------------- |
| `deviceId` | 12 caratteri esadecimali, usato nell'HLC                                |
| `settings` | JSON: `theme`, `language`, `showHolidays`, `defaultView`, `displayName` |

## Dati generati (non salvati)

- **Festività italiane**: calcolate ogni volta (`src/domain/holidays.ts`), compresa la Pasqua e il 4 ottobre dal 2026 (legge 151/2025).
- **Occorrenze**: le ripetizioni si calcolano solo per l'intervallo mostrato.

## In arrivo

| Milestone | Cambiamento                                                                           |
| --------- | ------------------------------------------------------------------------------------- |
| M2        | Tabella delle consegne dei promemoria (per non mostrare due volte la stessa notifica) |
| M3        | `countdowns`, `widget_profiles`                                                       |
| M4        | `attachments`, backup ed esportazione                                                 |
| M5        | Stesse tabelle su Supabase (Postgres) con Row Level Security                          |
