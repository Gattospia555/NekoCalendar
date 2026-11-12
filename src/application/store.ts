/**
 * Accesso ai dati del calendario, indipendente da dove sono salvati.
 *
 * - `SqliteStore` (src/platform): il database sul PC, usato nell'app vera;
 * - `MemoryStore` (qui accanto): in memoria, per i test e l'anteprima nel browser.
 *
 * Le cancellazioni sono "morbide" (`deleted = true`) per la sincronizzazione futura.
 */
import type { Calendar, CalendarEvent, EventException } from "@/domain/types";

/** Tutto ciò che serve all'interfaccia, caricato in una volta (centinaia o migliaia di righe). */
export interface Snapshot {
  calendars: Calendar[];
  events: CalendarEvent[];
  exceptions: EventException[];
  /** Impostazioni come testo: chiave → valore (JSON). */
  settings: Record<string, string>;
}

export interface CalendarStore {
  load(): Promise<Snapshot>;
  saveCalendar(calendar: Calendar): Promise<void>;
  saveEvent(event: CalendarEvent): Promise<void>;
  saveException(exception: EventException): Promise<void>;
  saveSetting(key: string, value: string): Promise<void>;
}
