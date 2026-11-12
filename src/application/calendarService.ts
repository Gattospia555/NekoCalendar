/**
 * Operazioni del calendario usate dall'interfaccia: un punto unico che assegna
 * id e orologio logico (HLC) a ogni modifica e la salva nell'archivio.
 */
import { eventFromDraft, type EventDraft } from "@/domain/eventDraft";
import { HlcClock, cryptoRandomBytes, uuidv7, type RandomBytes } from "@/domain/ids";
import {
  DEFAULT_SETTINGS,
  type Calendar,
  type CalendarEvent,
  type CalendarView,
  type EventException,
  type Language,
  type Settings,
  type ThemePreference,
} from "@/domain/types";
import type { CalendarStore, Snapshot } from "./store";

/** Calendari creati al primo avvio, con i colori del tema Base Neko. */
export const DEFAULT_CALENDARS: { key: "personal" | "work" | "birthdays"; color: string }[] = [
  { key: "personal", color: "#c58463" },
  { key: "work", color: "#4f7fb8" },
  { key: "birthdays", color: "#d06a8c" },
];

const DEVICE_KEY = "deviceId";
const SETTINGS_KEY = "settings";
const THEMES: readonly ThemePreference[] = ["auto", "light", "dark"];
const LANGUAGES: readonly Language[] = ["it", "en"];
const VIEWS: readonly CalendarView[] = ["day", "week", "month", "year", "agenda"];

