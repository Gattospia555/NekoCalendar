import { describe, expect, it as test } from "vitest";
import {
  formatDate,
  formatDayLong,
  formatDayMonth,
  formatDayShort,
  formatWeekdayDay,
  formatMonth,
  formatMonthYear,
  formatReminder,
  formatTime,
  formatTimeRange,
  greetingKey,
  localeOf,
  translate,
  weekdayNames,
} from "./i18n";
import { en, it } from "./messages";

describe("traduzioni", () => {
  test("le due lingue hanno le stesse chiavi e nessun testo vuoto inatteso", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(it).sort());
    const allowedEmpty = new Set(["greeting.tasks_zero"]);
    for (const [key, value] of Object.entries(it))
      if (!allowedEmpty.has(key)) expect(value, key).not.toBe("");
    for (const [key, value] of Object.entries(en))
      if (!allowedEmpty.has(key)) expect(value, key).not.toBe("");
  });

  test("inserisce i valori e sceglie il plurale", () => {
    expect(translate("it", "toolbar.weekNumber", { n: 46 })).toBe("Settimana 46");
    expect(translate("it", "greeting.events", { count: 0 })).toBe("nessun evento");
    expect(translate("it", "greeting.events", { count: 1 })).toBe("1 evento");
    expect(translate("en", "greeting.events", { count: 3 })).toBe("3 events");
    expect(translate("it", "month.more", { count: 0 })).toBe("+0 altri"); // niente _zero: usa _other
    expect(translate("it", "chiave.inesistente")).toBe("chiave.inesistente");
    expect(translate("it", "toolbar.weekNumber")).toBe("Settimana {n}");
  });
});

describe("date e ore", () => {
  test("formatta nella lingua scelta", () => {
    expect(localeOf("en")).toBe("en-GB");
    expect(formatMonthYear("it", "2026-11-12")).toBe("Novembre 2026");
    expect(formatMonthYear("en", "2026-11-12")).toBe("November 2026");
    expect(formatMonth("it", "2026-02-01")).toBe("Febbraio");
    expect(formatDayLong("it", "2026-11-12")).toBe("Giovedì 12 novembre");
    expect(formatDayShort("it", "2026-11-12")).toMatch(/^gio 12 nov/);
    expect(formatWeekdayDay("it", "2026-11-13")).toBe("Ven 13");
    expect(formatWeekdayDay("en", "2026-11-13")).toBe("Fri 13");
    expect(formatDayMonth("it", "2026-12-01")).toBe("1 dic");
    expect(formatDayMonth("en", "2026-12-01")).toBe("1 Dec");
    expect(formatDate("en", "2026-11-12")).toBe("12 Nov 2026");
  });

  test("elenca i giorni a partire da lunedì", () => {
    expect(weekdayNames("it", "short")).toEqual(["lun", "mar", "mer", "gio", "ven", "sab", "dom"]);
    expect(weekdayNames("en", "narrow")).toEqual(["M", "T", "W", "T", "F", "S", "S"]);
  });

  test("mostra orari e intervalli", () => {
    expect(formatTime("2026-11-12T17:05")).toBe("17:05");
    expect(formatTime("2026-11-12")).toBe("");
    expect(formatTimeRange("it", "2026-11-12T17:00", "2026-11-12T18:30", false)).toBe(
      "17:00 – 18:30",
    );
    expect(formatTimeRange("it", "2026-11-12T23:00", "2026-11-13T01:00", false)).toBe("23:00");
    expect(formatTimeRange("en", "2026-11-12", "2026-11-13", true)).toBe("All day");
  });

  test("descrive i promemoria", () => {
    expect(formatReminder("it", 0)).toBe("All'ora dell'evento");
    expect(formatReminder("it", 10)).toBe("10 minuti prima");
    expect(formatReminder("it", 60)).toBe("1 ora prima");
    expect(formatReminder("it", 120)).toBe("2 ore prima");
    expect(formatReminder("en", 1440)).toBe("1 day before");
    expect(formatReminder("it", 2880)).toBe("2 giorni prima");
    expect(formatReminder("it", 10080)).toBe("1 settimana prima");
  });

  test("sceglie il saluto in base all'ora", () => {
    expect(greetingKey(8)).toBe("greeting.morning");
    expect(greetingKey(15)).toBe("greeting.afternoon");
    expect(greetingKey(21)).toBe("greeting.evening");
    expect(greetingKey(2)).toBe("greeting.evening");
  });
});
