/**
 * Occorrenze da mostrare nelle viste: espande gli eventi, applica calendari
 * visibili, fusi orari, compleanni (età) e festività.
 */
import {
  addDays,
  compareLocal,
  convertLocal,
  dateOf,
  isDateKey,
  minutesBetween,
  parseDateKey,
  toLocal,
} from "./datetime";
import { italianHolidays } from "./holidays";
import { expandEvent } from "./recurrence";
import type {
  Calendar,
  CalendarEvent,
  DateKey,
  EventException,
  Language,
  Occurrence,
} from "./types";

/** Calendario virtuale delle festività (non salvato nel database). */
export const HOLIDAYS_CALENDAR_ID = "holidays-it";
export const HOLIDAYS_COLOR = "#d9a520";

export interface OccurrenceQuery {
  events: readonly CalendarEvent[];
  exceptions: readonly EventException[];
  calendars: readonly Calendar[];
  /** Primo giorno incluso. */
  from: DateKey;
  /** Primo giorno escluso. */
  to: DateKey;
  /** Fuso in cui mostrare le ore (di solito quello del dispositivo). */
  displayTimeZone: string;
  showHolidays: boolean;
  language: Language;
}

function yearsSince(
  kind: CalendarEvent["kind"],
  firstStart: string,
  occurrenceStart: string,
): number | null {
  if (kind !== "birthday" && kind !== "anniversary") return null;
  const years = parseDateKey(dateOf(occurrenceStart)).year - parseDateKey(dateOf(firstStart)).year;
  return years > 0 ? years : null;
}

/** Ordine nelle liste: prima gli eventi di tutto il giorno, poi per ora di inizio e titolo. */
export function compareOccurrences(a: Occurrence, b: Occurrence): number {
  const byDay = compareLocal(dateOf(a.start), dateOf(b.start));
  if (byDay !== 0) return byDay;
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
  return (
    compareLocal(a.start, b.start) || a.title.localeCompare(b.title) || a.key.localeCompare(b.key)
  );
}

/** Tutte le occorrenze che toccano l'intervallo `[from, to)`, ordinate. */
export function buildOccurrences(query: OccurrenceQuery): Occurrence[] {
  const { from, to, displayTimeZone } = query;
  const visible = new Map(
    query.calendars.filter((c) => c.visible && !c.deleted).map((c) => [c.id, c]),
  );
  const result: Occurrence[] = [];

  for (const event of query.events) {
    const calendar = visible.get(event.calendarId);
    if (!calendar || event.deleted) continue;
    // Un giorno di margine per lato: un evento in un altro fuso può spostarsi di data.
    const raw = expandEvent(event, query.exceptions, addDays(from, -1), addDays(to, 1));
    for (const occ of raw) {
      const convert = (value: string) =>
        event.allDay ? value : convertLocal(value, event.tzid, displayTimeZone);
      const start = convert(occ.start);
      const end = convert(occ.end);
      const endForOverlap =
        compareLocal(end, start) > 0 ? end : event.allDay ? addDays(start, 1) : start;
      const startsBeforeEnd = compareLocal(start, to) < 0;
      const endsAfterStart =
        compareLocal(endForOverlap, from) > 0 || compareLocal(start, from) >= 0;
      if (!startsBeforeEnd || !endsAfterStart) continue;
      result.push({
        key: `${event.id}@${occ.occurrenceStart}`,
        eventId: event.id,
        calendarId: event.calendarId,
        kind: event.kind,
        title: occ.title,
        location: event.location,
        allDay: event.allDay,
        start,
        end,
        occurrenceStart: occ.occurrenceStart,
        color: event.color ?? calendar.color,
        recurring: Boolean(event.rrule),
        done: event.done,
        readOnly: false,
        years: yearsSince(event.kind, event.start, occ.occurrenceStart),
      });
    }
  }

  if (query.showHolidays) {
    const firstYear = parseDateKey(from).year;
    const lastYear = parseDateKey(addDays(to, -1)).year;
    for (let year = firstYear; year <= lastYear; year += 1) {
      for (const holiday of italianHolidays(year, query.language)) {
        if (holiday.date < from || holiday.date >= to) continue;
        result.push({
          key: `${HOLIDAYS_CALENDAR_ID}:${holiday.id}@${holiday.date}`,
          eventId: `${HOLIDAYS_CALENDAR_ID}:${holiday.id}`,
          calendarId: HOLIDAYS_CALENDAR_ID,
          kind: "holiday",
          title: holiday.name,
          location: "",
          allDay: true,
          start: holiday.date,
          end: addDays(holiday.date, 1),
          occurrenceStart: holiday.date,
          color: HOLIDAYS_COLOR,
          recurring: true,
          done: false,
          readOnly: true,
          years: null,
        });
      }
    }
  }

  return result.sort(compareOccurrences);
}

