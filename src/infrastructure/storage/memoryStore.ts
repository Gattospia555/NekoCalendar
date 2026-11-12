import type { Calendar, CalendarEvent, EventException } from "@/domain/types";
import type { CalendarStore, Snapshot } from "@/application/store";

const clone = <T>(value: T): T => structuredClone(value);

/**
 * Archivio in memoria: per i test e per l'anteprima nel browser (`npm run dev`).
 * Si comporta come il database: "inserisci o aggiorna" per id, copie indipendenti.
 */
export class MemoryStore implements CalendarStore {
  private calendars = new Map<string, Calendar>();
  private events = new Map<string, CalendarEvent>();
  private exceptions = new Map<string, EventException>();
  private settings = new Map<string, string>();

  constructor(initial?: Partial<Snapshot>) {
    for (const c of initial?.calendars ?? []) this.calendars.set(c.id, clone(c));
    for (const e of initial?.events ?? []) this.events.set(e.id, clone(e));
    for (const x of initial?.exceptions ?? []) this.exceptions.set(x.id, clone(x));
    for (const [k, v] of Object.entries(initial?.settings ?? {})) this.settings.set(k, v);
  }

  async load(): Promise<Snapshot> {
    return {
      calendars: [...this.calendars.values()].map(clone).sort((a, b) => a.sortOrder - b.sortOrder),
      events: [...this.events.values()].map(clone),
      exceptions: [...this.exceptions.values()].map(clone),
      settings: Object.fromEntries(this.settings),
    };
  }

  async saveCalendar(calendar: Calendar): Promise<void> {
    this.calendars.set(calendar.id, clone(calendar));
  }

  async saveEvent(event: CalendarEvent): Promise<void> {
    if (!this.calendars.has(event.calendarId))
      throw new Error(`Calendario ${event.calendarId} inesistente`);
    this.events.set(event.id, clone(event));
  }

  async saveException(exception: EventException): Promise<void> {
    if (!this.events.has(exception.eventId))
      throw new Error(`Evento ${exception.eventId} inesistente`);
    const duplicate = [...this.exceptions.values()].find(
      (x) =>
        x.eventId === exception.eventId &&
        x.occurrenceStart === exception.occurrenceStart &&
        x.id !== exception.id,
    );
    if (duplicate) throw new Error("Esiste già un'eccezione per questa occorrenza");
    this.exceptions.set(exception.id, clone(exception));
  }

  async saveSetting(key: string, value: string): Promise<void> {
    this.settings.set(key, value);
  }
}
