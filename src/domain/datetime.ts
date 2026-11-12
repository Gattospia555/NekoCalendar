/**
 * Date e ore "da orologio" (senza fuso) e conversioni tra fusi orari IANA.
 *
 * Perché stringhe e non `Date`: un evento "ogni lunedì alle 18:30" deve restare
 * alle 18:30 anche dopo il cambio dell'ora legale. Per questo le ore si salvano
 * come le legge l'orologio (`"2026-11-02T18:30"`) insieme al fuso (`"Europe/Rome"`),
 * e si trasformano in istanti precisi solo quando serve (promemoria, conversioni).
 */
import type { DateKey, LocalDateTime } from "./types";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

export interface DateTimeParts extends DateParts {
  hour: number;
  minute: number;
}

const pad = (value: number, size = 2) => String(value).padStart(size, "0");

/** `true` se `value` è un giorno valido `YYYY-MM-DD`. */
export function isDateKey(value: string): boolean {
  const match = DATE_RE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);
}

/** `true` se `value` è un'ora locale valida `YYYY-MM-DDTHH:mm`. */
export function isLocalDateTime(value: string): boolean {
  const match = LOCAL_RE.exec(value);
  if (!match) return false;
  const [, , , , hh, mm] = match.map(Number);
  return isDateKey(value.slice(0, 10)) && hh <= 23 && mm <= 59;
}

export function parseDateKey(key: DateKey): DateParts {
  if (!isDateKey(key)) throw new RangeError(`Data non valida: ${key}`);
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day };
}

export function parseLocal(value: LocalDateTime): DateTimeParts {
  if (!isLocalDateTime(value)) throw new RangeError(`Ora non valida: ${value}`);
  const { year, month, day } = parseDateKey(value.slice(0, 10));
  return {
    year,
    month,
    day,
    hour: Number(value.slice(11, 13)),
    minute: Number(value.slice(14, 16)),
  };
}

