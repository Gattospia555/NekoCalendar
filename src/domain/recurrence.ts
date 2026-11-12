/**
 * Ricorrenze RFC 5545 (RRULE) ed espansione delle occorrenze.
 *
 * L'espansione avviene sull'orologio dell'evento (ore "floating"): "ogni lunedì
 * alle 18:30" resta alle 18:30 anche quando cambia l'ora legale. La conversione
 * verso altri fusi orari avviene dopo, in `occurrences.ts`.
 */
import ICAL from "ical.js";
import {
  addDays,
  addMinutes,
  compareLocal,
  isDateKey,
  minutesBetween,
  daysBetween,
} from "./datetime";
import type { CalendarEvent, DateKey, EventException } from "./types";

/** Limite di sicurezza: oltre questo numero di ripetizioni l'espansione si ferma. */
const MAX_ITERATIONS = 20_000;

export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export type RuleEnd =
  { type: "never" } | { type: "count"; count: number } | { type: "until"; until: DateKey };

/** Forma semplice di una regola, quella che l'editor degli eventi sa mostrare e modificare. */
export interface RuleSpec {
  freq: Frequency;
  interval: number;
  /** Giorni della settimana (lunedì = 0 … domenica = 6), solo per le regole settimanali. */
  byDay: number[];
  end: RuleEnd;
}

const DAY_CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;

/** `true` se `rrule` è una regola valida che ical.js sa interpretare. */
export function isValidRule(rrule: string): boolean {
  try {
    const recur = ICAL.Recur.fromString(rrule);
    return typeof recur.freq === "string" && recur.freq.length > 0;
  } catch {
    return false;
  }
}

/** Costruisce il testo RRULE da una `RuleSpec`. `allDay` decide il formato di UNTIL. */
export function ruleToString(spec: RuleSpec, allDay: boolean): string {
  if (!Number.isInteger(spec.interval) || spec.interval < 1) {
    throw new RangeError("L'intervallo deve essere un intero ≥ 1");
  }
  const parts = [`FREQ=${spec.freq}`];
  if (spec.interval > 1) parts.push(`INTERVAL=${spec.interval}`);
  if (spec.freq === "WEEKLY" && spec.byDay.length > 0) {
    const days = [...new Set(spec.byDay)].sort((a, b) => a - b);
    parts.push(`BYDAY=${days.map((d) => DAY_CODES[d]).join(",")}`);
  }
  if (spec.end.type === "count") {
    if (!Number.isInteger(spec.end.count) || spec.end.count < 1) {
      throw new RangeError("Il numero di ripetizioni deve essere ≥ 1");
    }
    parts.push(`COUNT=${spec.end.count}`);
  } else if (spec.end.type === "until") {
    if (!isDateKey(spec.end.until)) throw new RangeError("Data di fine non valida");
    const compact = spec.end.until.replaceAll("-", "");
    // UNTIL deve avere lo stesso tipo dell'inizio: data per tutto il giorno, ora "floating" altrimenti.
    parts.push(`UNTIL=${allDay ? compact : `${compact}T235959`}`);
  }
  return parts.join(";");
}

/**
 * Prova a leggere una regola come `RuleSpec`. Restituisce `null` se la regola usa
 * opzioni che l'editor semplice non gestisce (resta comunque valida e funzionante).
 */
