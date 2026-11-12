/**
 * Tipi del calendario, condivisi da database, logica e interfaccia.
 *
 * Convenzioni sulle date (vedi `datetime.ts`):
 * - `LocalDateTime`: ora "da orologio" senza fuso, `"2026-11-12T17:00"`;
 * - `DateKey`: un giorno di calendario, `"2026-11-12"`;
 * - ogni evento porta il suo fuso IANA (`tzid`) e le ricorrenze si calcolano
 *   in quel fuso, così l'ora legale non sposta gli eventi.
 */

/** Giorno di calendario `YYYY-MM-DD`. */
export type DateKey = string;
/** Ora locale senza fuso `YYYY-MM-DDTHH:mm`. */
export type LocalDateTime = string;

/** Tipi di evento dedicati (sezione 5 della visione). */
export type EventKind = "event" | "birthday" | "anniversary" | "task" | "holiday";

/** Campi di sincronizzazione presenti in ogni riga (ADR-0003). */
export interface SyncFields {
  /** Orologio logico ibrido dell'ultima modifica (vedi `hlc.ts`). */
  updatedHlc: string;
  /** "Lapide": la riga è cancellata ma resta finché tutti i dispositivi lo sanno. */
  deleted: boolean;
}

export interface Calendar extends SyncFields {
  id: string;
  name: string;
  /** Colore esadecimale `#rrggbb`. */
  color: string;
  /** Se `false`, gli eventi di questo calendario sono nascosti nelle viste. */
  visible: boolean;
  sortOrder: number;
}

export interface CalendarEvent extends SyncFields {
  id: string;
  calendarId: string;
  kind: EventKind;
  title: string;
  description: string;
  location: string;
  allDay: boolean;
  /**
   * Inizio: `LocalDateTime` per gli eventi a orario, `DateKey` per quelli di tutto il giorno.
   * Per i task è la scadenza.
   */
  start: string;
  /** Fine esclusiva, stesso formato di `start` (tutto il giorno: il giorno dopo l'ultimo). */
  end: string;
  /** Fuso orario IANA in cui va letto `start`, es. `"Europe/Rome"`. */
  tzid: string;
  /** Regola di ripetizione RFC 5545 senza prefisso, es. `"FREQ=WEEKLY;BYDAY=MO"`; `null` se non si ripete. */
  rrule: string | null;
  /** Colore dell'evento; `null` = colore del calendario. */
  color: string | null;
  /** Minuti di anticipo dei promemoria (es. `[10, 60]`). La consegna arriva in M2. */
  reminders: number[];
  /** Solo per i task: completato. */
  done: boolean;
}

/**
 * Modifica di una singola occorrenza di un evento ricorrente.
 * `occurrenceStart` è l'inizio originale dell'occorrenza (RECURRENCE-ID).
 */
export interface EventException extends SyncFields {
  id: string;
  eventId: string;
  occurrenceStart: string;
  /** `true` = occorrenza cancellata (EXDATE). */
  cancelled: boolean;
  /** Valori che sostituiscono quelli della serie; `null` = invariato. */
  title: string | null;
  start: string | null;
  end: string | null;
}

/** Un'occorrenza concreta da mostrare in una vista. */
export interface Occurrence {
  /** Chiave unica e stabile: `eventId@inizio originale`. */
  key: string;
  eventId: string;
  calendarId: string;
  kind: EventKind;
  title: string;
  location: string;
  allDay: boolean;
  /** Inizio e fine nel fuso di visualizzazione (stessi formati di `CalendarEvent`). */
  start: string;
  end: string;
  /** Inizio originale nella serie (serve per modificare o cancellare solo questa). */
  occurrenceStart: string;
  color: string;
  recurring: boolean;
  done: boolean;
  /** Eventi generati (festività): non si possono modificare. */
  readOnly: boolean;
  /** Età per i compleanni o anni per gli anniversari (`null` se non si applica). */
  years: number | null;
}

/** Tema dell'interfaccia. */
export type ThemePreference = "auto" | "light" | "dark";
/** Lingue disponibili. */
export type Language = "it" | "en";
/** Viste del calendario. */
export type CalendarView = "day" | "week" | "month" | "year" | "agenda";

export interface Settings {
  theme: ThemePreference;
  language: Language;
  /** Mostra le festività nazionali italiane. */
  showHolidays: boolean;
  /** Vista aperta all'avvio. */
  defaultView: CalendarView;
  /** Nome mostrato nel saluto (facoltativo). */
  displayName: string;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "auto",
  language: "it",
  showHolidays: true,
  defaultView: "month",
  displayName: "",
};
