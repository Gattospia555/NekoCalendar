/**
 * Griglie e navigazione delle viste (giorno, settimana, mese, anno, agenda).
 * La settimana inizia di lunedì, come in Italia.
 */
import {
  addDays,
  addMonths,
  parseDateKey,
  startOfMonth,
  startOfWeek,
  formatDateKey,
} from "./datetime";
import type { CalendarView, DateKey } from "./types";

/** Giorni dell'agenda mostrati a partire dalla data scelta. */
export const AGENDA_DAYS = 30;

/** Le 6 settimane (righe) della vista mese: 42 giorni a partire dal lunedì prima del giorno 1. */
export function monthGrid(anchor: DateKey): DateKey[][] {
  const first = startOfWeek(startOfMonth(anchor));
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(first, week * 7 + day)),
  );
}

/** I 7 giorni (da lunedì) della settimana che contiene `anchor`. */
export function weekDays(anchor: DateKey): DateKey[] {
  const monday = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Il primo giorno di ciascuno dei 12 mesi dell'anno di `anchor`. */
export function yearMonths(anchor: DateKey): DateKey[] {
  const { year } = parseDateKey(anchor);
  return Array.from({ length: 12 }, (_, i) => formatDateKey({ year, month: i + 1, day: 1 }));
}

/** Intervallo di giorni `[from, to)` da caricare per una vista. */
export function viewRange(view: CalendarView, anchor: DateKey): { from: DateKey; to: DateKey } {
  switch (view) {
    case "day":
      return { from: anchor, to: addDays(anchor, 1) };
    case "week": {
      const from = startOfWeek(anchor);
      return { from, to: addDays(from, 7) };
    }
    case "month": {
      const grid = monthGrid(anchor);
      return { from: grid[0][0], to: addDays(grid[5][6], 1) };
    }
    case "year": {
      const { year } = parseDateKey(anchor);
      return { from: `${year}-01-01`, to: `${year + 1}-01-01` };
    }
    case "agenda":
      return { from: anchor, to: addDays(anchor, AGENDA_DAYS) };
  }
}

/** Data mostrata dopo aver premuto "avanti" (`step = 1`) o "indietro" (`step = -1`). */
export function shiftAnchor(view: CalendarView, anchor: DateKey, step: 1 | -1): DateKey {
  switch (view) {
    case "day":
      return addDays(anchor, step);
    case "week":
      return addDays(anchor, 7 * step);
    case "month":
      return addMonths(anchor, step);
    case "year":
      return addMonths(anchor, 12 * step);
    case "agenda":
      return addDays(anchor, AGENDA_DAYS * step);
  }
}

/** `true` se `day` appartiene al mese di `anchor` (per attenuare i giorni degli altri mesi). */
export function isSameMonth(day: DateKey, anchor: DateKey): boolean {
  return day.slice(0, 7) === anchor.slice(0, 7);
}
