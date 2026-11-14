import { describe, expect, it } from "vitest";
import { nekoMessage, skyPeriod } from "./neko";
import type { Occurrence } from "./types";

function occ(overrides: Partial<Occurrence>): Occurrence {
  return {
    key: overrides.title ?? "k",
    eventId: "e",
    calendarId: "pers",
    kind: "event",
    title: "x",
    location: "",
    allDay: false,
    start: "2026-11-13T17:00",
    end: "2026-11-13T18:00",
    occurrenceStart: "2026-11-13T17:00",
    color: "#6fa35a",
    recurring: false,
    done: false,
    readOnly: false,
    years: null,
    ...overrides,
  };
}

const pacco = occ({ title: "Ritiro pacco" });
const cena = occ({ title: "Cena", start: "2026-11-13T20:00", end: "2026-11-13T22:00" });
const lago = occ({ title: "Lago", allDay: true, start: "2026-11-14", end: "2026-11-15" });
const standup = occ({ title: "Stand-up", start: "2026-11-14T09:30", end: "2026-11-14T09:45" });

describe("cielo", () => {
  it("divide la giornata in mattina, pomeriggio, sera e notte", () => {
    expect(skyPeriod("2026-11-13T04:59")).toBe("night");
    expect(skyPeriod("2026-11-13T05:00")).toBe("morning");
    expect(skyPeriod("2026-11-13T12:00")).toBe("afternoon");
    expect(skyPeriod("2026-11-13T18:00")).toBe("evening");
    expect(skyPeriod("2026-11-13T22:00")).toBe("night");
  });
});

describe("cosa dice Neko", () => {
  it("avvisa quando un impegno è vicino, con i minuti che mancano", () => {
    const message = nekoMessage("2026-11-13T16:37", [pacco, cena]);
    expect(message).toMatchObject({ key: "soon", title: "Ritiro pacco", minutes: 23 });
    expect(message.sleepy).toBe(false);
  });

  it("dice l'ora di un impegno più tardi nella giornata", () => {
    expect(nekoMessage("2026-11-13T14:00", [pacco, cena])).toMatchObject({
      key: "later",
      title: "Ritiro pacco",
      time: "17:00",
    });
  });

  it("riconosce un impegno in corso", () => {
    expect(nekoMessage("2026-11-13T17:20", [pacco, cena])).toMatchObject({
      key: "now",
      title: "Ritiro pacco",
    });
  });

  it("ricorda un'attività di oggi quando non ci sono altri impegni", () => {
    const task = occ({ title: "Bolletta", kind: "task", start: "2026-11-13T00:00" });
    expect(nekoMessage("2026-11-13T15:00", [task])).toMatchObject({
      key: "task",
      title: "Bolletta",
    });
    expect(nekoMessage("2026-11-13T15:00", [{ ...task, done: true }]).key).toBe("free");
  });

  it("la sera parla di domani, la notte ha sonno", () => {
    expect(nekoMessage("2026-11-13T19:00", [lago])).toMatchObject({
      key: "tomorrow",
      title: "Lago",
      time: "",
    });
    expect(nekoMessage("2026-11-13T23:10", [standup])).toMatchObject({
      key: "sleepyTomorrow",
      title: "Stand-up",
      time: "09:30",
      sleepy: true,
    });
    // Dopo mezzanotte "domani" è il giorno stesso.
    expect(nekoMessage("2026-11-14T01:00", [standup])).toMatchObject({
      key: "sleepyTomorrow",
      title: "Stand-up",
    });
    expect(nekoMessage("2026-11-13T23:10", []).key).toBe("sleepy");
  });

  it("ignora festività e impegni già fatti; senza nulla è giornata libera", () => {
    const festa = occ({ title: "Festa", kind: "holiday", allDay: true, start: "2026-11-14" });
    expect(nekoMessage("2026-11-13T19:00", [festa]).key).toBe("free");
    expect(nekoMessage("2026-11-13T10:00", []).key).toBe("free");
  });
});
