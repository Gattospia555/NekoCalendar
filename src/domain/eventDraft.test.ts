import { describe, expect, it } from "vitest";
import {
  draftForNew,
  draftFromEvent,
  eventFromDraft,
  ruleOf,
  validateDraft,
  type EventDraft,
} from "./eventDraft";

const identity = { id: "id1", tzid: "Europe/Rome", updatedHlc: "h1" };

function draft(overrides: Partial<EventDraft> = {}): EventDraft {
  return { ...draftForNew("2026-11-12", "pers"), title: "Ritiro pacco", ...overrides };
}

describe("bozza di un nuovo evento", () => {
  it("parte dalle 9:00 per un'ora con un promemoria di 10 minuti", () => {
    const d = draftForNew("2026-11-12", "pers");
    expect([d.startTime, d.endTime, d.endDate, d.reminders, d.repeat]).toEqual([
      "09:00",
      "10:00",
      "2026-11-12",
      [10],
      "none",
    ]);
  });

  it("passa al giorno dopo se l'evento inizia alle 23:30", () => {
    const d = draftForNew("2026-11-12", "pers", "event", "23:30");
    expect([d.endDate, d.endTime]).toEqual(["2026-11-13", "00:30"]);
  });

  it("imposta compleanni annuali di tutto il giorno e task senza durata", () => {
    const birthday = draftForNew("2026-11-12", "pers", "birthday");
    expect([birthday.allDay, birthday.repeat, birthday.reminders]).toEqual([
      true,
      "yearly",
      [1440],
    ]);
    const task = draftForNew("2026-11-12", "pers", "task", "12:00");
    expect([task.endTime, task.reminders]).toEqual(["12:00", []]);
  });
});

describe("controlli", () => {
  it("accetta una bozza corretta", () => {
    expect(validateDraft(draft())).toEqual({});
  });

  it("segnala titolo, calendario, colore e orari sbagliati", () => {
    expect(
      validateDraft(
        draft({ title: "  ", calendarId: "", color: "rosso", startTime: "25:00", endDate: "boh" }),
      ),
    ).toEqual({
      title: "errors.titleRequired",
      calendarId: "errors.calendarRequired",
      color: "errors.colorInvalid",
      start: "errors.startInvalid",
      end: "errors.endInvalid",
    });
    expect(validateDraft(draft({ title: "x".repeat(201) })).title).toBe("errors.titleTooLong");
    expect(validateDraft(draft({ endTime: "08:00" })).end).toBe("errors.endBeforeStart");
    expect(validateDraft(draft({ allDay: true, endDate: "2026-11-11" })).end).toBe(
      "errors.endBeforeStart",
    );
    expect(validateDraft(draft({ kind: "task", endDate: "boh" }))).toEqual({});
  });

  it("segnala ripetizioni e promemoria non validi", () => {
    expect(validateDraft(draft({ repeat: "daily", interval: 0 })).repeat).toBe(
      "errors.intervalInvalid",
    );
    expect(validateDraft(draft({ repeat: "daily", repeatEnd: "count", count: 0 })).repeat).toBe(
      "errors.countInvalid",
    );
    expect(
      validateDraft(draft({ repeat: "daily", repeatEnd: "until", until: "2026-11-01" })).repeat,
    ).toBe("errors.untilInvalid");
    expect(validateDraft(draft({ repeat: "custom", customRule: "boh" })).repeat).toBe(
      "errors.repeatInvalid",
    );
    expect(validateDraft(draft({ reminders: [-5] })).reminders).toBe("errors.reminderInvalid");
  });
});

describe("conversione in evento", () => {
  it("crea un evento a orario ripulendo i testi e ordinando i promemoria", () => {
    const event = eventFromDraft(
      draft({ title: "  Cena  ", location: " Da Gino ", reminders: [60, 10, 60] }),
      identity,
    );
    expect(event).toMatchObject({
      id: "id1",
      title: "Cena",
      location: "Da Gino",
      start: "2026-11-12T09:00",
      end: "2026-11-12T10:00",
      tzid: "Europe/Rome",
      rrule: null,
      reminders: [10, 60],
      updatedHlc: "h1",
      deleted: false,
    });
  });

  it("salva la fine esclusiva per gli eventi di tutto il giorno", () => {
    const event = eventFromDraft(draft({ allDay: true, endDate: "2026-11-15" }), identity);
    expect([event.start, event.end]).toEqual(["2026-11-12", "2026-11-16"]);
  });

  it("un task ha solo la scadenza e ricorda se è completato", () => {
    const event = eventFromDraft(draft({ kind: "task", startTime: "12:00", done: true }), identity);
    expect([event.start, event.end, event.done]).toEqual([
      "2026-11-12T12:00",
      "2026-11-12T12:00",
      true,
    ]);
    expect(eventFromDraft(draft({ done: true }), identity).done).toBe(false);
  });

  it("costruisce la regola di ripetizione", () => {
    expect(ruleOf(draft({ repeat: "weekly", byDay: [0, 3] }))).toBe("FREQ=WEEKLY;BYDAY=MO,TH");
    expect(ruleOf(draft({ repeat: "monthly", repeatEnd: "count", count: 6 }))).toBe(
      "FREQ=MONTHLY;COUNT=6",
    );
    expect(
      ruleOf(draft({ repeat: "yearly", allDay: true, repeatEnd: "until", until: "2030-01-01" })),
    ).toBe("FREQ=YEARLY;UNTIL=20300101");
    expect(ruleOf(draft({ repeat: "custom", customRule: "FREQ=MONTHLY;BYDAY=-1FR" }))).toBe(
      "FREQ=MONTHLY;BYDAY=-1FR",
    );
    expect(ruleOf(draft())).toBeNull();
  });

  it("rifiuta di convertire una bozza non valida", () => {
    expect(() => eventFromDraft(draft({ title: "" }), identity)).toThrow(RangeError);
  });

  it("ricostruisce la stessa bozza da un evento salvato", () => {
    const original = draft({
      repeat: "weekly",
      interval: 2,
      byDay: [1],
      repeatEnd: "count",
      count: 4,
      location: "Palestra",
    });
    const back = draftFromEvent(eventFromDraft(original, identity));
    expect(back).toMatchObject({
      repeat: "weekly",
      interval: 2,
      byDay: [1],
      repeatEnd: "count",
      count: 4,
      location: "Palestra",
      startTime: "09:00",
      endTime: "10:00",
    });
    const allDay = draftFromEvent(
      eventFromDraft(draft({ allDay: true, endDate: "2026-11-15" }), identity),
    );
    expect([allDay.endDate, allDay.allDay]).toEqual(["2026-11-15", true]);
    const custom = draftFromEvent(
      eventFromDraft(draft({ repeat: "custom", customRule: "FREQ=MONTHLY;BYDAY=-1FR" }), identity),
    );
    expect([custom.repeat, custom.customRule]).toEqual(["custom", "FREQ=MONTHLY;BYDAY=-1FR"]);
    const until = draftFromEvent(
      eventFromDraft(draft({ repeat: "daily", repeatEnd: "until", until: "2026-12-31" }), identity),
    );
    expect([until.repeatEnd, until.until]).toEqual(["until", "2026-12-31"]);
  });
});