export function formatDateKey({ year, month, day }: DateParts): DateKey {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

export function formatLocal(parts: DateTimeParts): LocalDateTime {
  return `${formatDateKey(parts)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

/** Giorni del mese (gestisce gli anni bisestili). `month` va da 1 a 12. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Trasforma un giorno o un'ora locale in millisecondi "come se fosse UTC": utile solo per i calcoli. */
function asUtcMs(value: string): number {
  if (isDateKey(value)) {
    const { year, month, day } = parseDateKey(value);
    return Date.UTC(year, month - 1, day);
  }
  const p = parseLocal(value);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
}

function fromUtcMs(ms: number): DateTimeParts {
  const date = new Date(ms);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
  };
}

/** Il giorno di un'ora locale (o il giorno stesso). */
export function dateOf(value: string): DateKey {
  return value.slice(0, 10);
}

/** Ora locale di inizio: un `DateKey` diventa la sua mezzanotte. */
export function toLocal(value: string): LocalDateTime {
  return isDateKey(value) ? `${value}T00:00` : value;
}

/** Aggiunge (o toglie) giorni a un `DateKey`. */
export function addDays(key: DateKey, days: number): DateKey {
  return formatDateKey(fromUtcMs(asUtcMs(key) + days * DAY_MS));
}

/** Aggiunge (o toglie) minuti a un'ora locale, sull'orologio (senza fuso). */
export function addMinutes(value: LocalDateTime, minutes: number): LocalDateTime {
  return formatLocal(fromUtcMs(asUtcMs(value) + minutes * MINUTE_MS));
}

/** Minuti tra due ore locali (o giorni), sull'orologio. */
export function minutesBetween(from: string, to: string): number {
  return Math.round((asUtcMs(to) - asUtcMs(from)) / MINUTE_MS);
}

/** Giorni di calendario tra due date (`to - from`). */
export function daysBetween(from: DateKey, to: DateKey): number {
  return Math.round((asUtcMs(to) - asUtcMs(from)) / DAY_MS);
}

/** Confronta due valori (giorni o ore locali): negativo, zero o positivo. */
export function compareLocal(a: string, b: string): number {
  const left = toLocal(a);
  const right = toLocal(b);
  return left < right ? -1 : left > right ? 1 : 0;
}

/** Giorno della settimana con lunedì = 0 … domenica = 6 (uso italiano). */
export function weekdayIndex(key: DateKey): number {
  return (new Date(asUtcMs(key)).getUTCDay() + 6) % 7;
}

/** Lunedì della settimana che contiene `key`. */
export function startOfWeek(key: DateKey): DateKey {
  return addDays(key, -weekdayIndex(key));
}

/** Primo giorno del mese di `key`. */
export function startOfMonth(key: DateKey): DateKey {
  const { year, month } = parseDateKey(key);
  return formatDateKey({ year, month, day: 1 });
}

/** Stesso giorno spostato di `months` mesi (il 31 diventa l'ultimo giorno disponibile). */
export function addMonths(key: DateKey, months: number): DateKey {
  const { year, month, day } = parseDateKey(key);
  const index = year * 12 + (month - 1) + months;
  const nextYear = Math.floor(index / 12);
  const nextMonth = (index % 12) + 1;
  return formatDateKey({
    year: nextYear,
    month: nextMonth,
    day: Math.min(day, daysInMonth(nextYear, nextMonth)),
  });
}

/** Numero della settimana ISO 8601 (la settimana 1 contiene il primo giovedì dell'anno). */
export function isoWeekNumber(key: DateKey): number {
  const thursday = addDays(key, 3 - weekdayIndex(key));
  const { year } = parseDateKey(thursday);
  return Math.floor(daysBetween(`${year}-01-01`, thursday) / 7) + 1;
}

// ---------------------------------------------------------------------------
// Fusi orari
// ---------------------------------------------------------------------------

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** `true` se il fuso IANA è riconosciuto dal sistema. */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatterFor(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** Fuso orario del dispositivo (es. `"Europe/Rome"`), `"UTC"` se non disponibile. */
export function systemTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Ora locale che un orologio nel fuso `timeZone` mostra all'istante `instantMs`. */
export function instantToLocal(instantMs: number, timeZone: string): LocalDateTime {
  const parts = Object.fromEntries(
    formatterFor(timeZone)
      .formatToParts(new Date(instantMs))
      .map((part) => [part.type, part.value]),
  );
  return formatLocal({
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  });
}

/** Differenza in minuti tra il fuso e UTC all'istante dato (Roma d'inverno: +60). */
export function utcOffsetMinutes(instantMs: number, timeZone: string): number {
  const wall = asUtcMs(instantToLocal(instantMs, timeZone));
  const floored = Math.floor(instantMs / MINUTE_MS) * MINUTE_MS;
  return Math.round((wall - floored) / MINUTE_MS);
}

/**
 * Istante (ms UTC) in cui l'orologio del fuso mostra `local`.
 *
 * Casi dell'ora legale:
 * - ora inesistente (es. 02:30 quando si passa da 02:00 a 03:00): si sposta in avanti
 *   della durata del salto (diventa 03:30), come fanno i calendari più diffusi;
 * - ora ripetuta (es. 02:30 quando si torna da 03:00 a 02:00): si usa la prima volta.
 */
export function localToInstant(local: LocalDateTime, timeZone: string): number {
  const wall = asUtcMs(toLocal(local));
  const before = utcOffsetMinutes(wall - DAY_MS, timeZone);
  const after = utcOffsetMinutes(wall + DAY_MS, timeZone);
  // Prova prima l'offset "precedente" (prima occorrenza in caso di ora ripetuta).
  for (const offset of [Math.max(before, after), Math.min(before, after)]) {
    const candidate = wall - offset * MINUTE_MS;
    if (instantToLocal(candidate, timeZone) === toLocal(local)) return candidate;
  }
  // Ora inesistente: si applica l'offset di prima del salto, che sposta in avanti.
  return wall - before * MINUTE_MS;
}

/** Converte un'ora locale da un fuso a un altro. */
export function convertLocal(
  local: LocalDateTime,
  fromZone: string,
  toZone: string,
): LocalDateTime {
  if (fromZone === toZone) return local;
  return instantToLocal(localToInstant(local, fromZone), toZone);
}

/** Giorno corrente (`DateKey`) nel fuso indicato. */
export function todayIn(nowMs: number, timeZone: string): DateKey {
  return dateOf(instantToLocal(nowMs, timeZone));
}
