/**
 * Festività nazionali italiane, calcolate (nessun dato da scaricare).
 *
 * Fonti: legge 260/1949 e successive modifiche; il 4 ottobre (San Francesco
 * d'Assisi) è di nuovo festa nazionale dal 2026 per la legge 8 ottobre 2025 n. 151.
 * Le feste dei santi patroni sono locali e arriveranno con la scelta della città.
 */
import { addDays, formatDateKey } from "./datetime";
import type { DateKey, Language } from "./types";

export interface Holiday {
  /** Identificativo stabile (es. `"easter-monday"`). */
  id: string;
  date: DateKey;
  name: string;
}

type Names = Record<Language, string>;

const FIXED: { id: string; month: number; day: number; since?: number; names: Names }[] = [
  { id: "new-year", month: 1, day: 1, names: { it: "Capodanno", en: "New Year's Day" } },
  { id: "epiphany", month: 1, day: 6, names: { it: "Epifania", en: "Epiphany" } },
  {
    id: "liberation",
    month: 4,
    day: 25,
    names: { it: "Festa della Liberazione", en: "Liberation Day" },
  },
  { id: "labour", month: 5, day: 1, names: { it: "Festa dei Lavoratori", en: "Labour Day" } },
  { id: "republic", month: 6, day: 2, names: { it: "Festa della Repubblica", en: "Republic Day" } },
  { id: "assumption", month: 8, day: 15, names: { it: "Ferragosto", en: "Assumption Day" } },
  {
    id: "saint-francis",
    month: 10,
    day: 4,
    since: 2026,
    names: { it: "San Francesco d'Assisi", en: "Saint Francis of Assisi" },
  },
  { id: "all-saints", month: 11, day: 1, names: { it: "Ognissanti", en: "All Saints' Day" } },
  {
    id: "immaculate",
    month: 12,
    day: 8,
    names: { it: "Immacolata Concezione", en: "Immaculate Conception" },
  },
  { id: "christmas", month: 12, day: 25, names: { it: "Natale", en: "Christmas Day" } },
  {
    id: "saint-stephen",
    month: 12,
    day: 26,
    names: { it: "Santo Stefano", en: "St Stephen's Day" },
  },
];

/** Domenica di Pasqua (calendario gregoriano, algoritmo di Meeus/Jones/Butcher). */
export function easterSunday(year: number): DateKey {
  if (!Number.isInteger(year) || year < 1583) throw new RangeError("Anno non valido");
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return formatDateKey({ year, month, day });
}

/** Festività nazionali italiane dell'anno, in ordine di data. */
export function italianHolidays(year: number, language: Language = "it"): Holiday[] {
  const easter = easterSunday(year);
  const list: Holiday[] = FIXED.filter((h) => !h.since || year >= h.since).map((h) => ({
    id: h.id,
    date: formatDateKey({ year, month: h.month, day: h.day }),
    name: h.names[language],
  }));
  list.push(
    { id: "easter", date: easter, name: language === "it" ? "Pasqua" : "Easter Sunday" },
    {
      id: "easter-monday",
      date: addDays(easter, 1),
      name: language === "it" ? "Lunedì dell'Angelo (Pasquetta)" : "Easter Monday",
    },
  );
  return list.sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
}
