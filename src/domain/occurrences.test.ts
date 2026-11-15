import { describe, expect, it } from "vitest";
import {
  HOLIDAYS_CALENDAR_ID,
  buildOccurrences,
  busyDays,
  layoutDay,
  minutesUntil,
  occurrencesOnDay,
  upcoming,
  type OccurrenceQuery,
} from "./occurrences";
import type { Calendar, CalendarEvent, Occurrence } from "./types";

const calendars: Calendar[] = [
  {
    id: "pers",
    name: "Personale",
    color: "#c58463",
    visible: true,
    sortOrder: 0,
    updatedHlc: "0",
    deleted: false,
  },
  {
    id: "work",
    name: "Lavoro",
    color: "#4f7fb8",
    visible: false,
    sortOrder: 1,
    updatedHlc: "0",
    deleted: false,
  },
];

let counter = 0;
function event(overrides: Partial<CalendarEvent>): CalendarEvent {
  counter += 1;
  return {
    id: `e${counter}`,
    calendarId: "pers",
    kind: "event",
    title: `Evento ${counter}`,
    description: "",
    location: "",
    allDay: false,
    start: "2026-11-12T17:00",
    end: "2026-11-12T18:00",
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

function query(events: CalendarEvent[], overrides: Partial<OccurrenceQuery> = {}): OccurrenceQuery {
  return {
    events,
    exceptions: [],
    calendars,
    from: "2026-11-09",
    to: "2026-11-16",
    displayTimeZone: "Europe/Rome",
    showHolidays: false,
    language: "it",
    ...overrides,
  };
}

describe("buildOccurrences", () => {
  it("mostra solo i calendari visibili e gli eventi non cancellati", () => {
    const list = buildOccurrences(
      query([
        event({ title: "Ritiro pacco" }),
        event({ title: "Riunione", calendarId: "work" }),
        event({ title: "Cancellato", deleted: true }),
        event({ title: "Calendario sconosciuto", calendarId: "boh" }),
      ]),
    );
    expect(list.map((o) => o.title)).toEqual(["Ritiro pacco"]);
    expect(list[0].color).toBe("#c58463");
    expect(list[0].key).toMatch(/@2026-11-12T17:00$/);
  });

  it("usa il colore dell'evento se presente e ordina tutto il giorno prima", () => {
    const list = buildOccurrences(
      query([
        event({
          title: "Cena",
          start: "2026-11-12T20:00",
          end: "2026-11-12T22:00",
          color: "#e9b7a3",
        }),
        event({ title: "Ferie", allDay: true, start: "2026-11-12", end: "2026-11-13" }),
      ]),
    );
    expect(list.map((o) => o.title)).toEqual(["Ferie", "Cena"]);
    expect(list[1].color).toBe("#e9b7a3");
  });

  it("calcola l'età dei compleanni", () => {
    const list = buildOccurrences(
      query([
        event({
          kind: "birthday",
          title: "Luca",
          allDay: true,
          start: "1995-11-10",
          end: "1995-11-11",
          rrule: "FREQ=YEARLY",
        }),
      ]),
    );
    expect(list[0].years).toBe(31);
    expect(list[0].recurring).toBe(true);
  });

  it("converte gli orari di eventi creati in un altro fuso", () => {
    const list = buildOccurrences(
      query([
        event({
          title: "Call con New York",
          tzid: "America/New_York",
          start: "2026-11-12T09:00",
          end: "2026-11-12T10:00",
        }),
      ]),
    );
    expect([list[0].start, list[0].end]).toEqual(["2026-11-12T15:00", "2026-11-12T16:00"]);
  });

  it("aggiunge le festività quando richiesto, anche a cavallo di due anni", () => {
    const list = buildOccurrences(
      query([], { from: "2026-12-20", to: "2027-01-10", showHolidays: true }),
    );
    expect(list.map((o) => o.title)).toEqual(["Natale", "Santo Stefano", "Capodanno", "Epifania"]);
    expect(list.every((o) => o.readOnly && o.calendarId === HOLIDAYS_CALENDAR_ID)).toBe(true);
  });

  it("include gli eventi lunghi iniziati prima dell'intervallo", () => {
    const list = buildOccurrences(
      query([event({ title: "Vacanza", allDay: true, start: "2026-11-05", end: "2026-11-11" })]),
    );
    expect(list).toHaveLength(1);
  });
});

function occ(overrides: Partial<Occurrence>): Occurrence {
  return {
    key: overrides.title ?? "k",
    eventId: "e",
    calendarId: "pers",
    kind: "event",
    title: "x",
    location: "",
    allDay: false,
    start: "2026-11-12T10:00",
    end: "2026-11-12T11:00",
    occurrenceStart: "2026-11-12T10:00",
    color: "#000000",
    recurring: false,
    done: false,
    readOnly: false,
    years: null,
    ...overrides,
  };
}

describe("occorrenze di un giorno e prossimi eventi", () => {
  const list = [
    occ({ title: "Weekend", allDay: true, start: "2026-11-14", end: "2026-11-16" }),
    occ({ title: "Notte", start: "2026-11-12T23:00", end: "2026-11-13T01:00" }),
    occ({ title: "Mattina", start: "2026-11-13T09:00", end: "2026-11-13T10:00" }),
    occ({
      title: "Task fatto",
      kind: "task",
      done: true,
      start: "2026-11-13T12:00",
      end: "2026-11-13T12:00",
    }),
  ];

  it("trova anche gli eventi che continuano dal giorno prima", () => {
    expect(occurrencesOnDay(list, "2026-11-13").map((o) => o.title)).toEqual([
      "Notte",
      "Mattina",
      "Task fatto",
    ]);
    expect(occurrencesOnDay(list, "2026-11-15").map((o) => o.title)).toEqual(["Weekend"]);
    expect(occurrencesOnDay(list, "2026-11-16")).toEqual([]);
  });

  it("elenca i prossimi eventi saltando quelli finiti e i task completati", () => {
    expect(upcoming(list, "2026-11-13T00:30", 5).map((o) => o.title)).toEqual([
      "Weekend",
      "Notte",
      "Mattina",
    ]);
    expect(upcoming(list, "2026-11-13T09:30", 1).map((o) => o.title)).toEqual(["Weekend"]);
    expect(minutesUntil(list[2], "2026-11-13T08:45")).toBe(15);
  });
});

describe("layoutDay", () => {
  it("affianca gli eventi che si sovrappongono e lascia pieni gli altri", () => {
    const blocks = layoutDay(
      [
        occ({ title: "A", start: "2026-11-12T09:00", end: "2026-11-12T10:00" }),
        occ({ title: "B", start: "2026-11-12T09:30", end: "2026-11-12T10:30" }),
        occ({ title: "C", start: "2026-11-12T10:00", end: "2026-11-12T10:05" }),
        occ({ title: "D", start: "2026-11-12T14:00", end: "2026-11-12T15:00" }),
        occ({ title: "Tutto il giorno", allDay: true, start: "2026-11-12", end: "2026-11-13" }),
      ],
      "2026-11-12",
    );
    const byTitle = Object.fromEntries(blocks.map((b) => [b.occurrence.title, b]));
    expect(Object.keys(byTitle)).toEqual(["A", "B", "C", "D"]);
    expect([byTitle.A.column, byTitle.B.column, byTitle.C.column]).toEqual([0, 1, 0]);
    expect(byTitle.A.columns).toBe(2);
    expect(byTitle.C.endMinute - byTitle.C.startMinute).toBe(20); // altezza minima
    expect([byTitle.D.column, byTitle.D.columns]).toEqual([0, 1]);
  });

  it("taglia alla mezzanotte gli eventi che attraversano i giorni", () => {
    const [block] = layoutDay(
      [occ({ start: "2026-11-11T22:00", end: "2026-11-12T02:00" })],
      "2026-11-12",
    );
    expect([block.startMinute, block.endMinute]).toEqual([0, 120]);
  });
});

describe("giorni con impegni", () => {
  it("segna i giorni pieni, anche quelli in mezzo agli eventi lunghi, dentro l'intervallo", () => {
    const list = [
      occ({ title: "Lago", allDay: true, start: "2026-11-14", end: "2026-11-16" }),
      occ({ title: "Notte", start: "2026-11-12T23:00", end: "2026-11-13T01:00" }),
      occ({ title: "Fuori", start: "2026-12-30T10:00", end: "2026-12-30T11:00" }),
    ];
    const busy = busyDays(list, "2026-11-13", "2026-12-01");
    expect([...busy].sort()).toEqual(["2026-11-13", "2026-11-14", "2026-11-15"]);
  });
});