export function ruleFromString(rrule: string): RuleSpec | null {
  if (!isValidRule(rrule)) return null;
  const fields = new Map(
    rrule.split(";").map((pair) => {
      const [key, value = ""] = pair.split("=");
      return [key.toUpperCase(), value.toUpperCase()] as const;
    }),
  );
  const freq = fields.get("FREQ") as Frequency | undefined;
  if (!freq || !["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(freq)) return null;
  const known = new Set(["FREQ", "INTERVAL", "BYDAY", "COUNT", "UNTIL", "WKST"]);
  if ([...fields.keys()].some((key) => !known.has(key))) return null;

  const interval = Number(fields.get("INTERVAL") ?? "1");
  let byDay: number[] = [];
  const byDayText = fields.get("BYDAY");
  if (byDayText) {
    if (freq !== "WEEKLY") return null;
    const codes = byDayText.split(",");
    if (codes.some((code) => !DAY_CODES.includes(code as (typeof DAY_CODES)[number]))) return null;
    byDay = codes
      .map((code) => DAY_CODES.indexOf(code as (typeof DAY_CODES)[number]))
      .sort((a, b) => a - b);
  }

  let end: RuleEnd = { type: "never" };
  const count = fields.get("COUNT");
  const until = fields.get("UNTIL");
  if (count) end = { type: "count", count: Number(count) };
  else if (until) {
    const match = /^(\d{4})(\d{2})(\d{2})/.exec(until);
    if (!match) return null;
    end = { type: "until", until: `${match[1]}-${match[2]}-${match[3]}` };
  }
  return { freq, interval: Number.isInteger(interval) && interval > 0 ? interval : 1, byDay, end };
}

/** Converte `"2026-11-02"` o `"2026-11-02T18:30"` in un `ICAL.Time` senza fuso. */
function toIcalTime(value: string): ICAL.Time {
  return isDateKey(value)
    ? ICAL.Time.fromDateString(value)
    : ICAL.Time.fromDateTimeString(`${value}:00`);
}

/** Converte un `ICAL.Time` nel formato del progetto (giorno o ora locale). */
function fromIcalTime(time: ICAL.Time, allDay: boolean): string {
  const text = time.toString(); // "2026-11-02" oppure "2026-11-02T18:30:00"
  return allDay ? text.slice(0, 10) : text.slice(0, 16);
}

/** Durata di un evento: giorni per quelli di tutto il giorno, minuti per gli altri. */
function durationOf(event: Pick<CalendarEvent, "allDay" | "start" | "end">): number {
  const raw = event.allDay
    ? daysBetween(event.start, event.end)
    : minutesBetween(event.start, event.end);
  return Math.max(0, raw);
}

function shift(value: string, allDay: boolean, amount: number): string {
  return allDay ? addDays(value, amount) : addMinutes(value, amount);
}

/** Un'occorrenza "grezza", ancora nell'orologio dell'evento. */
export interface RawOccurrence {
  occurrenceStart: string;
  start: string;
  end: string;
  title: string;
  overridden: boolean;
}

/**
 * Occorrenze dell'evento che si sovrappongono all'intervallo `[rangeStart, rangeEnd)`,
 * espresso nell'orologio dell'evento. Applica le eccezioni (cancellazioni e modifiche).
 *
 * Limite noto (M1): un'occorrenza spostata con un'eccezione da fuori a dentro
 * l'intervallo non viene trovata; l'editor permette spostamenti solo nello stesso giorno.
 */
export function expandEvent(
  event: CalendarEvent,
  exceptions: readonly EventException[],
  rangeStart: string,
  rangeEnd: string,
): RawOccurrence[] {
  const duration = durationOf(event);
  const byStart = new Map(
    exceptions
      .filter((e) => e.eventId === event.id && !e.deleted)
      .map((e) => [e.occurrenceStart, e]),
  );
  const result: RawOccurrence[] = [];

  const consider = (occurrenceStart: string) => {
    const exception = byStart.get(occurrenceStart);
    if (exception?.cancelled) return;
    const start = exception?.start ?? occurrenceStart;
    const end = exception?.end ?? shift(start, event.allDay, duration);
    // Gli eventi di durata zero (task, promemoria) contano nel giorno in cui iniziano.
    const effectiveEnd = compareLocal(end, start) > 0 ? end : shift(start, event.allDay, 1);
    if (compareLocal(effectiveEnd, rangeStart) <= 0 || compareLocal(start, rangeEnd) >= 0) return;
    result.push({
      occurrenceStart,
      start,
      end,
      title: exception?.title ?? event.title,
      overridden: Boolean(exception),
    });
  };

  if (!event.rrule) {
    consider(event.start);
    return result;
  }

  if (!isValidRule(event.rrule)) {
    consider(event.start); // Regola illeggibile: si mostra almeno la prima occorrenza.
    return result;
  }
  try {
    const iterator = ICAL.Recur.fromString(event.rrule).iterator(toIcalTime(event.start));
    for (let i = 0; i < MAX_ITERATIONS; i += 1) {
      const next = iterator.next();
      if (!next) break;
      const occurrenceStart = fromIcalTime(next, event.allDay);
      if (compareLocal(occurrenceStart, rangeEnd) >= 0) break;
      consider(occurrenceStart);
    }
  } catch {
    // Regola formalmente valida ma che ical.js non sa espandere: come sopra.
    if (result.length === 0) consider(event.start);
  }
  return result;
}
