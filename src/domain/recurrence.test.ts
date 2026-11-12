import { describe, expect, it } from "vitest";
import { expandEvent, isValidRule, ruleFromString, ruleToString } from "./recurrence";
import type { CalendarEvent, EventException } from "./types";

function event(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "e1",
    calendarId: "c1",
    kind: "event",
    title: "Palestra",
    description: "",
    location: "",
    allDay: false,
    start: "2026-11-02T18:30",
    end: "2026-11-02T19:30",
    tzid: "Europe/Rome",
    rrule: null,
    color: null,
    reminders: [],
    done: false,
    updatedHlc: "0",
    deleted: false,
    ...overrides,
  };
}

function exception(overrides: Partial<EventException>): EventException {
  return {
    id: "x1",
    eventId: "e1",
    occurrenceStart: "",
    cancelled: false,
    title: null,
    start: null,
    end: null,
    updatedHlc: "0",
    deleted: false,
    ...overrides,
  };
}

describe("regole RRULE", () => {
  it("riconosce regole valide e non valide", () => {
    expect(isValidRule("FREQ=WEEKLY;BYDAY=MO")).toBe(true);
    expect(isValidRule("FREQ=MONTHLY;BYDAY=-1FR")).toBe(true);
    expect(isValidRule("ciao")).toBe(false);
    expect(isValidRule("")).toBe(false);
  });

  it("costruisce regole dalla forma semplice", () => {
    expect(
      ruleToString(
        { freq: "WEEKLY", interval: 1, byDay: [2, 0, 0], end: { type: "never" } },
        false,
      ),
    ).toBe("FREQ=WEEKLY;BYDAY=MO,WE");
    expect(
      ruleToString(
        { freq: "DAILY", interval: 2, byDay: [], end: { type: "count", count: 5 } },
        false,
      ),
    ).toBe("FREQ=DAILY;INTERVAL=2;COUNT=5");
    expect(
      ruleToString(
        { freq: "MONTHLY", interval: 1, byDay: [], end: { type: "until", until: "2027-06-30" } },
        false,
      ),
    ).toBe("FREQ=MONTHLY;UNTIL=20270630T235959");
    expect(
      ruleToString(
        { freq: "YEARLY", interval: 1, byDay: [], end: { type: "until", until: "2030-01-01" } },
        true,
      ),
    ).toBe("FREQ=YEARLY;UNTIL=20300101");
  });

  it("rifiuta valori impossibili", () => {
    expect(() =>
      ruleToString({ freq: "DAILY", interval: 0, byDay: [], end: { type: "never" } }, false),
    ).toThrow();
    expect(() =>
      ruleToString(
        { freq: "DAILY", interval: 1, byDay: [], end: { type: "count", count: 0 } },
        false,
      ),
    ).toThrow();
    expect(() =>
      ruleToString(
        { freq: "DAILY", interval: 1, byDay: [], end: { type: "until", until: "domani" } },
        false,
      ),
    ).toThrow();
  });

  it("rilegge le regole semplici e lascia stare quelle avanzate", () => {
    expect(ruleFromString("FREQ=WEEKLY;INTERVAL=2;BYDAY=FR,MO;COUNT=8")).toEqual({
      freq: "WEEKLY",
      interval: 2,
      byDay: [0, 4],
      end: { type: "count", count: 8 },
    });
    expect(ruleFromString("FREQ=YEARLY;UNTIL=20300101")?.end).toEqual({
      type: "until",
      until: "2030-01-01",
    });
    expect(ruleFromString("FREQ=MONTHLY;BYDAY=-1FR")).toBeNull();
    expect(ruleFromString("FREQ=MONTHLY;BYMONTHDAY=15")).toBeNull();
    expect(ruleFromString("FREQ=HOURLY")).toBeNull();
    expect(ruleFromString("non valida")).toBeNull();
  });
});

describe("espansione delle occorrenze", () => {
  it("restituisce un evento singolo solo se tocca l'intervallo", () => {
    const single = event();
    expect(expandEvent(single, [], "2026-11-01", "2026-11-08")).toHaveLength(1);
    expect(expandEvent(single, [], "2026-11-03", "2026-11-08")).toHaveLength(0);
  });

  it("mantiene l'ora sull'orologio attraverso il cambio dell'ora legale", () => {
    const weekly = event({
      start: "2026-10-19T18:30",
      end: "2026-10-19T19:30",
      rrule: "FREQ=WEEKLY;BYDAY=MO",
    });
    const list = expandEvent(weekly, [], "2026-10-19", "2026-11-03");
    expect(list.map((o) => o.start)).toEqual([
      "2026-10-19T18:30",
      "2026-10-26T18:30",
      "2026-11-02T18:30",
    ]);
    expect(list[1].end).toBe("2026-10-26T19:30");
  });

  it("rispetta COUNT e UNTIL", () => {
    const daily = event({ rrule: "FREQ=DAILY;COUNT=3" });
    expect(expandEvent(daily, [], "2026-11-01", "2026-12-01")).toHaveLength(3);
    const until = event({ rrule: "FREQ=DAILY;UNTIL=20261104T235959" });
    expect(
      expandEvent(until, [], "2026-11-01", "2026-12-01").map((o) => o.start.slice(0, 10)),
    ).toEqual(["2026-11-02", "2026-11-03", "2026-11-04"]);
  });

  it("applica cancellazioni e modifiche di una sola occorrenza", () => {
    const weekly = event({ rrule: "FREQ=WEEKLY;COUNT=3" });
    const exceptions = [
      exception({ id: "a", occurrenceStart: "2026-11-09T18:30", cancelled: true }),
      exception({
        id: "b",
        occurrenceStart: "2026-11-16T18:30",
        title: "Palestra (spostata)",
        start: "2026-11-16T20:00",
      }),
      exception({ id: "c", occurrenceStart: "2026-11-02T18:30", cancelled: true, deleted: true }),
    ];
    const list = expandEvent(weekly, exceptions, "2026-11-01", "2026-12-01");
    expect(list.map((o) => [o.start, o.end, o.title, o.overridden])).toEqual([
      ["2026-11-02T18:30", "2026-11-02T19:30", "Palestra", false],
      ["2026-11-16T20:00", "2026-11-16T21:00", "Palestra (spostata)", true],
    ]);
  });

  it("espande compleanni di tutto il giorno ogni anno", () => {
    const birthday = event({
      kind: "birthday",
      allDay: true,
      start: "1999-11-07",
      end: "1999-11-08",
      rrule: "FREQ=YEARLY",
    });
    const list = expandEvent(birthday, [], "2026-11-01", "2026-12-01");
    expect(list).toEqual([
      {
        occurrenceStart: "2026-11-07",
        start: "2026-11-07",
        end: "2026-11-08",
        title: "Palestra",
        overridden: false,
      },
    ]);
  });

  it("conta un task di durata zero nel giorno della scadenza", () => {
    const task = event({ kind: "task", start: "2026-11-18T12:00", end: "2026-11-18T12:00" });
    expect(expandEvent(task, [], "2026-11-18", "2026-11-19")).toHaveLength(1);
    expect(expandEvent(task, [], "2026-11-19", "2026-11-20")).toHaveLength(0);
  });

  it("mostra almeno la prima occorrenza se la regola è illeggibile", () => {
    const broken = event({ rrule: "questa non è una regola" });
    expect(expandEvent(broken, [], "2026-11-01", "2026-12-01")).toHaveLength(1);
  });
});
