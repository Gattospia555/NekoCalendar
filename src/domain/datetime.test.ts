import { describe, expect, it } from "vitest";
import {
  addDays,
  addMinutes,
  addMonths,
  compareLocal,
  convertLocal,
  daysBetween,
  daysInMonth,
  instantToLocal,
  isDateKey,
  isLocalDateTime,
  isValidTimeZone,
  isoWeekNumber,
  localToInstant,
  minutesBetween,
  parseLocal,
  startOfMonth,
  startOfWeek,
  systemTimeZone,
  toLocal,
  todayIn,
  utcOffsetMinutes,
  weekdayIndex,
} from "./datetime";

const ROME = "Europe/Rome";

describe("formati", () => {
  it("riconosce date e ore valide", () => {
    expect(isDateKey("2026-11-12")).toBe(true);
    expect(isDateKey("2026-02-29")).toBe(false);
    expect(isDateKey("2028-02-29")).toBe(true);
    expect(isDateKey("2026-13-01")).toBe(false);
    expect(isDateKey("12/11/2026")).toBe(false);
    expect(isLocalDateTime("2026-11-12T17:00")).toBe(true);
    expect(isLocalDateTime("2026-11-12T24:00")).toBe(false);
    expect(isLocalDateTime("2026-11-12")).toBe(false);
  });

  it("scompone un'ora locale e rifiuta i valori sbagliati", () => {
    expect(parseLocal("2026-11-12T17:05")).toEqual({
      year: 2026,
      month: 11,
      day: 12,
      hour: 17,
      minute: 5,
    });
    expect(() => parseLocal("2026-11-12")).toThrow(RangeError);
  });

  it("trasforma un giorno nella sua mezzanotte", () => {
    expect(toLocal("2026-11-12")).toBe("2026-11-12T00:00");
    expect(toLocal("2026-11-12T08:00")).toBe("2026-11-12T08:00");
  });
});

describe("aritmetica delle date", () => {
  it("somma giorni attraverso mesi e anni bisestili", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
  });

  it("somma minuti sull'orologio, anche oltre la mezzanotte", () => {
    expect(addMinutes("2026-11-12T23:30", 45)).toBe("2026-11-13T00:15");
    expect(minutesBetween("2026-11-12T09:00", "2026-11-12T10:30")).toBe(90);
    expect(daysBetween("2026-11-12", "2026-12-25")).toBe(43);
  });

  it("sposta di mesi senza superare la fine del mese", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-11-12", -12)).toBe("2025-11-12");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
  });

  it("confronta giorni e ore locali", () => {
    expect(compareLocal("2026-11-12", "2026-11-12T00:00")).toBe(0);
    expect(compareLocal("2026-11-12T09:00", "2026-11-12")).toBe(1);
    expect(compareLocal("2026-11-11", "2026-11-12T00:00")).toBe(-1);
  });

  it("usa il lunedì come primo giorno della settimana", () => {
    expect(weekdayIndex("2026-11-12")).toBe(3); // giovedì
    expect(weekdayIndex("2026-11-15")).toBe(6); // domenica
    expect(startOfWeek("2026-11-15")).toBe("2026-11-09");
    expect(startOfMonth("2026-11-12")).toBe("2026-11-01");
  });

  it("calcola il numero di settimana ISO", () => {
    expect(isoWeekNumber("2026-11-12")).toBe(46);
    expect(isoWeekNumber("2027-01-01")).toBe(53); // venerdì: appartiene all'ultima settimana del 2026
    expect(isoWeekNumber("2026-01-01")).toBe(1);
  });
});

describe("fusi orari e ora legale", () => {
  it("conosce il fuso del sistema e riconosce quelli validi", () => {
    expect(isValidTimeZone(systemTimeZone())).toBe(true);
    expect(isValidTimeZone(ROME)).toBe(true);
    expect(isValidTimeZone("Marte/Olympus")).toBe(false);
  });

  it("converte tra istante e ora locale a Roma, d'inverno e d'estate", () => {
    expect(instantToLocal(Date.UTC(2026, 10, 12, 16, 0), ROME)).toBe("2026-11-12T17:00");
    expect(instantToLocal(Date.UTC(2026, 6, 1, 16, 0), ROME)).toBe("2026-07-01T18:00");
    expect(utcOffsetMinutes(Date.UTC(2026, 10, 12), ROME)).toBe(60);
    expect(utcOffsetMinutes(Date.UTC(2026, 6, 1), ROME)).toBe(120);
    expect(localToInstant("2026-11-12T17:00", ROME)).toBe(Date.UTC(2026, 10, 12, 16, 0));
    expect(localToInstant("2026-11-12", ROME)).toBe(Date.UTC(2026, 10, 11, 23, 0));
  });

  it("sposta in avanti un'ora che non esiste (marzo, 02:30 → 03:30)", () => {
    // 29 marzo 2026: alle 02:00 gli orologi saltano alle 03:00.
    const instant = localToInstant("2026-03-29T02:30", ROME);
    expect(instantToLocal(instant, ROME)).toBe("2026-03-29T03:30");
  });

  it("usa la prima volta di un'ora ripetuta (ottobre, 02:30)", () => {
    // 25 ottobre 2026: alle 03:00 gli orologi tornano alle 02:00.
    const instant = localToInstant("2026-10-25T02:30", ROME);
    expect(instant).toBe(Date.UTC(2026, 9, 25, 0, 30));
    expect(utcOffsetMinutes(instant, ROME)).toBe(120);
  });

  it("gestisce le ore vicine al cambio senza errori", () => {
    expect(instantToLocal(localToInstant("2026-03-28T23:00", ROME), ROME)).toBe("2026-03-28T23:00");
    expect(instantToLocal(localToInstant("2026-03-29T05:00", ROME), ROME)).toBe("2026-03-29T05:00");
  });

  it("converte un'ora da un fuso all'altro", () => {
    expect(convertLocal("2026-11-12T09:00", "America/New_York", ROME)).toBe("2026-11-12T15:00");
    expect(convertLocal("2026-11-12T09:00", ROME, ROME)).toBe("2026-11-12T09:00");
    expect(todayIn(Date.UTC(2026, 10, 12, 23, 30), ROME)).toBe("2026-11-13");
  });
});
