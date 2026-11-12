/**
 * Conversione tra le righe del database SQLite e i tipi del dominio.
 * Le colonne usano `snake_case` e 0/1 per i booleani (vedi migrations/0001_init.sql).
 */
import type { Calendar, CalendarEvent, EventException, EventKind } from "@/domain/types";

export interface CalendarRow {
  id: string;
  name: string;
  color: string;
  visible: number;
  sort_order: number;
  updated_hlc: string;
  deleted: number;
}

export interface EventRow {
  id: string;
  calendar_id: string;
  kind: string;
  title: string;
  description: string;
  location: string;
  all_day: number;
  start_at: string;
  end_at: string;
  tzid: string;
  rrule: string | null;
  color: string | null;
  reminders: string;
  done: number;
  updated_hlc: string;
  deleted: number;
}

export interface ExceptionRow {
  id: string;
  event_id: string;
  occurrence_start: string;
  cancelled: number;
  title: string | null;
  start_at: string | null;
  end_at: string | null;
  updated_hlc: string;
  deleted: number;
}

const KINDS: readonly EventKind[] = ["event", "birthday", "anniversary", "task"];

/** Legge l'array JSON dei promemoria, scartando valori non validi invece di bloccare l'app. */
export function parseReminders(text: string): number[] {
  try {
    const value: unknown = JSON.parse(text);
    if (!Array.isArray(value)) return [];
    return value.filter((m): m is number => Number.isInteger(m) && m >= 0);
  } catch {
    return [];
  }
}

export function calendarFromRow(row: CalendarRow): Calendar {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    visible: row.visible === 1,
    sortOrder: row.sort_order,
    updatedHlc: row.updated_hlc,
    deleted: row.deleted === 1,
  };
}

export function calendarToRow(calendar: Calendar): CalendarRow {
  return {
    id: calendar.id,
    name: calendar.name,
    color: calendar.color,
    visible: calendar.visible ? 1 : 0,
    sort_order: calendar.sortOrder,
    updated_hlc: calendar.updatedHlc,
    deleted: calendar.deleted ? 1 : 0,
  };
}

export function eventFromRow(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    calendarId: row.calendar_id,
    kind: KINDS.includes(row.kind as EventKind) ? (row.kind as EventKind) : "event",
    title: row.title,
    description: row.description,
    location: row.location,
    allDay: row.all_day === 1,
    start: row.start_at,
    end: row.end_at,
    tzid: row.tzid,
    rrule: row.rrule,
    color: row.color,
    reminders: parseReminders(row.reminders),
    done: row.done === 1,
    updatedHlc: row.updated_hlc,
    deleted: row.deleted === 1,
  };
}

export function eventToRow(event: CalendarEvent): EventRow {
  return {
    id: event.id,
    calendar_id: event.calendarId,
    kind: event.kind,
    title: event.title,
    description: event.description,
    location: event.location,
    all_day: event.allDay ? 1 : 0,
    start_at: event.start,
    end_at: event.end,
    tzid: event.tzid,
    rrule: event.rrule,
    color: event.color,
    reminders: JSON.stringify(event.reminders),
    done: event.done ? 1 : 0,
    updated_hlc: event.updatedHlc,
    deleted: event.deleted ? 1 : 0,
  };
}

export function exceptionFromRow(row: ExceptionRow): EventException {
  return {
    id: row.id,
    eventId: row.event_id,
    occurrenceStart: row.occurrence_start,
    cancelled: row.cancelled === 1,
    title: row.title,
    start: row.start_at,
    end: row.end_at,
    updatedHlc: row.updated_hlc,
    deleted: row.deleted === 1,
  };
}

export function exceptionToRow(exception: EventException): ExceptionRow {
  return {
    id: exception.id,
    event_id: exception.eventId,
    occurrence_start: exception.occurrenceStart,
    cancelled: exception.cancelled ? 1 : 0,
    title: exception.title,
    start_at: exception.start,
    end_at: exception.end,
    updated_hlc: exception.updatedHlc,
    deleted: exception.deleted ? 1 : 0,
  };
}

/**
 * Istruzione "inserisci o aggiorna" con parametri `$1, $2, …` (mai valori dentro l'SQL).
 * Restituisce il testo SQL e i valori nello stesso ordine delle colonne.
 */
export function upsert(table: string, row: object): { sql: string; values: unknown[] } {
  if (!/^[a-z_]+$/.test(table)) throw new RangeError("Nome di tabella non valido");
  const entries = Object.entries(row);
  const columns = entries.map(([column]) => {
    if (!/^[a-z_]+$/.test(column)) throw new RangeError("Nome di colonna non valido");
    return column;
  });
  const placeholders = columns.map((_, i) => `$${i + 1}`);
  const conflict = table === "settings" ? "key" : "id";
  const updates = columns.filter((c) => c !== conflict).map((c) => `${c} = excluded.${c}`);
  return {
    sql: `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) ON CONFLICT(${conflict}) DO UPDATE SET ${updates.join(", ")}`,
    values: entries.map(([, value]) => value),
  };
}
