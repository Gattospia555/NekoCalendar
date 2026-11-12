import { describe, expect, it } from "vitest";
import initSqlJs, { type Database } from "sql.js";
// La migrazione vera dell'app, letta come testo (stessa usata dal core Rust).
import migration0001 from "../../../src-tauri/migrations/0001_init.sql?raw";
import type { Calendar, CalendarEvent, EventException } from "@/domain/types";
import {
  calendarFromRow,
  calendarToRow,
  eventFromRow,
  eventToRow,
  exceptionFromRow,
  exceptionToRow,
  parseReminders,
  upsert,
  type CalendarRow,
  type EventRow,
  type ExceptionRow,
} from "./rows";

const calendar: Calendar = {
  id: "c1",
  name: "Personale",
  color: "#c58463",
  visible: false,
  sortOrder: 2,
  updatedHlc: "h1",
  deleted: false,
};

const event: CalendarEvent = {
  id: "e1",
  calendarId: "c1",
  kind: "birthday",
  title: "Luca",
  description: "Regalo: libro",
  location: "",
  allDay: true,
  start: "1995-12-03",
  end: "1995-12-04",
  tzid: "Europe/Rome",
  rrule: "FREQ=YEARLY",
  color: null,
  reminders: [1440],
  done: false,
  updatedHlc: "h2",
  deleted: false,
};

const exception: EventException = {
  id: "x1",
  eventId: "e1",
  occurrenceStart: "2026-12-03",
  cancelled: true,
  title: null,
  start: null,
  end: null,
  updatedHlc: "h3",
  deleted: false,
};

/** Database SQLite vero (WebAssembly) con la stessa migrazione dell'app. */
async function migratedDatabase(): Promise<Database> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run("PRAGMA foreign_keys = ON");
  db.exec(migration0001);
  return db;
}

function write(db: Database, table: string, row: object) {
  const { sql, values } = upsert(table, row);
  // sql.js lega i parametri `$1, $2…` per nome.
  db.run(sql, Object.fromEntries(values.map((v, i) => [`$${i + 1}`, v as string | number | null])));
}

function selectAll<T>(db: Database, sql: string): T[] {
  const [result] = db.exec(sql);
  if (!result) return [];
  return result.values.map(
    (values) => Object.fromEntries(result.columns.map((c, i) => [c, values[i]])) as T,
  );
}

describe("conversione righe ⇄ dominio", () => {
  it("andata e ritorno senza perdere nulla", () => {
    expect(calendarFromRow(calendarToRow(calendar))).toEqual(calendar);
    expect(eventFromRow(eventToRow(event))).toEqual(event);
    expect(exceptionFromRow(exceptionToRow(exception))).toEqual(exception);
  });

  it("tollera dati rovinati senza bloccare l'app", () => {
    expect(parseReminders('[10, -1, 2.5, "x", 60]')).toEqual([10, 60]);
    expect(parseReminders("{}")).toEqual([]);
    expect(parseReminders("non json")).toEqual([]);
    expect(eventFromRow({ ...eventToRow(event), kind: "boh" }).kind).toBe("event");
  });

  it("costruisce un upsert parametrico e rifiuta nomi pericolosi", () => {
    const { sql, values } = upsert("settings", { key: "theme", value: "dark" });
    expect(sql).toBe(
      "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    );
    expect(values).toEqual(["theme", "dark"]);
    expect(() => upsert("events; DROP TABLE events", {})).toThrow(RangeError);
    expect(() => upsert("events", { "title) --": 1 })).toThrow(RangeError);
  });
});

describe("integrazione con lo schema SQLite reale (migrazione 0001)", () => {
  it("salva, aggiorna e rilegge calendari, eventi, eccezioni e impostazioni", async () => {
    const db = await migratedDatabase();
    write(db, "calendars", calendarToRow(calendar));
    write(db, "events", eventToRow(event));
    write(db, "events", eventToRow({ ...event, title: "Luca 🎂", updatedHlc: "h4" })); // aggiornamento
    write(db, "event_exceptions", exceptionToRow(exception));
    write(db, "settings", { key: "theme", value: "dark" });
    write(db, "settings", { key: "theme", value: "light" });

    expect(selectAll<CalendarRow>(db, "SELECT * FROM calendars").map(calendarFromRow)).toEqual([
      calendar,
    ]);
    expect(selectAll<EventRow>(db, "SELECT * FROM events").map(eventFromRow)).toEqual([
      { ...event, title: "Luca 🎂", updatedHlc: "h4" },
    ]);
    expect(
      selectAll<ExceptionRow>(db, "SELECT * FROM event_exceptions").map(exceptionFromRow),
    ).toEqual([exception]);
    expect(selectAll(db, "SELECT key, value FROM settings")).toEqual([
      { key: "theme", value: "light" },
    ]);
  });

  it("rifiuta un evento in un calendario inesistente", async () => {
    const db = await migratedDatabase();
    expect(() => write(db, "events", eventToRow(event))).toThrow(/FOREIGN KEY/);
  });
});