/** Legge le impostazioni salvate; i valori mancanti o non validi tornano a quelli di default. */
export function parseSettings(text: string | undefined): Settings {
  if (!text) return { ...DEFAULT_SETTINGS };
  try {
    const raw = JSON.parse(text) as Partial<Record<keyof Settings, unknown>>;
    return {
      theme: THEMES.includes(raw.theme as ThemePreference)
        ? (raw.theme as ThemePreference)
        : DEFAULT_SETTINGS.theme,
      language: LANGUAGES.includes(raw.language as Language)
        ? (raw.language as Language)
        : DEFAULT_SETTINGS.language,
      showHolidays:
        typeof raw.showHolidays === "boolean" ? raw.showHolidays : DEFAULT_SETTINGS.showHolidays,
      defaultView: VIEWS.includes(raw.defaultView as CalendarView)
        ? (raw.defaultView as CalendarView)
        : DEFAULT_SETTINGS.defaultView,
      displayName:
        typeof raw.displayName === "string"
          ? raw.displayName.trim().slice(0, 40)
          : DEFAULT_SETTINGS.displayName,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export interface ServiceOptions {
  timeZone: string;
  now?: () => number;
  random?: RandomBytes;
}

export class CalendarService {
  private constructor(
    private readonly store: CalendarStore,
    private readonly clock: HlcClock,
    private readonly options: Required<ServiceOptions>,
  ) {}

  /**
   * Apre il calendario: assegna un id a questo dispositivo al primo avvio e crea
   * i calendari predefiniti se non ce n'è nessuno.
   */
  static async start(
    store: CalendarStore,
    options: ServiceOptions,
    calendarNames: Record<(typeof DEFAULT_CALENDARS)[number]["key"], string>,
  ): Promise<{ service: CalendarService; snapshot: Snapshot }> {
    const resolved: Required<ServiceOptions> = {
      now: Date.now,
      random: cryptoRandomBytes,
      ...options,
    };
    let snapshot = await store.load();
    let deviceId = snapshot.settings[DEVICE_KEY];
    if (!deviceId || !/^[a-f0-9]{12}$/.test(deviceId)) {
      deviceId = Array.from(resolved.random(6), (b) => b.toString(16).padStart(2, "0")).join("");
      await store.saveSetting(DEVICE_KEY, deviceId);
    }
    const service = new CalendarService(store, new HlcClock(deviceId, resolved.now), resolved);
    if (!snapshot.calendars.some((c) => !c.deleted)) {
      for (const [index, { key, color }] of DEFAULT_CALENDARS.entries()) {
        await store.saveCalendar({
          id: service.newId(),
          name: calendarNames[key],
          color,
          visible: true,
          sortOrder: index,
          updatedHlc: service.clock.next(),
          deleted: false,
        });
      }
    }
    snapshot = await store.load();
    return { service, snapshot };
  }

  private newId(): string {
    return uuidv7(this.options.now(), this.options.random);
  }

  /** Ricarica tutti i dati (dopo ogni modifica). */
  load(): Promise<Snapshot> {
    return this.store.load();
  }

  /** Salva un evento dal modulo: nuovo se `existing` manca, altrimenti aggiorna tutta la serie. */
  async saveDraft(draft: EventDraft, existing?: CalendarEvent): Promise<CalendarEvent> {
    const event = eventFromDraft(draft, {
      id: existing?.id ?? this.newId(),
      tzid: existing?.tzid ?? this.options.timeZone,
      updatedHlc: this.clock.next(),
    });
    await this.store.saveEvent(event);
    return event;
  }

  /** Cancella un evento (o tutta la serie). */
  async deleteEvent(event: CalendarEvent): Promise<void> {
    await this.store.saveEvent({ ...event, deleted: true, updatedHlc: this.clock.next() });
  }

  private async upsertException(
    event: CalendarEvent,
    occurrenceStart: string,
    existing: readonly EventException[],
    changes: Pick<EventException, "cancelled" | "title" | "start" | "end">,
  ): Promise<void> {
    const previous = existing.find(
      (x) => x.eventId === event.id && x.occurrenceStart === occurrenceStart,
    );
    await this.store.saveException({
      id: previous?.id ?? this.newId(),
      eventId: event.id,
      occurrenceStart,
      ...changes,
      updatedHlc: this.clock.next(),
      deleted: false,
    });
  }

  /** Cancella solo una ripetizione di un evento ricorrente. */
  deleteOccurrence(
    event: CalendarEvent,
    occurrenceStart: string,
    existing: readonly EventException[],
  ): Promise<void> {
    return this.upsertException(event, occurrenceStart, existing, {
      cancelled: true,
      title: null,
      start: null,
      end: null,
    });
  }

  /**
   * Modifica solo una ripetizione. La bozza va preparata dall'occorrenza (vedi
   * `draftForOccurrence`): titolo, inizio e fine diventano quelli di questa sola volta.
   */
  editOccurrence(
    event: CalendarEvent,
    occurrenceStart: string,
    draft: EventDraft,
    existing: readonly EventException[],
  ): Promise<void> {
    const edited = eventFromDraft(
      { ...draft, allDay: event.allDay, repeat: "none" },
      {
        id: event.id,
        tzid: event.tzid,
        updatedHlc: "",
      },
    );
    return this.upsertException(event, occurrenceStart, existing, {
      cancelled: false,
      title: edited.title === event.title ? null : edited.title,
      start: edited.start === occurrenceStart ? null : edited.start,
      end: edited.end,
    });
  }

  /** Segna un task come completato (o da fare). */
  async setTaskDone(event: CalendarEvent, done: boolean): Promise<void> {
    await this.store.saveEvent({ ...event, done, updatedHlc: this.clock.next() });
  }

  /** Mostra o nasconde un calendario nelle viste. */
  async setCalendarVisible(calendar: Calendar, visible: boolean): Promise<void> {
    await this.store.saveCalendar({ ...calendar, visible, updatedHlc: this.clock.next() });
  }

  /** Crea un nuovo calendario. */
  async createCalendar(name: string, color: string, sortOrder: number): Promise<Calendar> {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 100) throw new RangeError("Nome del calendario non valido");
    if (!/^#[0-9a-f]{6}$/i.test(color)) throw new RangeError("Colore non valido");
    const calendar: Calendar = {
      id: this.newId(),
      name: trimmed,
      color,
      visible: true,
      sortOrder,
      updatedHlc: this.clock.next(),
      deleted: false,
    };
    await this.store.saveCalendar(calendar);
    return calendar;
  }

  saveSettings(settings: Settings): Promise<void> {
    return this.store.saveSetting(SETTINGS_KEY, JSON.stringify(settings));
  }

  /** Impostazioni lette da un caricamento. */
  static settingsOf(snapshot: Snapshot): Settings {
    return parseSettings(snapshot.settings[SETTINGS_KEY]);
  }
}