/** Occorrenze che toccano il giorno `day` (anche quelle che iniziano prima e finiscono dopo). */
export function occurrencesOnDay(list: readonly Occurrence[], day: DateKey): Occurrence[] {
  const next = addDays(day, 1);
  return list.filter((o) => {
    const startDay = dateOf(o.start);
    if (startDay === day) return true;
    if (compareLocal(o.start, day) >= 0) return false;
    // Iniziata prima: conta se finisce dopo l'inizio del giorno (fine esclusiva).
    return compareLocal(o.end, day) > 0 && compareLocal(o.start, next) < 0;
  });
}

/**
 * Prossime occorrenze a partire da `now` (ora locale nel fuso di visualizzazione):
 * quelle in corso o future, esclusi i task già completati.
 */
export function upcoming(list: readonly Occurrence[], now: string, limit: number): Occurrence[] {
  return list
    .filter((o) => {
      if (o.kind === "task" && o.done) return false;
      const end = o.allDay ? toLocal(o.end) : compareLocal(o.end, o.start) > 0 ? o.end : o.start;
      return compareLocal(end, now) > 0 || (o.allDay && dateOf(o.start) === dateOf(now));
    })
    .slice(0, limit);
}

/** Minuti mancanti all'inizio di un'occorrenza (negativo se già iniziata). */
export function minutesUntil(occurrence: Occurrence, now: string): number {
  return minutesBetween(now, toLocal(occurrence.start));
}

/** Un evento a orario posizionato nella colonna di un giorno (viste giorno e settimana). */
export interface TimedBlock {
  occurrence: Occurrence;
  /** Minuti dalla mezzanotte, già limitati al giorno. */
  startMinute: number;
  endMinute: number;
  /** Colonna (0, 1, …) quando più eventi si sovrappongono, e quante colonne servono al gruppo. */
  column: number;
  columns: number;
}

const DAY_MINUTES = 24 * 60;
/** Altezza minima di un blocco, così anche un evento di 5 minuti resta cliccabile. */
const MIN_BLOCK_MINUTES = 20;

/** Dispone gli eventi a orario di un giorno affiancando quelli che si sovrappongono. */
export function layoutDay(list: readonly Occurrence[], day: DateKey): TimedBlock[] {
  const blocks = occurrencesOnDay(list, day)
    .filter((o) => !o.allDay && !isDateKey(o.start))
    .map((o) => {
      const startMinute = Math.max(0, minutesBetween(`${day}T00:00`, o.start));
      const rawEnd =
        compareLocal(o.end, o.start) > 0 ? minutesBetween(`${day}T00:00`, o.end) : startMinute;
      const endMinute = Math.min(DAY_MINUTES, Math.max(rawEnd, startMinute + MIN_BLOCK_MINUTES));
      return { occurrence: o, startMinute, endMinute, column: 0, columns: 1 };
    })
    .sort((a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute);

  // Gruppi di eventi che si sovrappongono a catena; dentro il gruppo, colonne "greedy".
  let group: TimedBlock[] = [];
  let groupEnd = -1;
  const columnEnds: number[] = [];
  const closeGroup = () => {
    const columns = Math.max(1, columnEnds.length);
    for (const block of group) block.columns = columns;
    group = [];
    columnEnds.length = 0;
  };
  for (const block of blocks) {
    if (block.startMinute >= groupEnd) closeGroup();
    let column = columnEnds.findIndex((end) => end <= block.startMinute);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(block.endMinute);
    } else columnEnds[column] = block.endMinute;
    block.column = column;
    group.push(block);
    groupEnd = Math.max(groupEnd, block.endMinute);
  }
  closeGroup();
  return blocks;
}
