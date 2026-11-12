/**
 * Traduzioni e formattazione di date e ore nella lingua scelta.
 * Le date del calendario sono giorni "da orologio": si formattano in UTC per non
 * farle spostare dal fuso del PC.
 */
import { parseDateKey } from "@/domain/datetime";
import type { DateKey, Language } from "@/domain/types";
import { en, it, type MessageKey } from "./messages";

const DICTIONARIES: Record<Language, Record<string, string>> = { it, en };
const LOCALES: Record<Language, string> = { it: "it-IT", en: "en-GB" };

export type Params = Record<string, string | number>;

/** Testo tradotto. Con `count` sceglie la forma `_zero`, `_one` o `_other` se esiste. */
export function translate(
  language: Language,
  key: MessageKey | string,
  params: Params = {},
): string {
  const dictionary = DICTIONARIES[language];
  let template: string | undefined;
  if (typeof params.count === "number") {
    const form = params.count === 0 ? "_zero" : params.count === 1 ? "_one" : "_other";
    template =
      dictionary[`${key}${form}`] ?? (form === "_zero" ? dictionary[`${key}_other`] : undefined);
  }
  template ??= dictionary[key] ?? it[key as MessageKey] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export function localeOf(language: Language): string {
  return LOCALES[language];
}

function utcDate(key: DateKey): Date {
  const { year, month, day } = parseDateKey(key);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase() + text.slice(1);

function format(language: Language, key: DateKey, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(localeOf(language), { ...options, timeZone: "UTC" }).format(
    utcDate(key),
  );
}

/** "Novembre 2026" */
export function formatMonthYear(language: Language, key: DateKey): string {
  return capitalize(format(language, key, { month: "long", year: "numeric" }));
}

/** "Novembre" */
export function formatMonth(language: Language, key: DateKey): string {
  return capitalize(format(language, key, { month: "long" }));
}

/** "Giovedì 12 novembre" */
export function formatDayLong(language: Language, key: DateKey): string {
  return capitalize(format(language, key, { weekday: "long", day: "numeric", month: "long" }));
}

/** "gio 12 nov" */
export function formatDayShort(language: Language, key: DateKey): string {
  return format(language, key, { weekday: "short", day: "numeric", month: "short" });
}

/** "12 nov 2026" */
export function formatDate(language: Language, key: DateKey): string {
  return format(language, key, { day: "numeric", month: "short", year: "numeric" });
}

/** Nomi dei giorni da lunedì a domenica: `"short"` = "lun", `"narrow"` = "L". */
export function weekdayNames(language: Language, width: "short" | "narrow" | "long"): string[] {
  // 2026-11-09 è un lunedì.
  return Array.from({ length: 7 }, (_, i) =>
    format(language, `2026-11-${String(9 + i).padStart(2, "0")}`, { weekday: width }),
  );
}

/** Ora "17:00" da un'ora locale `YYYY-MM-DDTHH:mm` (24 ore in entrambe le lingue). */
export function formatTime(value: string): string {
  return value.length >= 16 ? value.slice(11, 16) : "";
}

/** "17:00 – 18:30" oppure "Tutto il giorno". */
export function formatTimeRange(
  language: Language,
  start: string,
  end: string,
  allDay: boolean,
): string {
  if (allDay) return translate(language, "occ.allDay");
  const from = formatTime(start);
  const to = formatTime(end);
  return to && to !== from && start.slice(0, 10) === end.slice(0, 10) ? `${from} – ${to}` : from;
}

/** Testo di un promemoria ("10 minuti prima", "1 giorno prima"…). */
export function formatReminder(language: Language, minutes: number): string {
  if (minutes === 0) return translate(language, "reminder.0");
  if (minutes === 7 * 24 * 60) return translate(language, "reminder.week");
  if (minutes % (24 * 60) === 0)
    return translate(language, "reminder.days", { count: minutes / (24 * 60) });
  if (minutes % 60 === 0) return translate(language, "reminder.hours", { count: minutes / 60 });
  return translate(language, "reminder.minutes", { n: minutes });
}

/** Saluto in base all'ora: mattina fino alle 13, pomeriggio fino alle 18, poi sera. */
export function greetingKey(hour: number): MessageKey {
  if (hour >= 5 && hour < 13) return "greeting.morning";
  if (hour >= 13 && hour < 18) return "greeting.afternoon";
  return "greeting.evening";
}
