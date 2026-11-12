import { describe, expect, it } from "vitest";
import { draftForNew, draftForOccurrence } from "@/domain/eventDraft";
import { buildOccurrences } from "@/domain/occurrences";
import { DEFAULT_SETTINGS } from "@/domain/types";
import { CalendarService, parseSettings } from "./calendarService";
import { MemoryStore } from "@/infrastructure/storage/memoryStore";

const names = { personal: "Personale", work: "Lavoro", birthdays: "Compleanni" };

async function start(store = new MemoryStore()) {
  let now = Date.UTC(2026, 10, 12, 16, 0);
  let seed = 0;
  const result = await CalendarService.start(
    store,
    {
      timeZone: "Europe/Rome",
      now: () => (now += 1_000),
      random: (length) => new Uint8Array(length).map(() => (seed += 17) % 256),
    },
    names,
  );
  return { ...result, store };
}

describe("primo avvio", () => {
  it("crea l'id del dispositivo e i tre calendari predefiniti, una volta sola", async () => {
    const { snapshot, store } = await start();
    expect(snapshot.calendars.map((c) => c.name)).toEqual(["Personale", "Lavoro", "Compleanni"]);
    expect(snapshot.settings.deviceId).toMatch(/^[a-f0-9]{12}$/);

    const again = await start(store);
    expect(again.snapshot.calendars).toHaveLength(3);
    expect(again.snapshot.settings.deviceId).toBe(snapshot.settings.deviceId);
  });
});

describe("eventi", () => {
  it("crea, modifica e cancella un evento", async () => {
    const { service, snapshot } = await start();
    const calendarId = snapshot.calendars[0].id;
    const created = await service.saveDraft({
      ...draftForNew("2026-11-13", calendarId, "event", "20:00"),
      title: "Cena",
    });
    expect(created.tzid).toBe("Europe/Rome");

    const updated = await service.saveDraft(
      { ...draftForNew("2026-11-13", calendarId), title: "Cena con Marco" },
      created,
    );
    expect(updated.id).toBe(created.id);
    expect(updated.updatedHlc > created.updatedHlc).toBe(true);
    expect((await service.load()).events.map((e) => e.title)).toEqual(["Cena con Marco"]);

    await service.deleteEvent(updated);
    expect((await service.load()).events[0].deleted).toBe(true);
  });

  it("cancella o modifica una sola ripetizione", async () => {
    const { service, snapshot } = await start();
    const calendars = snapshot.calendars;
    const weekly = await service.saveDraft({
      ...draftForNew("2026-11-02", calendars[0].id, "event", "18:30"),
      title: "Palestra",
      repeat: "weekly",
      byDay: [0],
    });

    let data = await service.load();
    await service.deleteOccurrence(weekly, "2026-11-09T18:30", data.exceptions);
    data = await service.load();
    const draft = draftForOccurrence(weekly, {
      start: "2026-11-16T18:30",
      end: "2026-11-16T19:30",
      title: "Palestra",
    });
    await service.editOccurrence(
      weekly,
      "2026-11-16T18:30",
      { ...draft, startTime: "20:00", endTime: "21:00" },
      data.exceptions,
    );
    // Modificare di nuovo la stessa occorrenza aggiorna l'eccezione esistente.
    data = await service.load();
    await service.editOccurrence(
      weekly,
      "2026-11-16T18:30",
      { ...draft, title: "Palestra serale", startTime: "20:00", endTime: "21:00" },
      data.exceptions,
    );

    data = await service.load();
    expect(data.exceptions).toHaveLength(2);
    const list = buildOccurrences({
      ...data,
      from: "2026-11-02",
      to: "2026-11-23",
      displayTimeZone: "Europe/Rome",
      showHolidays: false,
      language: "it",
    });
    expect(list.map((o) => [o.start, o.title])).toEqual([
      ["2026-11-02T18:30", "Palestra"],
      ["2026-11-16T20:00", "Palestra serale"],
    ]);
  });

  it("segna i task come fatti", async () => {
    const { service, snapshot } = await start();
    const task = await service.saveDraft({
      ...draftForNew("2026-11-18", snapshot.calendars[0].id, "task"),
      title: "Bolletta",
    });
    await service.setTaskDone(task, true);
    expect((await service.load()).events[0].done).toBe(true);
  });
});

describe("calendari e impostazioni", () => {
  it("nasconde un calendario e ne crea uno nuovo", async () => {
    const { service, snapshot } = await start();
    await service.setCalendarVisible(snapshot.calendars[1], false);
    const created = await service.createCalendar("  Famiglia  ", "#2f7f86", 3);
    const data = await service.load();
    expect(data.calendars.map((c) => [c.name, c.visible])).toEqual([
      ["Personale", true],
      ["Lavoro", false],
      ["Compleanni", true],
      ["Famiglia", true],
    ]);
    expect(created.name).toBe("Famiglia");
    await expect(service.createCalendar(" ", "#2f7f86", 4)).rejects.toThrow(RangeError);
    await expect(service.createCalendar("X", "verde", 4)).rejects.toThrow(RangeError);
  });

  it("salva le impostazioni e torna ai default per i valori non validi", async () => {
    const { service } = await start();
    await service.saveSettings({
      ...DEFAULT_SETTINGS,
      theme: "dark",
      language: "en",
      displayName: "Alice",
    });
    expect(CalendarService.settingsOf(await service.load())).toEqual({
      ...DEFAULT_SETTINGS,
      theme: "dark",
      language: "en",
      displayName: "Alice",
    });
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("rotto")).toEqual(DEFAULT_SETTINGS);
    expect(
      parseSettings(
        '{"theme":"viola","language":"fr","showHolidays":"si","defaultView":"decade","displayName":7}',
      ),
    ).toEqual(DEFAULT_SETTINGS);
  });
});

describe("archivio in memoria", () => {
  it("protegge l'integrità come il database", async () => {
    const store = new MemoryStore();
    await expect(
      store.saveException({
        id: "x",
        eventId: "manca",
        occurrenceStart: "2026-11-09",
        cancelled: true,
        title: null,
        start: null,
        end: null,
        updatedHlc: "h",
        deleted: false,
      }),
    ).rejects.toThrow();
    const { service, snapshot } = await start(store);
    const event = await service.saveDraft({
      ...draftForNew("2026-11-02", snapshot.calendars[0].id),
      title: "X",
      repeat: "daily",
    });
    await expect(
      service.saveDraft({ ...draftForNew("2026-11-02", "inesistente"), title: "Y" }),
    ).rejects.toThrow();
    await service.deleteOccurrence(event, "2026-11-03T09:00", []);
    await expect(service.deleteOccurrence(event, "2026-11-03T09:00", [])).rejects.toThrow();
  });
});
